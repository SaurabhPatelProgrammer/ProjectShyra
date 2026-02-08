const mongoose = require('mongoose');

/**
 * Device Model
 * Stores registered device information (ESP32, cameras, etc.)
 */

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, 'Device ID is required'],
            unique: true,
            trim: true,
        },
        deviceType: {
            type: String,
            required: [true, 'Device type is required'],
            enum: ['ESP32', 'MOBILE_APP', 'CAMERA'],
        },
        name: {
            type: String,
            required: [true, 'Device name is required'],
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        role: {
            type: String,
            default: 'DEVICE',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Update last seen timestamp
 */
deviceSchema.methods.updateLastSeen = function () {
    this.lastSeen = new Date();
    return this.save();
};

/**
 * Method to get public device data
 */
deviceSchema.methods.toPublicJSON = function () {
    return {
        id: this.deviceId,
        deviceType: this.deviceType,
        name: this.name,
        role: this.role,
        lastSeen: this.lastSeen,
        createdAt: this.createdAt,
    };
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
