const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError, ValidationError } = require('../middlewares/error.middleware');

// MongoDB Models
const User = require('../models/User.model');
const Device = require('../models/Device.model');

/**
 * Authentication Service with MongoDB
 * Handles user and device authentication, JWT generation
 */
class AuthService {
    /**
     * Register a new user
     */
    async registerUser(username, password, name) {
        try {
            // Check if user exists
            const existingUser = await User.findOne({ username: username.toLowerCase() });

            if (existingUser) {
                throw new ValidationError('Username already exists');
            }

            // Create user (password will be hashed by pre-save hook)
            const user = new User({
                username: username.toLowerCase(),
                password,
                name: name || username,
                role: 'USER',
            });

            await user.save();

            // Generate token
            const token = this.generateToken({
                id: user._id.toString(),
                type: 'USER',
                role: user.role,
            });

            return {
                user: user.toPublicJSON(),
                token,
            };
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new ValidationError(error.message);
            }
            throw error;
        }
    }

    /**
     * Login user
     */
    async loginUser(username, password) {
        const user = await User.findOne({ username: username.toLowerCase(), isActive: true });

        if (!user) {
            throw new AuthError('Invalid username or password');
        }

        // Verify password using model method
        const isValid = await user.comparePassword(password);

        if (!isValid) {
            throw new AuthError('Invalid username or password');
        }

        // Generate token
        const token = this.generateToken({
            id: user._id.toString(),
            type: 'USER',
            role: user.role,
        });

        return {
            user: user.toPublicJSON(),
            token,
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            return user ? user.toPublicJSON() : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Register a new device
     */
    async registerDevice(deviceId, deviceType, name, metadata = {}) {
        try {
            // Check if device exists
            const existingDevice = await Device.findOne({ deviceId });

            if (existingDevice) {
                throw new ValidationError('Device already registered');
            }

            // Create device
            const device = new Device({
                deviceId,
                deviceType,
                name,
                metadata,
                role: 'DEVICE',
            });

            await device.save();

            return {
                device: device.toPublicJSON(),
            };
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new ValidationError(error.message);
            }
            throw error;
        }
    }

    /**
     * Authenticate device and generate token
     */
    async authenticateDevice(deviceId) {
        const device = await Device.findOne({ deviceId, isActive: true });

        if (!device) {
            throw new AuthError('Device not registered');
        }

        // Update last seen
        await device.updateLastSeen();

        // Generate token
        const token = this.generateToken({
            id: device.deviceId,
            type: 'DEVICE',
            role: device.role,
            deviceType: device.deviceType,
        });

        return {
            device: device.toPublicJSON(),
            token,
        };
    }

    /**
     * Get device by ID
     */
    async getDeviceById(deviceId) {
        const device = await Device.findOne({ deviceId });
        return device ? device.toPublicJSON() : null;
    }

    /**
     * Deregister device
     */
    async deregisterDevice(deviceId) {
        const device = await Device.findOne({ deviceId });

        if (!device) {
            throw new ValidationError('Device not found');
        }

        await Device.deleteOne({ deviceId });
        return { success: true };
    }

    /**
     * Generate JWT token
     */
    generateToken(payload) {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    /**
     * Get all devices (for debugging)
     */
    async getAllDevices() {
        const devices = await Device.find().sort({ createdAt: -1 });
        return devices.map(d => d.toPublicJSON());
    }

    /**
     * Get all users (for debugging)
     */
    async getAllUsers() {
        const users = await User.find().sort({ createdAt: -1 });
        return users.map(u => u.toPublicJSON());
    }
}

module.exports = new AuthService();
