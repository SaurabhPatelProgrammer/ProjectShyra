import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ControlButton({ icon, label, onPress, disabled }) {
    return (
        <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={32} color="#FFFFFF" />
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 100,
        height: 100,
        backgroundColor: '#6C63FF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
});
