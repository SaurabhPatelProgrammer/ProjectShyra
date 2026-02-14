import { useState } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export function useVoice() {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const requestPermission = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            setPermissionGranted(status === 'granted');
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };

    const startRecording = async () => {
        try {
            if (!permissionGranted) {
                const granted = await requestPermission();
                if (!granted) {
                    throw new Error('Microphone permission not granted');
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording) return null;

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            setRecording(null);
            setIsRecording(false);

            return uri;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            throw error;
        }
    };

    return {
        isRecording,
        permissionGranted,
        startRecording,
        stopRecording,
        requestPermission,
    };
}
