import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { BiometricService } from '../../services/BiometricService';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await BiometricService.checkAvailability();
    const enabled = await BiometricService.isBiometricEnabled();
    setIsBiometricAvailable(available && enabled);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.login({ email, password });

      if (response.success) {
        dispatch(setUser(response.data.user));
        dispatch(setToken(response.data.token));
        // Store token for biometric login
        await BiometricService.storeToken(response.data.token);
      }
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const success = await BiometricService.authenticate();
    if (success) {
      const token = await BiometricService.getToken();
      if (token) {
        dispatch(setToken(token));
        // Fetch user profile if needed, or just proceed
        // dispatch(setUser(...)); 
      } else {
        Alert.alert('Fehler', 'Kein gespeicherter Token gefunden. Bitte loggen Sie sich einmalig mit Passwort ein.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>SmartLaw Mietrecht</Title>
      <TextInput
        label="E-Mail"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Passwort"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Anmelden
      </Button>

      {isBiometricAvailable && (
        <Button
          mode="outlined"
          onPress={handleBiometricLogin}
          style={styles.biometricButton}
          icon="fingerprint"
        >
          Mit Biometrie anmelden
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  biometricButton: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LoginScreen;
