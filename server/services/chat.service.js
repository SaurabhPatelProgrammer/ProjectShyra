const ChatHistory = require('../models/ChatHistory.model');
const { ValidationError } = require('../middlewares/error.middleware');

/**
 * Chat Service
 * Manages chat history between users and SHYRA
 */
class ChatService {
    /**
     * Save a chat message
     */
    async saveChatMessage(userId, sessionId, role, content, eventType = 'chat') {
        try {
            // Find or create chat history for this session
            let chatHistory = await ChatHistory.findOne({ userId, sessionId });

            if (!chatHistory) {
                chatHistory = new ChatHistory({
                    userId,
                    sessionId,
                    messages: [],
                });
            }

            // Add message
            await chatHistory.addMessage(role, content, eventType);

            return {
                success: true,
                messageId: chatHistory.messages[chatHistory.messages.length - 1]._id,
            };
        } catch (error) {
            console.error('Error saving chat message:', error);
            throw error;
        }
    }

    /**
     * Get chat history for a user
     */
    async getChatHistory(userId, limit = 50, sessionId = null) {
        try {
            const query = { userId, isActive: true };

            if (sessionId) {
                query.sessionId = sessionId;
            }

            const chatHistories = await ChatHistory.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return chatHistories.map(chat => ({
                sessionId: chat.sessionId,
                messages: chat.messages,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
            }));
        } catch (error) {
            console.error('Error getting chat history:', error);
            throw error;
        }
    }

    /**
     * Get chat history by session ID
     */
    async getChatHistoryBySession(sessionId) {
        try {
            const chatHistory = await ChatHistory.findOne({ sessionId, isActive: true })
                .lean();

            if (!chatHistory) {
                return null;
            }

            return {
                sessionId: chatHistory.sessionId,
                userId: chatHistory.userId,
                messages: chatHistory.messages,
                createdAt: chatHistory.createdAt,
                updatedAt: chatHistory.updatedAt,
            };
        } catch (error) {
            console.error('Error getting chat history by session:', error);
            throw error;
        }
    }

    /**
     * Get all chat sessions for a user
     */
    async getUserChatSessions(userId, limit = 20) {
        try {
            const sessions = await ChatHistory.find({ userId, isActive: true })
                .select('sessionId createdAt updatedAt messages')
                .sort({ updatedAt: -1 })
                .limit(limit)
                .lean();

            return sessions.map(session => ({
                sessionId: session.sessionId,
                messageCount: session.messages.length,
                lastMessage: session.messages[session.messages.length - 1],
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            }));
        } catch (error) {
            console.error('Error getting user chat sessions:', error);
            throw error;
        }
    }

    /**
     * Delete chat history by session ID
     */
    async deleteChatHistory(userId, sessionId) {
        try {
            const result = await ChatHistory.updateOne(
                { userId, sessionId },
                { isActive: false }
            );

            if (result.modifiedCount === 0) {
                throw new ValidationError('Chat history not found');
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting chat history:', error);
            throw error;
        }
    }

    /**
     * Get recent messages across all sessions
     */
    async getRecentMessages(userId, limit = 100) {
        try {
            const chatHistories = await ChatHistory.find({ userId, isActive: true })
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean();

            // Flatten all messages and sort by timestamp
            const allMessages = [];
            chatHistories.forEach(chat => {
                chat.messages.forEach(msg => {
                    allMessages.push({
                        sessionId: chat.sessionId,
                        role: msg.role,
                        content: msg.content,
                        eventType: msg.eventType,
                        timestamp: msg.timestamp,
                    });
                });
            });

            // Sort by timestamp descending and limit
            return allMessages
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting recent messages:', error);
            throw error;
        }
    }

    /**
     * Get chat statistics for a user
     */
    async getChatStats(userId) {
        try {
            const chatHistories = await ChatHistory.find({ userId, isActive: true });

            const totalSessions = chatHistories.length;
            const totalMessages = chatHistories.reduce((sum, chat) => sum + chat.messages.length, 0);

            const userMessages = chatHistories.reduce((sum, chat) => {
                return sum + chat.messages.filter(m => m.role === 'user').length;
            }, 0);

            const assistantMessages = chatHistories.reduce((sum, chat) => {
                return sum + chat.messages.filter(m => m.role === 'assistant').length;
            }, 0);

            return {
                totalSessions,
                totalMessages,
                userMessages,
                assistantMessages,
            };
        } catch (error) {
            console.error('Error getting chat stats:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();
