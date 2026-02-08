const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const sessionService = require('../services/session.service');
const eventService = require('../services/event.service');
const authService = require('../services/auth.service');
const EVENTS = require('./socket.events');

/**
 * Socket.IO Manager
 * Handles real-time bidirectional communication
 */
class SocketManager {
    constructor() {
        this.io = null;
        this.connectedClients = new Map(); // socketId -> client info
    }

    /**
     * Initialize Socket.IO server
     */
    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: config.cors.origin,
                credentials: config.cors.credentials,
            },
            transports: ['websocket', 'polling'],
        });

        // Authentication middleware
        this.io.use(this.authenticationMiddleware.bind(this));

        // Connection handler
        this.io.on(EVENTS.CONNECTION, this.handleConnection.bind(this));

        console.log('✅ Socket.IO initialized');
        return this.io;
    }

    /**
     * Authentication middleware for Socket.IO
     */
    async authenticationMiddleware(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // Verify JWT token
            const decoded = jwt.verify(token, config.jwt.secret);

            // Attach auth info to socket
            socket.auth = {
                id: decoded.id,
                type: decoded.type,
                role: decoded.role,
                deviceType: decoded.deviceType,
            };

            next();
        } catch (error) {
            next(new Error('Authentication failed: ' + error.message));
        }
    }

    /**
     * Handle new client connection
     */
    handleConnection(socket) {
        console.log(`🔌 Client connected: ${socket.id} (${socket.auth.type} ${socket.auth.id})`);

        // Create session
        const session = sessionService.createSession(
            socket.auth.id,
            socket.auth.type,
            socket.id,
            {
                deviceType: socket.auth.deviceType,
                connectedAt: new Date().toISOString(),
            }
        );

        // Store client info
        this.connectedClients.set(socket.id, {
            sessionId: session.sessionId,
            entityId: socket.auth.id,
            entityType: socket.auth.type,
            deviceType: socket.auth.deviceType,
        });

        // Send authentication success
        socket.emit(EVENTS.AUTH_SUCCESS, {
            sessionId: session.sessionId,
            message: 'Connected to SHYRA Nervous System',
        });

        // Join room for targeted messaging
        socket.join(`${socket.auth.type}:${socket.auth.id}`);

        // Register event handlers
        this.registerEventHandlers(socket);

        // Handle disconnection
        socket.on(EVENTS.DISCONNECT, () => this.handleDisconnection(socket));
    }

    /**
     * Register event handlers for socket
     */
    registerEventHandlers(socket) {
        // Event submission
        socket.on(EVENTS.EVENT_SEND, (data) => this.handleEventSend(socket, data));

        // Ping-pong for connection health
        socket.on(EVENTS.PING, () => {
            socket.emit(EVENTS.PONG);

            // Update session activity
            const session = sessionService.getSessionBySocketId(socket.id);
            if (session) {
                sessionService.updateActivity(session.sessionId);
            }
        });
    }

    /**
     * Handle event submission via Socket.IO
     */
    async handleEventSend(socket, data) {
        try {
            const { type, source, eventData } = data;

            if (!type || !source || !eventData) {
                socket.emit(EVENTS.EVENT_FAILED, {
                    error: 'Invalid event payload. Required: type, source, eventData',
                });
                return;
            }

            // Get session
            const session = sessionService.getSessionBySocketId(socket.id);

            // Create event
            const event = eventService.createEvent(type, source, eventData, {
                createdBy: socket.auth.id,
                sessionId: session?.sessionId,
            });

            // Emit event received acknowledgment
            socket.emit(EVENTS.EVENT_RECEIVED, {
                eventId: event.eventId,
                status: 'PENDING',
            });

            // Process event through Brain
            socket.emit(EVENTS.EVENT_PROCESSING, { eventId: event.eventId });

            const result = await eventService.processEvent(event);

            // Emit event completed
            socket.emit(EVENTS.EVENT_COMPLETED, {
                eventId: event.eventId,
                response: result.response,
            });

            // If this is a device event, also notify the user's mobile app
            if (socket.auth.type === 'DEVICE') {
                this.broadcastToUsers(EVENTS.BRAIN_RESPONSE, {
                    eventId: event.eventId,
                    source: source,
                    response: result.response,
                });
            }

            // If this is a user event, notify connected devices
            if (socket.auth.type === 'USER') {
                this.broadcastToDevices(EVENTS.BRAIN_RESPONSE, {
                    eventId: event.eventId,
                    source: source,
                    response: result.response,
                });
            }
        } catch (error) {
            console.error(`❌ Socket event error: ${error.message}`);
            socket.emit(EVENTS.EVENT_FAILED, {
                error: error.message,
            });
        }
    }

    /**
     * Handle client disconnection
     */
    handleDisconnection(socket) {
        console.log(`🔌 Client disconnected: ${socket.id}`);

        // End session
        sessionService.endSessionBySocketId(socket.id);

        // Remove from connected clients
        this.connectedClients.delete(socket.id);
    }

    /**
     * Broadcast to all users
     */
    broadcastToUsers(event, data) {
        this.io.to('USER').emit(event, data);
    }

    /**
     * Broadcast to all devices
     */
    broadcastToDevices(event, data) {
        this.io.to('DEVICE').emit(event, data);
    }

    /**
     * Send to specific entity (user or device)
     */
    sendToEntity(entityType, entityId, event, data) {
        this.io.to(`${entityType}:${entityId}`).emit(event, data);
    }

    /**
     * Broadcast system message to all clients
     */
    broadcastSystemMessage(message) {
        this.io.emit(EVENTS.SYSTEM_MESSAGE, {
            message,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get connected clients info
     */
    getConnectedClients() {
        return Array.from(this.connectedClients.values());
    }

    /**
     * Get Socket.IO instance
     */
    getIO() {
        return this.io;
    }
}

module.exports = new SocketManager();
