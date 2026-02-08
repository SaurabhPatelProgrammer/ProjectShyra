const { v4: uuidv4 } = require('uuid');
const brainService = require('./brain.service');

/**
 * Event Service
 * Processes and routes events between devices, users, and Brain
 * Maintains event history and status tracking
 */
class EventService {
    constructor() {
        // eventId -> event data
        this.events = new Map();

        // Queue for event history (keep last 100 events)
        this.eventHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Create and enrich an event
     */
    createEvent(type, source, data, metadata = {}) {
        const event = {
            eventId: uuidv4(),
            type,
            source,
            data,
            timestamp: new Date().toISOString(),
            sessionId: metadata.sessionId || null,
            status: 'PENDING',
            createdBy: metadata.createdBy || null,
            metadata,
        };

        this.events.set(event.eventId, event);
        this.addToHistory(event);

        console.log(`📨 Event created: ${event.eventId} (${type} from ${source})`);
        return event;
    }

    /**
     * Process event through Brain
     */
    async processEvent(event) {
        try {
            // Update status
            this.updateEventStatus(event.eventId, 'PROCESSING');

            // Send to Brain
            const brainResponse = await brainService.processEventWithRetry(event);

            // Update status
            this.updateEventStatus(event.eventId, 'COMPLETED');

            // Store response
            const eventData = this.events.get(event.eventId);
            eventData.response = brainResponse.data;
            eventData.completedAt = new Date().toISOString();

            console.log(`✅ Event processed: ${event.eventId}`);

            return {
                eventId: event.eventId,
                status: 'COMPLETED',
                response: brainResponse.data,
            };
        } catch (error) {
            // Update status
            this.updateEventStatus(event.eventId, 'FAILED');

            // Store error
            const eventData = this.events.get(event.eventId);
            eventData.error = error.message;
            eventData.failedAt = new Date().toISOString();

            console.error(`❌ Event failed: ${event.eventId} - ${error.message}`);

            throw error;
        }
    }

    /**
     * Update event status
     */
    updateEventStatus(eventId, status) {
        const event = this.events.get(eventId);
        if (event) {
            event.status = status;
            event.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Get event by ID
     */
    getEvent(eventId) {
        return this.events.get(eventId);
    }

    /**
     * Get event status
     */
    getEventStatus(eventId) {
        const event = this.events.get(eventId);
        if (!event) return null;

        return {
            eventId: event.eventId,
            status: event.status,
            type: event.type,
            source: event.source,
            timestamp: event.timestamp,
            completedAt: event.completedAt,
            failedAt: event.failedAt,
            error: event.error,
        };
    }

    /**
     * Add event to history queue
     */
    addToHistory(event) {
        const historyEntry = {
            eventId: event.eventId,
            type: event.type,
            source: event.source,
            timestamp: event.timestamp,
            status: event.status,
        };

        this.eventHistory.unshift(historyEntry);

        // Keep only last maxHistorySize events
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Get event history
     */
    getHistory(limit = 20) {
        return this.eventHistory.slice(0, limit);
    }

    /**
     * Get events by source
     */
    getEventsBySource(source, limit = 20) {
        return Array.from(this.events.values())
            .filter(e => e.source === source)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Get events by session
     */
    getEventsBySession(sessionId, limit = 20) {
        return Array.from(this.events.values())
            .filter(e => e.sessionId === sessionId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Get statistics
     */
    getStats() {
        const events = Array.from(this.events.values());

        return {
            total: events.length,
            pending: events.filter(e => e.status === 'PENDING').length,
            processing: events.filter(e => e.status === 'PROCESSING').length,
            completed: events.filter(e => e.status === 'COMPLETED').length,
            failed: events.filter(e => e.status === 'FAILED').length,
        };
    }

    /**
     * Clean up old events (keep last 1000)
     */
    cleanup() {
        const events = Array.from(this.events.entries())
            .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));

        if (events.length > 1000) {
            const toRemove = events.slice(1000);
            toRemove.forEach(([eventId]) => this.events.delete(eventId));
            console.log(`🧹 Cleaned up ${toRemove.length} old events`);
        }
    }
}

module.exports = new EventService();
