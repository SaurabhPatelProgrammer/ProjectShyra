/**
 * Custom Error Classes for SHYRA Backend
 */

class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_ERROR');
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

class BrainConnectionError extends AppError {
    constructor(message = 'Failed to connect to AI Brain') {
        super(message, 503, 'BRAIN_CONNECTION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
    // Set default values
    err.statusCode = err.statusCode || 500;
    err.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

    // Log error
    console.error('❌ Error:', {
        message: err.message,
        code: err.errorCode,
        statusCode: err.statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Send error response
    res.status(err.statusCode).json({
        success: false,
        error: {
            code: err.errorCode,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}

/**
 * 404 Not Found Handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
}

module.exports = {
    AppError,
    AuthError,
    ValidationError,
    BrainConnectionError,
    NotFoundError,
    errorHandler,
    notFoundHandler,
};
