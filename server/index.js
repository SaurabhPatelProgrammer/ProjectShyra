const http = require('http');
const createApp = require('./app');
const socketManager = require('./sockets/socket.manager');
const sessionService = require('./services/session.service');
const eventService = require('./services/event.service');
const brainService = require('./services/brain.service');
const { connectDB, disconnectDB } = require('./config/database');
const config = require('./config');

/**
 * SHYRA Nervous System Server
 * Main entry point for the backend
 */

// Create Express app
const app = createApp();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketManager.initialize(server);

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

server.listen(PORT, HOST, async () => {
    console.log('\n🚀 ═══════════════════════════════════════════════════════');
    console.log('   SHYRA NERVOUS SYSTEM - Production Ready Backend');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log(`   🌐 Server:        http://${HOST}:${PORT}`);
    console.log(`   🧠 Brain API:     ${config.brain.apiUrl}`);
    console.log(`   🔌 Socket.IO:     Enabled`);
    console.log(`   🌍 Environment:   ${config.server.env}`);
    console.log('   ═══════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    console.log('🔍 Connecting to MongoDB...');
    await connectDB();

    // Check Brain connectivity
    console.log('🔍 Checking Brain API connectivity...');
    const isBrainHealthy = await brainService.healthCheck();

    if (isBrainHealthy) {
        console.log('✅ Brain API is reachable and healthy\n');
    } else {
        console.log('⚠️  Brain API is not reachable. Make sure it\'s running at:', config.brain.apiUrl);
        console.log('   The server will continue running, but event processing will fail.\n');
    }

    console.log('📋 Available endpoints:');
    console.log('   GET  /              - API info');
    console.log('   GET  /health        - Health check');
    console.log('   POST /api/users/register       - Register user');
    console.log('   POST /api/users/login          - Login user');
    console.log('   POST /api/devices/register     - Register device');
    console.log('   POST /api/devices/auth         - Authenticate device');
    console.log('   POST /api/events               - Send event (async)');
    console.log('   POST /api/events/sync          - Send event (sync)');
    console.log('   GET  /api/events/history       - Get event history');
    console.log('   GET  /api/events/stats         - Get event statistics\n');

    console.log('💡 Tips:');
    console.log('   - Use Socket.IO for real-time communication');
    console.log('   - Check logs/ folder for detailed logs');
    console.log('   - Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('✅ HTTP server closed');
        await disconnectDB();
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\n\n🛑 SIGINT signal received: closing HTTP server');
    server.close(async () => {
        console.log('✅ HTTP server closed');
        await disconnectDB();
        console.log('👋 Goodbye!\n');
        process.exit(0);
    });
});

// Session cleanup interval (every 15 minutes)
setInterval(() => {
    sessionService.cleanupInactiveSessions();
    eventService.cleanup();
}, 15 * 60 * 1000);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = server;
