const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateUserCredentials } = require('../middlewares/validation.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * User Routes
 * Handles user registration, authentication, and profile management
 */

// Public routes (no auth required)
router.post('/register', validateUserCredentials, userController.registerUser);
router.post('/login', validateUserCredentials, userController.loginUser);

// Protected routes (auth required)
router.get('/me', authenticateToken, userController.getCurrentUser);
router.post('/logout', authenticateToken, userController.logoutUser);
router.get('/', authenticateToken, userController.getAllUsers);

module.exports = router;
