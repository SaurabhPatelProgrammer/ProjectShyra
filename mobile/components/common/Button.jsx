import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style
}) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && styles.primary,
                variant === 'secondary' && styles.secondary,
                variant === 'outline' && styles.outline,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#6C63FF' : '#fff'} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        variant === 'primary' && styles.primaryText,
                        variant === 'secondary' && styles.secondaryText,
                        variant === 'outline' && styles.outlineText,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    primary: {
        backgroundColor: '#6C63FF',
    },
    secondary: {
        backgroundColor: '#2D2D44',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#FFFFFF',
    },
    outlineText: {
        color: '#6C63FF',
    },
});
