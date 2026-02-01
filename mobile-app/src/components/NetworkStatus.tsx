import React, { useState, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import offlineManager from '../services/offlineManager';

export const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(offlineManager.getIsOnline());
    const theme = useTheme();

    useEffect(() => {
        // Initial check
        setIsOnline(offlineManager.getIsOnline());

        // Subscribe to changes
        offlineManager.setConnectionChangeCallback(() => {
            setIsOnline(offlineManager.getIsOnline());
        });

        return () => {
            offlineManager.setConnectionChangeCallback(() => { });
        };
    }, []);

    if (isOnline) return null;

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.error }]} elevation={2}>
            <Text style={[styles.text, { color: theme.colors.onError }]} variant="labelMedium">
                Keine Internetverbindung. Änderungen werden lokal gespeichert.
            </Text>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingVertical: 4,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
});
