const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { validateDeviceRegistration } = require('../middlewares/validation.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * Device Routes
 * Handles device registration, authentication, and management
 */

// Public routes (no auth required)
router.post('/register', validateDeviceRegistration, deviceController.registerDevice);
router.post('/auth', deviceController.authenticateDevice);

// Protected routes (auth required)
router.get('/', authenticateToken, deviceController.getAllDevices);
router.get('/:deviceId', authenticateToken, deviceController.getDevice);
router.delete('/:deviceId', authenticateToken, deviceController.deregisterDevice);

module.exports = router;
