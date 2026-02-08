const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError } = require('./error.middleware');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            throw new AuthError('No authentication token provided');
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Attach user/device info to request
        req.auth = {
            id: decoded.id,
            type: decoded.type, // 'USER' or 'DEVICE'
            role: decoded.role,
            deviceType: decoded.deviceType, // For devices: ESP32, MOBILE_APP, CAMERA
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AuthError('Invalid authentication token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new AuthError('Authentication token expired'));
        } else {
            next(error);
        }
    }
}

/**
 * Role-based Access Control
 * Checks if authenticated user/device has required role
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.auth) {
            return next(new AuthError('Authentication required'));
        }

        if (!allowedRoles.includes(req.auth.role)) {
            return next(new AuthError('Insufficient permissions'));
        }

        next();
    };
}

/**
 * Device Type Check
 * Ensures only specific device types can access endpoint
 */
function requireDeviceType(...allowedDeviceTypes) {
    return (req, res, next) => {
        if (!req.auth) {
            return next(new AuthError('Authentication required'));
        }

        if (req.auth.type !== 'DEVICE') {
            return next(new AuthError('This endpoint is only accessible by devices'));
        }

        if (!allowedDeviceTypes.includes(req.auth.deviceType)) {
            return next(new AuthError(`Device type ${req.auth.deviceType} not allowed`));
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
    requireDeviceType,
};
