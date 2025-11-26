import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text, RadioButton } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';

const RegisterScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.register({ email, password, userType });
      
      if (response.success) {
        dispatch(setUser(response.data.user));
        dispatch(setToken(response.data.token));
      }
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Konto erstellen</Title>
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
      <Text style={styles.label}>Ich bin:</Text>
      <RadioButton.Group onValueChange={value => setUserType(value as 'tenant' | 'landlord')} value={userType}>
        <RadioButton.Item label="Mieter" value="tenant" />
        <RadioButton.Item label="Vermieter" value="landlord" />
      </RadioButton.Group>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Registrieren
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});

export default RegisterScreen;
