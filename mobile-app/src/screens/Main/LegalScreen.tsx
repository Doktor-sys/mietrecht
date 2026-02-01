import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';

const LegalScreen: React.FC = () => {
    return (
        <ScrollView style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Rechtliches</Text>

            <List.Section>
                <List.Subheader>Impressum</List.Subheader>
                <Text style={styles.text}>
                    SmartLaw GmbH{'\n'}
                    Musterstraße 123{'\n'}
                    10115 Berlin{'\n'}
                    Deutschland{'\n'}{'\n'}
                    Handelsregister: HRB 123456{'\n'}
                    Geschäftsführer: Max Mustermann{'\n'}
                    E-Mail: kontakt@smartlaw.com
                </Text>
            </List.Section>

            <Divider />

            <List.Section>
                <List.Subheader>Datenschutz</List.Subheader>
                <Text style={styles.text}>
                    Wir nehmen den Schutz Ihrer Daten ernst. Ihre personenbezogenen Daten werden nur für die Bereitstellung unserer Dienste verwendet.{'\n'}{'\n'}
                    Verantwortlicher im Sinne der DSGVO ist die SmartLaw GmbH.{'\n'}{'\n'}
                    Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten.
                </Text>
            </List.Section>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    text: {
        paddingHorizontal: 16,
        marginBottom: 16,
        lineHeight: 20,
    },
});

export default LegalScreen;
