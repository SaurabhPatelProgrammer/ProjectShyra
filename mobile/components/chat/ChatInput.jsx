import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../../hooks/useVoice';

export default function ChatInput({ onSend, disabled }) {
    const [message, setMessage] = useState('');
    const { isRecording, startRecording, stopRecording } = useVoice();

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleVoice = async () => {
        try {
            if (isRecording) {
                const uri = await stopRecording();
                if (uri) {
                    Alert.alert('Voice Note', 'Voice recording feature coming soon!');
                }
            } else {
                await startRecording();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to record audio. Please check microphone permissions.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Type a message..."
                    placeholderTextColor="#888"
                    multiline={true}
                    maxLength={500}
                    editable={!disabled}
                />

                <TouchableOpacity
                    style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                    onPress={handleVoice}
                    disabled={disabled}
                >
                    <Ionicons
                        name={isRecording ? "stop-circle" : "mic"}
                        size={24}
                        color={isRecording ? "#FF6B6B" : "#FFFFFF"}
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.sendButton, (!message.trim() || disabled) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || disabled}
            >
                <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#1A1A2E',
        borderTopWidth: 1,
        borderTopColor: '#2D2D44',
        alignItems: 'flex-end',
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#2D2D44',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3D3D54',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    voiceButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
