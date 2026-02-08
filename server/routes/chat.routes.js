const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * Chat Routes
 * Handles chat history retrieval and management
 * All routes require authentication
 */

router.use(authenticateToken);

// Get chat history
router.get('/history', chatController.getChatHistory);
router.get('/history/:sessionId', chatController.getSessionHistory);

// Get chat sessions
router.get('/sessions', chatController.getChatSessions);

// Get recent messages
router.get('/recent', chatController.getRecentMessages);

// Get chat statistics
router.get('/stats', chatController.getChatStats);

// Delete chat history
router.delete('/history/:sessionId', chatController.deleteChatHistory);

module.exports = router;
