const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Import routes
const deviceRoutes = require('./routes/device.routes');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const chatRoutes = require('./routes/chat.routes');

// Import middlewares
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

/**
 * Initialize Express Application
 */
function createApp() {
    const app = express();

    // Security middleware
    app.use(helmet());

    // CORS
    app.use(cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
    }));

    // Logging
    if (config.server.env === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'SHYRA Nervous System is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.server.env,
        });
    });

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'Welcome to SHYRA Nervous System API',
            version: '1.0.0',
            endpoints: {
                devices: '/api/devices',
                users: '/api/users',
                events: '/api/events',
                chat: '/api/chat',
                health: '/health',
            },
            documentation: 'See README.md for API documentation',
        });
    });

    // API routes
    app.use('/api/devices', deviceRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/chat', chatRoutes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
