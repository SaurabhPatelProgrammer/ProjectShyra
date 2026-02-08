const mongoose = require('mongoose');
const config = require('./index');

/**
 * MongoDB Database Connection
 * Connects to MongoDB Atlas using Mongoose
 */

let isConnected = false;

/**
 * Connect to MongoDB
 */
async function connectDB() {
    if (isConnected) {
        console.log('✅ Already connected to MongoDB');
        return;
    }

    try {
        const options = {
            // useNewUrlParser: true, // deprecated in mongoose 6+
            // useUnifiedTopology: true, // deprecated in mongoose 6+
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(config.mongodb.uri, options);

        isConnected = true;
        console.log('✅ MongoDB connected successfully');
        console.log(`   Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ MongoDB disconnect error:', error.message);
    }
}

/**
 * MongoDB connection event handlers
 */
mongoose.connection.on('connected', () => {
    console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
    isConnected = false;
});

/**
 * Get connection status
 */
function getConnectionStatus() {
    return {
        isConnected,
        readyState: mongoose.connection.readyState,
        database: mongoose.connection.name,
        host: mongoose.connection.host,
    };
}

module.exports = {
    connectDB,
    disconnectDB,
    getConnectionStatus,
    mongoose,
};
