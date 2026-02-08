const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { validateEvent } = require('../middlewares/validation.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * Event Routes
 * Handles event submission, processing, and status tracking
 */

// All event routes require authentication
router.use(authenticateToken);

// Event submission
router.post('/', validateEvent, eventController.sendEvent); // Async processing
router.post('/sync', validateEvent, eventController.sendEventSync); // Sync processing

// Event status and history
router.get('/status/:eventId', eventController.getEventStatus);
router.get('/history', eventController.getEventHistory);
router.get('/stats', eventController.getEventStats);
router.get('/sessions', eventController.getSessionStats);

module.exports = router;
