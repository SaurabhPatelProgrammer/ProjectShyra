import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

export default function Input({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    error,
    autoCapitalize,
    ...props
}) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#888"
                secureTextEntry={secureTextEntry === true}
                autoCapitalize={autoCapitalize || "sentences"}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2D2D44',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#3D3D54',
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    error: {
        color: '#FF6B6B',
        fontSize: 12,
        marginTop: 4,
    },
});
