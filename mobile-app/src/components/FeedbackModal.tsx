import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, SegmentedButtons, useTheme } from 'react-native-paper';
import axios from 'axios';
import { API_URL } from '../config'; // Assuming config exists, otherwise I'll hardcode or find it

interface FeedbackModalProps {
    visible: boolean;
    onDismiss: () => void;
    userId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onDismiss, userId }) => {
    const theme = useTheme();
    const [category, setCategory] = useState('general');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;

        setLoading(true);
        try {
            // Replace with actual API call
            // await axios.post(`${API_URL}/api/feedback`, { category, message, userId });
            console.log('Submitting feedback:', { category, message, userId });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setMessage('');
            setCategory('general');
            onDismiss();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            // Show error (could use a Snackbar if available)
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text variant="headlineSmall" style={styles.title}>Feedback senden</Text>

                <Text variant="bodyMedium" style={styles.label}>Kategorie</Text>
                <SegmentedButtons
                    value={category}
                    onValueChange={setCategory}
                    buttons={[
                        { value: 'general', label: 'Allgemein' },
                        { value: 'bug', label: 'Fehler' },
                        { value: 'feature', label: 'Wunsch' },
                    ]}
                    style={styles.segment}
                />

                <TextInput
                    label="Ihre Nachricht"
                    value={message}
                    onChangeText={setMessage}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                />

                <View style={styles.actions}>
                    <Button onPress={onDismiss} style={styles.button}>Abbrechen</Button>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading || !message.trim()}
                        style={styles.button}
                    >
                        Senden
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        marginBottom: 8,
    },
    segment: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        marginLeft: 8,
    },
});
