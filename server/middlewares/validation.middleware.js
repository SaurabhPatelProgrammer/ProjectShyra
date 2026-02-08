const { ValidationError } = require('./error.middleware');

/**
 * Validate Event Payload
 * Ensures event has required structure
 */
function validateEvent(req, res, next) {
    const { type, source, data } = req.body;

    const errors = [];

    if (!type || typeof type !== 'string') {
        errors.push('Event type is required and must be a string');
    }

    if (!source || typeof source !== 'string') {
        errors.push('Event source is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
        errors.push('Event data is required and must be an object');
    }

    if (errors.length > 0) {
        return next(new ValidationError(`Invalid event payload: ${errors.join(', ')}`));
    }

    next();
}

/**
 * Validate Device Registration
 */
function validateDeviceRegistration(req, res, next) {
    const { deviceId, deviceType, name } = req.body;

    const errors = [];

    if (!deviceId || typeof deviceId !== 'string') {
        errors.push('deviceId is required and must be a string');
    }

    if (!deviceType || !['ESP32', 'MOBILE_APP', 'CAMERA'].includes(deviceType)) {
        errors.push('deviceType must be one of: ESP32, MOBILE_APP, CAMERA');
    }

    if (!name || typeof name !== 'string') {
        errors.push('name is required and must be a string');
    }

    if (errors.length > 0) {
        return next(new ValidationError(`Invalid device registration: ${errors.join(', ')}`));
    }

    next();
}

/**
 * Validate User Registration/Login
 */
function validateUserCredentials(req, res, next) {
    const { username, password } = req.body;

    const errors = [];

    if (!username || typeof username !== 'string' || username.length < 3) {
        errors.push('username is required and must be at least 3 characters');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('password is required and must be at least 6 characters');
    }

    if (errors.length > 0) {
        return next(new ValidationError(`Invalid credentials: ${errors.join(', ')}`));
    }

    next();
}

module.exports = {
    validateEvent,
    validateDeviceRegistration,
    validateUserCredentials,
};
