import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Card style={styles.card}>
                        <Card.Title title="Ein Fehler ist aufgetreten" titleVariant="titleLarge" />
                        <Card.Content>
                            <Text variant="bodyMedium" style={styles.message}>
                                Entschuldigung, die App ist auf ein unerwartetes Problem gestoßen.
                            </Text>
                            {this.state.error && (
                                <View style={styles.errorBox}>
                                    <Text variant="labelSmall" style={styles.errorText}>
                                        {this.state.error.toString()}
                                    </Text>
                                </View>
                            )}
                        </Card.Content>
                        <Card.Actions>
                            <Button mode="contained" onPress={this.handleReset}>
                                App neu laden
                            </Button>
                        </Card.Actions>
                    </Card>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    card: {
        elevation: 4,
    },
    message: {
        marginBottom: 16,
    },
    errorBox: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 4,
        marginBottom: 16,
    },
    errorText: {
        color: '#c62828',
    }
});
