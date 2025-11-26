import * as React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Button, Divider, Switch } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { BiometricService } from '../../services/BiometricService';
import { FeedbackModal } from '../../components/FeedbackModal';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

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
