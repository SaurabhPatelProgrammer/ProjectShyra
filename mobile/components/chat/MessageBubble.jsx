import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';

    return (
        <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
                    {message.content}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    assistantContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#6C63FF',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: '#2D2D44',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    assistantText: {
        color: '#FFFFFF',
    },
    timestamp: {
        fontSize: 11,
        color: '#AAAAAA',
        marginTop: 4,
    },
});
