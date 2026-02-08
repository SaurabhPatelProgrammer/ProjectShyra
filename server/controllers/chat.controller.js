const chatService = require('../services/chat.service');

/**
 * Chat Controller
 * Handles chat history endpoints
 */

/**
 * Get user's chat history
 * GET /api/chat/history
 */
async function getChatHistory(req, res, next) {
    try {
        const { limit, sessionId } = req.query;
        const userId = req.auth.id;

        const history = await chatService.getChatHistory(
            userId,
            parseInt(limit) || 50,
            sessionId
        );

        res.json({
            success: true,
            data: { history },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get specific session chat history
 * GET /api/chat/history/:sessionId
 */
async function getSessionHistory(req, res, next) {
    try {
        const { sessionId } = req.params;

        const history = await chatService.getChatHistoryBySession(sessionId);

        if (!history) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Chat history not found',
                },
            });
        }

        res.json({
            success: true,
            data: history,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all user's chat sessions
 * GET /api/chat/sessions
 */
async function getChatSessions(req, res, next) {
    try {
        const userId = req.auth.id;
        const { limit } = req.query;

        const sessions = await chatService.getUserChatSessions(
            userId,
            parseInt(limit) || 20
        );

        res.json({
            success: true,
            data: { sessions },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete chat history by session
 * DELETE /api/chat/history/:sessionId
 */
async function deleteChatHistory(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.auth.id;

        await chatService.deleteChatHistory(userId, sessionId);

        res.json({
            success: true,
            message: 'Chat history deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get recent messages
 * GET /api/chat/recent
 */
async function getRecentMessages(req, res, next) {
    try {
        const userId = req.auth.id;
        const { limit } = req.query;

        const messages = await chatService.getRecentMessages(
            userId,
            parseInt(limit) || 100
        );

        res.json({
            success: true,
            data: { messages },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get chat statistics
 * GET /api/chat/stats
 */
async function getChatStats(req, res, next) {
    try {
        const userId = req.auth.id;

        const stats = await chatService.getChatStats(userId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getChatHistory,
    getSessionHistory,
    getChatSessions,
    deleteChatHistory,
    getRecentMessages,
    getChatStats,
};
