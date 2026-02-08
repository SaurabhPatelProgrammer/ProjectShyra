const mongoose = require('mongoose');

/**
 * ChatHistory Model
 * Stores conversation history between users and SHYRA
 */

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    eventType: {
        type: String,
        default: 'chat',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const chatHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        messages: [messageSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Index for efficient querying
 */
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

/**
 * Add a message to the chat history
 */
chatHistorySchema.methods.addMessage = function (role, content, eventType = 'chat') {
    this.messages.push({
        role,
        content,
        eventType,
        timestamp: new Date(),
    });
    return this.save();
};

/**
 * Get messages in readable format
 */
chatHistorySchema.methods.getFormattedMessages = function () {
    return this.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        eventType: msg.eventType,
        timestamp: msg.timestamp,
    }));
};

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;
