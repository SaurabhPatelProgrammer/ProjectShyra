import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import StatusIndicator from '../../components/control/StatusIndicator';

export default function TabsLayout() {
    const { connected } = useSocket();

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1A1A2E',
                },
                headerTintColor: '#FFFFFF',
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: '#1A1A2E',
                    borderTopColor: '#2D2D44',
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: '#6C63FF',
                tabBarInactiveTintColor: '#888888',
            }}
        >
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    headerTitle: () => (
                        <View style={styles.headerTitle}>
                            <Text style={styles.headerText}>SHYRA</Text>
                            <StatusIndicator connected={connected} />
                        </View>
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="control"
                options={{
                    title: 'Control',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="game-controller" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
