import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';

export default function ChatScreen() {
    const { connected, messages, sendMessage } = useSocket();
    const [sessionId] = useState(`session-${Date.now()}`);

    const handleSendMessage = (message) => {
        sendMessage(message, sessionId);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <MessageList messages={messages} />
            <ChatInput onSend={handleSendMessage} disabled={!connected} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
});
