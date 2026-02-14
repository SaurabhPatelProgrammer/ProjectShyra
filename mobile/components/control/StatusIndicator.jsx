import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatusIndicator({ connected }) {
    return (
        <View style={styles.container}>
            <View style={[styles.dot, connected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.text}>{connected ? 'Online' : 'Offline'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#2D2D44',
        borderRadius: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dotOnline: {
        backgroundColor: '#4CAF50',
    },
    dotOffline: {
        backgroundColor: '#FF6B6B',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
});
