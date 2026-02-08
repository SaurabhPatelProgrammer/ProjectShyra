const axios = require('axios');
const config = require('../config');
const { BrainConnectionError } = require('../middlewares/error.middleware');

/**
 * Brain Service
 * Handles communication with Python AI Brain (FastAPI)
 * Implements retry logic and error handling
 */
class BrainService {
    constructor() {
        this.brainUrl = config.brain.apiUrl;
        this.timeout = config.brain.timeout;

        // Create axios instance with default config
        this.client = axios.create({
            baseURL: this.brainUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request/Response interceptors for logging
        this.client.interceptors.request.use(
            (req) => {
                console.log(`🧠 Brain Request: ${req.method.toUpperCase()} ${req.url}`);
                return req;
            },
            (error) => Promise.reject(error)
        );

        this.client.interceptors.response.use(
            (res) => {
                console.log(`✅ Brain Response: ${res.status} from ${res.config.url}`);
                return res;
            },
            (error) => {
                console.error(`❌ Brain Error: ${error.message}`);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Process event through AI Brain
     * @param {Object} event - Event to process
     * @returns {Promise<Object>} - AI response
     */
    async processEvent(event) {
        try {
            const response = await this.client.post(
                config.brain.endpoints.process,
                {
                    event_type: event.type,
                    source: event.source,
                    data: event.data,
                    timestamp: event.timestamp,
                    session_id: event.sessionId,
                }
            );

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            // Handle different error types
            if (error.code === 'ECONNREFUSED') {
                throw new BrainConnectionError(
                    `Cannot connect to Brain at ${this.brainUrl}. Is the Brain server running?`
                );
            }

            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new BrainConnectionError(
                    `Brain request timed out after ${this.timeout}ms`
                );
            }

            if (error.response) {
                // Brain returned an error response
                throw new BrainConnectionError(
                    `Brain error (${error.response.status}): ${error.response.data?.message || error.message
                    }`
                );
            }

            // Unknown error
            throw new BrainConnectionError(`Brain communication failed: ${error.message}`);
        }
    }

    /**
     * Process event with retry logic
     * @param {Object} event - Event to process
     * @param {Number} maxRetries - Maximum retry attempts
     * @returns {Promise<Object>} - AI response
     */
    async processEventWithRetry(event, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.processEvent(event);
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Brain request failed (attempt ${attempt}/${maxRetries})`);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Health check for Brain API
     * @returns {Promise<Boolean>} - True if Brain is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health', {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            console.error(`❌ Brain health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get Brain connection info
     */
    getConnectionInfo() {
        return {
            url: this.brainUrl,
            timeout: this.timeout,
            endpoints: config.brain.endpoints,
        };
    }
}

module.exports = new BrainService();
