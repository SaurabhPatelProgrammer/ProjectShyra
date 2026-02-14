import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!isAuthenticated && inAuthGroup) {
            router.replace('/login');
        } else if (isAuthenticated && !inAuthGroup) {
            router.replace('/(tabs)/chat');
        } else if (!isAuthenticated && !inAuthGroup) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, segments]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6C63FF" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
