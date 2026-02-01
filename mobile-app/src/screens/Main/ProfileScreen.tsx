import * as React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Button, Divider, Switch, Portal, Modal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { BiometricService } from '../../services/BiometricService';
import { FeedbackModal } from '../../components/FeedbackModal';
import LegalScreen from './LegalScreen';
import { gdprAPI } from '../../services/api';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const [legalVisible, setLegalVisible] = useState(false);

  const checkBiometricStatus = async (): Promise<void> => {
    const supported = await BiometricService.checkAvailability();
    setIsBiometricSupported(supported);
    if (supported) {
      const enabled = await BiometricService.isBiometricEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const toggleBiometric = async (value: boolean): Promise<void> => {
    if (value) {
      const success = await BiometricService.authenticate();
      if (success) {
        await BiometricService.enableBiometric();
        setBiometricEnabled(true);
        Alert.alert('Erfolg', 'Biometrischer Login aktiviert.');
      } else {
        Alert.alert('Fehler', 'Authentifizierung fehlgeschlagen.');
      }
    } else {
      await BiometricService.disableBiometric();
      setBiometricEnabled(false);
    }
  };

  useEffect(() => {
    void checkBiometricStatus();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account löschen',
      'Möchten Sie Ihren Account wirklich unwiderruflich löschen? Alle Daten werden entfernt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call GDPR deletion endpoint via centralized API
              await gdprAPI.deleteAccount({
                reason: 'User requested deletion via app',
                deleteDocuments: true,
                deleteMessages: true
              });

              dispatch(logout());
              Alert.alert('Gelöscht', 'Ihr Account wurde erfolgreich gelöscht.');
            } catch (error) {
              console.error('Deletion failed:', error);
              Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden. Bitte überprüfen Sie Ihre Internetverbindung.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Profil</Text>

      <List.Section>
        <List.Item
          title="E-Mail"
          description={user?.email}
          left={(props: any) => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Nutzertyp"
          description={
            user?.userType === 'tenant'
              ? 'Mieter'
              : user?.userType === 'landlord'
                ? 'Vermieter'
                : 'Geschäftlich'
          }
          left={(props: any) => <List.Icon {...props} icon="account" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Einstellungen</List.Subheader>
        {isBiometricSupported && (
          <List.Item
            title="Biometrischer Login"
            description="FaceID / TouchID verwenden"
            left={(props: any) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
              />
            )}
          />
        )}
        <List.Item
          title="Feedback senden"
          description="Helfen Sie uns, die App zu verbessern"
          left={(props: any) => <List.Icon {...props} icon="message-alert" />}
          onPress={() => setFeedbackVisible(true)}
        />
        <Divider />
        <List.Item
          title="Rechtliches"
          description="Impressum & Datenschutz"
          left={(props: any) => <List.Icon {...props} icon="scale-balance" />}
          onPress={() => setLegalVisible(true)}
        />
        <List.Item
          title="Account löschen"
          description="Unwiderruflich löschen"
          left={(props: any) => <List.Icon {...props} icon="delete-forever" color="red" />}
          titleStyle={{ color: 'red' }}
          onPress={handleDeleteAccount}
        />
      </List.Section>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Abmelden
      </Button>

      <FeedbackModal
        visible={feedbackVisible}
        onDismiss={() => setFeedbackVisible(false)}
        userId={user?.id}
      />

      {/* New Legal Modal - using FeedbackModal as container for now, simplified */}
      <Portal>
        <Modal visible={legalVisible} onDismiss={() => setLegalVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20 }}>
          <LegalScreen />
          <Button onPress={() => setLegalVisible(false)}>Schließen</Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    padding: 16,
    textAlign: 'center',
  },
  logoutButton: {
    margin: 16,
  },
});

export default ProfileScreen;
