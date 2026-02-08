const { v4: uuidv4 } = require('uuid');

/**
 * Session Service
 * Manages active sessions for devices and users
 * Tracks Socket.IO connections and session state
 * TODO: Replace with Redis for multi-server scaling
 */
class SessionService {
    constructor() {
        // sessionId -> session data
        this.sessions = new Map();

        // userId/deviceId -> sessionId[] (one user/device can have multiple sessions)
        this.userSessions = new Map();

        // socketId -> sessionId
        this.socketSessions = new Map();
    }

    /**
     * Create a new session
     */
    createSession(entityId, entityType, socketId, metadata = {}) {
        const sessionId = uuidv4();

        const session = {
            sessionId,
            entityId, // userId or deviceId
            entityType, // 'USER' or 'DEVICE'
            socketId,
            metadata,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
        };

        this.sessions.set(sessionId, session);
        this.socketSessions.set(socketId, sessionId);

        // Track user/device sessions
        if (!this.userSessions.has(entityId)) {
            this.userSessions.set(entityId, []);
        }
        this.userSessions.get(entityId).push(sessionId);

        console.log(`✅ Session created: ${sessionId} for ${entityType} ${entityId}`);
        return session;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Get session by socket ID
     */
    getSessionBySocketId(socketId) {
        const sessionId = this.socketSessions.get(socketId);
        return sessionId ? this.sessions.get(sessionId) : null;
    }

    /**
     * Get all sessions for a user/device
     */
    getSessionsForEntity(entityId) {
        const sessionIds = this.userSessions.get(entityId) || [];
        return sessionIds.map(id => this.sessions.get(id)).filter(Boolean);
    }

    /**
     * Update session activity timestamp
     */
    updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date().toISOString();
        }
    }

    /**
     * End session by ID
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Remove from all maps
        this.sessions.delete(sessionId);
        this.socketSessions.delete(session.socketId);

        // Remove from user sessions
        const entitySessions = this.userSessions.get(session.entityId);
        if (entitySessions) {
            const index = entitySessions.indexOf(sessionId);
            if (index > -1) {
                entitySessions.splice(index, 1);
            }
            if (entitySessions.length === 0) {
                this.userSessions.delete(session.entityId);
            }
        }

        console.log(`✅ Session ended: ${sessionId}`);
    }

    /**
     * End session by socket ID
     */
    endSessionBySocketId(socketId) {
        const sessionId = this.socketSessions.get(socketId);
        if (sessionId) {
            this.endSession(sessionId);
        }
    }

    /**
     * Get all active sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }

    /**
     * Clean up inactive sessions (older than timeout)
     */
    cleanupInactiveSessions(timeoutMs = 3600000) { // Default 1 hour
        const now = Date.now();
        const sessionsToRemove = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            const lastActivity = new Date(session.lastActivity).getTime();
            if (now - lastActivity > timeoutMs) {
                sessionsToRemove.push(sessionId);
            }
        }

        sessionsToRemove.forEach(id => this.endSession(id));

        if (sessionsToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${sessionsToRemove.length} inactive sessions`);
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalSessions: this.sessions.size,
            uniqueEntities: this.userSessions.size,
            sessions: this.getAllSessions().map(s => ({
                sessionId: s.sessionId,
                entityId: s.entityId,
                entityType: s.entityType,
                createdAt: s.createdAt,
                lastActivity: s.lastActivity,
            })),
        };
    }
}

module.exports = new SessionService();
