const eventService = require('../services/event.service');
const sessionService = require('../services/session.service');
const chatService = require('../services/chat.service');

/**
 * Event Controller
 * Handles event submission, processing, and status tracking
 */

/**
 * Send event to Brain for processing
 * POST /api/events
 */
async function sendEvent(req, res, next) {
    try {
        const { type, source, data } = req.body;

        // Create event with metadata
        const event = eventService.createEvent(type, source, data, {
            createdBy: req.auth.id,
            sessionId: req.body.sessionId || null,
        });

        // Process event asynchronously (non-blocking)
        eventService.processEvent(event).catch(error => {
            console.error(`❌ Event processing error: ${error.message}`);
        });

        // Return immediately with event ID
        res.status(202).json({
            success: true,
            message: 'Event accepted for processing',
            data: {
                eventId: event.eventId,
                status: event.status,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Send event and wait for response (synchronous)
 * POST /api/events/sync
 */
async function sendEventSync(req, res, next) {
    try {
        const { type, source, data } = req.body;

        // Create event
        const event = eventService.createEvent(type, source, data, {
            createdBy: req.auth.id,
            sessionId: req.body.sessionId || null,
        });

        // Process event and wait for response
        const result = await eventService.processEvent(event);

        // Save to chat history if user is authenticated and has response
        if (req.auth.type === 'USER' && result.response) {
            try {
                const sessionId = req.body.sessionId || event.sessionId || event.eventId;

                // Save user message
                if (data.query || data.command || data.message) {
                    const userMessage = data.query || data.command || data.message;
                    await chatService.saveChatMessage(
                        req.auth.id,
                        sessionId,
                        'user',
                        userMessage,
                        type
                    );
                }

                // Save AI response
                if (result.response.text || result.response.message) {
                    const aiMessage = result.response.text || result.response.message;
                    await chatService.saveChatMessage(
                        req.auth.id,
                        sessionId,
                        'assistant',
                        aiMessage,
                        type
                    );
                }
            } catch (chatError) {
                console.error('Failed to save chat history:', chatError);
                // Don't fail the request if chat saving fails
            }
        }

        res.json({
            success: true,
            message: 'Event processed successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get event status
 * GET /api/events/status/:eventId
 */
function getEventStatus(req, res, next) {
    try {
        const { eventId } = req.params;

        const status = eventService.getEventStatus(eventId);

        if (!status) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Event not found',
                },
            });
        }

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get event history
 * GET /api/events/history
 */
function getEventHistory(req, res, next) {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const history = eventService.getHistory(limit);

        res.json({
            success: true,
            data: { events: history },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get event statistics
 * GET /api/events/stats
 */
function getEventStats(req, res, next) {
    try {
        const stats = eventService.getStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get session statistics
 * GET /api/events/sessions
 */
function getSessionStats(req, res, next) {
    try {
        const stats = sessionService.getStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendEvent,
    sendEventSync,
    getEventStatus,
    getEventHistory,
    getEventStats,
    getSessionStats,
};
