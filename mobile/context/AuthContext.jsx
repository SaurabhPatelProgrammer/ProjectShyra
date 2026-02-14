import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { storage } from '../services/storage';
import socketService from '../services/socket';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await storage.getToken();
            const storedUser = await storage.getUser();

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(storedUser);
                await socketService.connect();
            }
        } catch (error) {
            console.error('Error loading auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await authAPI.login(username, password);

            if (response.success && response.data) {
                const { user: userData, token: authToken } = response.data;

                await storage.setToken(authToken);
                await storage.setUser(userData);

                setToken(authToken);
                setUser(userData);

                await socketService.connect();

                return { success: true };
            }

            return { success: false, error: 'Invalid response' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.error?.message || 'Login failed' };
        }
    };

    const register = async (username, password, name) => {
        try {
            const response = await authAPI.register(username, password, name);

            if (response.success && response.data) {
                const { user: userData, token: authToken } = response.data;

                await storage.setToken(authToken);
                await storage.setUser(userData);

                setToken(authToken);
                setUser(userData);

                await socketService.connect();

                return { success: true };
            }

            return { success: false, error: 'Invalid response' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.error?.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        try {
            socketService.disconnect();
            await storage.clear();
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!token,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
