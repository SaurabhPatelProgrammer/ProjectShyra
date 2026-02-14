const API_URL = 'http://192.168.2.111:3000';
const SOCKET_URL = 'http://192.168.2.111:3000';

export default {
    API_URL,
    SOCKET_URL,
    API_ENDPOINTS: {
        REGISTER: '/api/users/register',
        LOGIN: '/api/users/login',
        PROFILE: '/api/users/me',
        EVENTS: '/api/events',
        EVENTS_SYNC: '/api/events/sync',
        CHAT_HISTORY: '/api/chat/history',
        CHAT_SESSIONS: '/api/chat/sessions',
    },
    SOCKET_EVENTS: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        AUTH_SUCCESS: 'auth:success',
        AUTH_ERROR: 'auth:error',
        EVENT_SEND: 'event:send',
        EVENT_RECEIVED: 'event:received',
        BRAIN_RESPONSE: 'brain:response',
        ROBOT_STATUS: 'robot:status',
    },
    STORAGE_KEYS: {
        TOKEN: '@shyra_token',
        USER: '@shyra_user',
    },
};
