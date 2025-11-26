import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Card, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Willkommen bei SmartLaw Mietrecht</Title>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>KI-Rechtsberatung</Title>
          <Paragraph>
            Stellen Sie Ihre mietrechtlichen Fragen und erhalten Sie sofortige Antworten von unserer KI.
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Chat' as never)}>Chat starten</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Dokumente analysieren</Title>
          <Paragraph>
            Laden Sie Mietverträge oder Nebenkostenabrechnungen hoch für eine automatische Analyse.
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Documents' as never)}>Dokument hochladen</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Anwalt finden</Title>
          <Paragraph>
            Finden Sie spezialisierte Mietrechtsanwälte in Ihrer Nähe.
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Lawyers' as never)}>Anwälte suchen</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
});

export default HomeScreen;
