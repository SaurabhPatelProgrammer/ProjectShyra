import { useState, useEffect } from 'react';
import socketService from '../services/socket';

export function useSocket() {
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const handleConnectionStatus = ({ connected: isConnected }) => {
            setConnected(isConnected);
        };

        const handleBrainResponse = (data) => {
            const message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.response?.text || data.response?.message || 'No response',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, message]);
        };

        socketService.on('connection_status', handleConnectionStatus);
        socketService.on('brain_response', handleBrainResponse);

        if (socketService.isConnected()) {
            setConnected(true);
        }

        return () => {
            socketService.off('connection_status', handleConnectionStatus);
            socketService.off('brain_response', handleBrainResponse);
        };
    }, []);

    const sendMessage = (message, sessionId) => {
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            socketService.sendMessage(message, sessionId);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const sendRobotCommand = (command, data) => {
        try {
            socketService.sendRobotCommand(command, data);
        } catch (error) {
            console.error('Error sending robot command:', error);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return {
        connected,
        messages,
        sendMessage,
        sendRobotCommand,
        clearMessages,
    };
}
