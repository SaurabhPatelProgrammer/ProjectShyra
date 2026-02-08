const authService = require('../services/auth.service');

/**
 * Device Controller
 * Handles device registration, authentication, and management
 */

/**
 * Register a new device
 * POST /api/devices/register
 */
async function registerDevice(req, res, next) {
    try {
        const { deviceId, deviceType, name, metadata } = req.body;

        const result = authService.registerDevice(deviceId, deviceType, name, metadata);

        res.status(201).json({
            success: true,
            message: 'Device registered successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Authenticate device and get JWT token
 * POST /api/devices/auth
 */
async function authenticateDevice(req, res, next) {
    try {
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'deviceId is required',
                },
            });
        }

        const result = authService.authenticateDevice(deviceId);

        res.json({
            success: true,
            message: 'Device authenticated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get device information
 * GET /api/devices/:deviceId
 */
function getDevice(req, res, next) {
    try {
        const { deviceId } = req.params;

        const device = authService.getDeviceById(deviceId);

        if (!device) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Device not found',
                },
            });
        }

        res.json({
            success: true,
            data: { device },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Deregister a device
 * DELETE /api/devices/:deviceId
 */
function deregisterDevice(req, res, next) {
    try {
        const { deviceId } = req.params;

        const result = authService.deregisterDevice(deviceId);

        res.json({
            success: true,
            message: 'Device deregistered successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all devices (for debugging)
 * GET /api/devices
 */
function getAllDevices(req, res, next) {
    try {
        const devices = authService.getAllDevices();

        res.json({
            success: true,
            data: { devices },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerDevice,
    authenticateDevice,
    getDevice,
    deregisterDevice,
    getAllDevices,
};
