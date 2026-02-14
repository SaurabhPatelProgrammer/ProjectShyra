import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import ControlButton from '../../components/control/ControlButton';
import StatusIndicator from '../../components/control/StatusIndicator';

export default function ControlScreen() {
    const { connected, sendRobotCommand } = useSocket();

    const handleCommand = (command) => {
        sendRobotCommand(command);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Robot Control</Text>
                <StatusIndicator connected={connected} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Movement</Text>
                <View style={styles.controls}>
                    <View style={styles.row}>
                        <ControlButton
                            icon="arrow-up"
                            label="Forward"
                            onPress={() => handleCommand('forward')}
                            disabled={!connected}
                        />
                    </View>
                    <View style={styles.row}>
                        <ControlButton
                            icon="arrow-back"
                            label="Left"
                            onPress={() => handleCommand('left')}
                            disabled={!connected}
                        />
                        <ControlButton
                            icon="stop-circle"
                            label="Stop"
                            onPress={() => handleCommand('stop')}
                            disabled={!connected}
                        />
                        <ControlButton
                            icon="arrow-forward"
                            label="Right"
                            onPress={() => handleCommand('right')}
                            disabled={!connected}
                        />
                    </View>
                    <View style={styles.row}>
                        <ControlButton
                            icon="arrow-down"
                            label="Backward"
                            onPress={() => handleCommand('backward')}
                            disabled={!connected}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.controls}>
                    <View style={styles.row}>
                        <ControlButton
                            icon="hand-left"
                            label="Wave"
                            onPress={() => handleCommand('wave')}
                            disabled={!connected}
                        />
                        <ControlButton
                            icon="musical-notes"
                            label="Dance"
                            onPress={() => handleCommand('dance')}
                            disabled={!connected}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    content: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    controls: {
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});
