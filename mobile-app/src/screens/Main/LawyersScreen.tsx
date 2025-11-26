import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const LawyersScreen: React.FC = () => {
  const { lawyers } = useSelector((state: RootState) => state.lawyer);

  return (
    <View style={styles.container}>
      <FlatList
        data={lawyers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{item.name}</Title>
              <Paragraph>{item.location}</Paragraph>
              <View style={styles.specializations}>
                {item.specializations.map((spec, index) => (
                  <Chip key={index} style={styles.chip}>{spec}</Chip>
                ))}
              </View>
              <Paragraph>
                Bewertung: {item.rating} ⭐ ({item.reviewCount} Bewertungen)
              </Paragraph>
              {item.hourlyRate && (
                <Paragraph>Stundensatz: {item.hourlyRate}€/h</Paragraph>
              )}
            </Card.Content>
            <Card.Actions>
              <Button>Profil</Button>
              <Button mode="contained">Termin buchen</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Paragraph>Keine Anwälte gefunden</Paragraph>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 8,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default LawyersScreen;
