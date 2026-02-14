import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/constants';

export const storage = {
    async setToken(token) {
        try {
            await AsyncStorage.setItem(config.STORAGE_KEYS.TOKEN, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    async getToken() {
        try {
            return await AsyncStorage.getItem(config.STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async removeToken() {
        try {
            await AsyncStorage.removeItem(config.STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    async setUser(user) {
        try {
            await AsyncStorage.setItem(config.STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },

    async getUser() {
        try {
            const user = await AsyncStorage.getItem(config.STORAGE_KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async removeUser() {
        try {
            await AsyncStorage.removeItem(config.STORAGE_KEYS.USER);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    },

    async clear() {
        try {
            await AsyncStorage.multiRemove([
                config.STORAGE_KEYS.TOKEN,
                config.STORAGE_KEYS.USER,
            ]);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};
