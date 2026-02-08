const authService = require('../services/auth.service');

/**
 * User Controller
 * Handles user registration, authentication, and profile management
 */

/**
 * Register a new user
 * POST /api/users/register
 */
async function registerUser(req, res, next) {
    try {
        const { username, password, name } = req.body;

        const result = await authService.registerUser(username, password, name);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Login user
 * POST /api/users/login
 */
async function loginUser(req, res, next) {
    try {
        const { username, password } = req.body;

        const result = await authService.loginUser(username, password);

        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current user info
 * GET /api/users/me
 */
function getCurrentUser(req, res, next) {
    try {
        const user = authService.getUserById(req.auth.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'User not found',
                },
            });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Logout user
 * POST /api/users/logout
 */
function logoutUser(req, res, next) {
    try {
        // In a stateless JWT system, logout is handled client-side
        // But we can blacklist the token or end the session here if needed

        res.json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all users (for debugging)
 * GET /api/users
 */
function getAllUsers(req, res, next) {
    try {
        const users = authService.getAllUsers();

        res.json({
            success: true,
            data: { users },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getAllUsers,
};
