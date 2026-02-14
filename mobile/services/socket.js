import { io } from 'socket.io-client';
import config from '../config/constants';
import { storage } from './storage';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.listeners = new Map();
    }

    async connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        const token = await storage.getToken();

        this.socket = io(config.SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
            this.connected = true;
            this.emit('connection_status', { connected: true });
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            this.connected = false;
            this.emit('connection_status', { connected: false });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.emit('connection_error', error);
        });

        this.socket.on(config.SOCKET_EVENTS.AUTH_SUCCESS, (data) => {
            console.log('✅ Socket authenticated');
            this.emit('auth_success', data);
        });

        this.socket.on(config.SOCKET_EVENTS.AUTH_ERROR, (error) => {
            console.error('❌ Socket auth error:', error);
            this.emit('auth_error', error);
        });

        this.socket.on(config.SOCKET_EVENTS.BRAIN_RESPONSE, (data) => {
            console.log('🧠 Brain response received');
            this.emit('brain_response', data);
        });

        this.socket.on(config.SOCKET_EVENTS.EVENT_RECEIVED, (data) => {
            this.emit('event_received', data);
        });

        this.socket.on(config.SOCKET_EVENTS.ROBOT_STATUS, (data) => {
            this.emit('robot_status', data);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.listeners.clear();
        }
    }

    sendMessage(message, sessionId) {
        if (!this.socket?.connected) {
            throw new Error('Socket not connected');
        }

        this.socket.emit(config.SOCKET_EVENTS.EVENT_SEND, {
            type: 'chat',
            source: 'MOBILE_APP',
            data: { query: message },
            sessionId,
        });
    }

    sendRobotCommand(command, data = {}) {
        if (!this.socket?.connected) {
            throw new Error('Socket not connected');
        }

        this.socket.emit(config.SOCKET_EVENTS.EVENT_SEND, {
            type: 'robot_control',
            source: 'MOBILE_APP',
            data: { command, ...data },
        });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in listener for ${event}:`, error);
            }
        });
    }

    isConnected() {
        return this.connected && this.socket?.connected;
    }
}

export default new SocketService();
