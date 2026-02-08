require('dotenv').config();

/**
 * Centralized Configuration Management for SHYRA Backend
 * Loads and validates environment variables
 */

const config = {
  // Server Configuration
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Python Brain API
  brain: {
    apiUrl: process.env.BRAIN_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.BRAIN_API_TIMEOUT, 10) || 30000,
    endpoints: {
      process: '/api/process',
    },
  },

  // MongoDB
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/shyra_db',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Validate critical configuration
 */
function validateConfig() {
  const requiredVars = [];

  if (config.server.env === 'production') {
    if (config.jwt.secret === 'default-secret-change-in-production') {
      requiredVars.push('JWT_SECRET');
    }
  }

  if (requiredVars.length > 0) {
    console.error('❌ Missing required environment variables:', requiredVars.join(', '));
    process.exit(1);
  }

  console.log('✅ Configuration loaded successfully');
}

validateConfig();

module.exports = config;
