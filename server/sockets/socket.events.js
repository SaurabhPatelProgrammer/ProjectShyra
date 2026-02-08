/**
 * Socket.IO Event Types
 * Centralized event definitions for client-server communication
 */

module.exports = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // Authentication
    AUTH: 'auth',
    AUTH_SUCCESS: 'auth:success',
    AUTH_ERROR: 'auth:error',

    // Device events
    DEVICE_REGISTER: 'device:register',
    DEVICE_REGISTERED: 'device:registered',
    DEVICE_STATUS: 'device:status',

    // User events
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',

    // Event submission
    EVENT_SEND: 'event:send',
    EVENT_RECEIVED: 'event:received',
    EVENT_PROCESSING: 'event:processing',
    EVENT_COMPLETED: 'event:completed',
    EVENT_FAILED: 'event:failed',

    // Brain response routing
    BRAIN_RESPONSE: 'brain:response',

    // System events
    SYSTEM_MESSAGE: 'system:message',
    PING: 'ping',
    PONG: 'pong',
};
