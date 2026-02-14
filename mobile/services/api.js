import axios from 'axios';
import config from '../config/constants';
import { storage } from './storage';

const api = axios.create({
    baseURL: config.API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (requestConfig) => {
        const token = await storage.getToken();
        if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            storage.clear();
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

export const authAPI = {
    register: (username, password, name) =>
        api.post(config.API_ENDPOINTS.REGISTER, { username, password, name }),

    login: (username, password) =>
        api.post(config.API_ENDPOINTS.LOGIN, { username, password }),

    getProfile: () => api.get(config.API_ENDPOINTS.PROFILE),
};

export const chatAPI = {
    sendMessage: (message, sessionId) =>
        api.post(config.API_ENDPOINTS.EVENTS_SYNC, {
            type: 'chat',
            source: 'MOBILE_APP',
            data: { query: message },
            sessionId,
        }),

    getHistory: (limit = 50) =>
        api.get(`${config.API_ENDPOINTS.CHAT_HISTORY}?limit=${limit}`),

    getSessions: () => api.get(config.API_ENDPOINTS.CHAT_SESSIONS),
};

export const robotAPI = {
    sendCommand: (command, data = {}) =>
        api.post(config.API_ENDPOINTS.EVENTS, {
            type: 'robot_control',
            source: 'MOBILE_APP',
            data: { command, ...data },
        }),
};

export default api;
