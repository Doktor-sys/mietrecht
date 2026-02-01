/**
 * Payment Demo Component
 * 
 * This component demonstrates the mobile payment functionality for the app.
 * It showcases Apple Pay, Google Pay, and bank transfer payments with biometric authentication.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput
} from 'react-native';
import { usePayments } from '../hooks/usePayments';

const PaymentDemo: React.FC = () => {
  const userId = 'demo-user-123'; // In a real app, this would come from auth context
  const {
    isInitialized,
    isProcessing,
    paymentHistory,
    availablePaymentMethods,
    availableBiometricTypes,
    isBiometricAuthAvailable,
    initialize,
    processApplePayPayment,
    processGooglePayPayment,
    processBankTransferPayment,
    getPaymentHistory,
    refundPayment,
    authenticateWithBiometrics,
    formatAmount
  } = usePayments(userId);

  // Payment state
  const [amount, setAmount] = useState('50.00');
  const [currency, setCurrency] = useState('EUR');
  const [description, setDescription] = useState('Beratungshonorar für Mietrecht');
  const [requireBiometricAuth, setRequireBiometricAuth] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('apple_pay');

  // Initialize on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Process payment
  const handleProcessPayment = async () => {
    try {
      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Betrag ein');
        return;
      }

      // Create payment details
      const paymentDetails = {
        amount: amountNum,
        currency,
        description
      };

      // Process payment based on selected method
      let result;
      switch (selectedPaymentMethod) {
        case 'apple_pay':
          result = await processApplePayPayment(paymentDetails, requireBiometricAuth);
          break;
        case 'google_pay':
          result = await processGooglePayPayment(paymentDetails, requireBiometricAuth);
          break;
        case 'bank_transfer':
          result = await processBankTransferPayment(paymentDetails, requireBiometricAuth);
          break;
        default:
          Alert.alert('Fehler', 'Ungültige Zahlungsmethode ausgewählt');
          return;
      }

      if (result.success) {
        Alert.alert(
          'Erfolg', 
          `Zahlung erfolgreich verarbeitet!\nTransaktions-ID: ${result.transactionId}`,
          [{ text: 'OK', onPress: () => getPaymentHistory(10) }]
        );
      } else {
        Alert.alert('Fehler', result.errorMessage || 'Zahlung fehlgeschlagen');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler bei der Zahlungsverarbeitung');
    }
  };

  // Handle refund
  const handleRefund = async (transactionId: string) => {
    try {
      const success = await refundPayment(transactionId);
      
      if (success) {
        Alert.alert(
          'Erfolg', 
          'Zahlung erfolgreich erstattet',
          [{ text: 'OK', onPress: () => getPaymentHistory(10) }]
        );
      } else {
        Alert.alert('Fehler', 'Erstattung fehlgeschlagen');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler bei der Erstattung');
    }
  };

  // Test biometric authentication
  const testBiometricAuth = async () => {
    try {
      const result = await authenticateWithBiometrics();
      
      if (result.success) {
        Alert.alert('Erfolg', `Biometrische Authentifizierung erfolgreich (${result.type})`);
      } else {
        Alert.alert('Fehler', result.errorMessage || 'Biometrische Authentifizierung fehlgeschlagen');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler bei der biometrischen Authentifizierung');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initialisiere Zahlungsdienst...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mobile Zahlungssysteme</Text>
      
      {/* Payment Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zahlung durchführen</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Betrag (€)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Währung"
          value={currency}
          onChangeText={setCurrency}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Beschreibung"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.label}>Zahlungsmethode:</Text>
        <View style={styles.radioGroup}>
          {availablePaymentMethods.map(method => (
            <TouchableOpacity 
              key={method}
              style={[
                styles.radioButton, 
                selectedPaymentMethod === method && styles.selectedRadioButton
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <Text style={styles.radioText}>
                {method === 'apple_pay' && 'Apple Pay'}
                {method === 'google_pay' && 'Google Pay'}
                {method === 'bank_transfer' && 'Banküberweisung'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Biometrische Authentifizierung erforderlich:</Text>
          <Switch
            value={requireBiometricAuth}
            onValueChange={setRequireBiometricAuth}
            disabled={!isBiometricAuthAvailable}
          />
        </View>
        
        {!isBiometricAuthAvailable && (
          <Text style={styles.warningText}>
            Biometrische Authentifizierung ist auf diesem Gerät nicht verfügbar
          </Text>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleProcessPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.buttonTextWhite}>Verarbeite Zahlung...</Text>
            </>
          ) : (
            <Text style={styles.buttonTextWhite}>Zahlung durchführen</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Biometric Auth Test */}
      {isBiometricAuthAvailable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometrische Authentifizierung</Text>
          
          <Text style={styles.infoText}>
            Verfügbare Methoden: {availableBiometricTypes.join(', ')}
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testBiometricAuth}
          >
            <Text style={styles.buttonText}>Biometrische Authentifizierung testen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zahlungshistorie</Text>
        
        {paymentHistory.length === 0 ? (
          <Text style={styles.infoText}>Keine Zahlungen vorhanden</Text>
        ) : (
          paymentHistory.map(payment => (
            <View key={payment.id} style={styles.paymentItem}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDescription}>{payment.description}</Text>
                <Text style={styles.paymentAmount}>
                  {formatAmount(payment.amount, payment.currency)}
                </Text>
              </View>
              
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentInfo}>
                  {new Date(payment.timestamp).toLocaleString('de-DE')}
                </Text>
                <Text style={[
                  styles.paymentStatus, 
                  payment.status === 'completed' && styles.statusCompleted,
                  payment.status === 'pending' && styles.statusPending,
                  payment.status === 'failed' && styles.statusFailed,
                  payment.status === 'refunded' && styles.statusRefunded
                ]}>
                  {payment.status === 'completed' && 'Abgeschlossen'}
                  {payment.status === 'pending' && 'Ausstehend'}
                  {payment.status === 'failed' && 'Fehlgeschlagen'}
                  {payment.status === 'refunded' && 'Erstattet'}
                </Text>
              </View>
              
              {payment.transactionId && (
                <Text style={styles.paymentInfo}>
                  Transaktions-ID: {payment.transactionId}
                </Text>
              )}
              
              {payment.status === 'completed' && (
                <TouchableOpacity 
                  style={[styles.button, styles.smallButton]} 
                  onPress={() => handleRefund(payment.transactionId!)}
                >
                  <Text style={styles.buttonText}>Erstatten</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  radioButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8
  },
  selectedRadioButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  radioText: {
    color: '#333'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4
  },
  switchLabel: {
    fontSize: 16,
    flex: 1
  },
  warningText: {
    color: '#ff9500',
    fontSize: 14,
    marginBottom: 12
  },
  button: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#007AFF'
  },
  smallButton: {
    padding: 8,
    minWidth: 100
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500'
  },
  buttonTextWhite: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500'
  },
  infoText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666'
  },
  paymentItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  paymentInfo: {
    fontSize: 14,
    color: '#666'
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500'
  },
  statusCompleted: {
    color: '#34C759'
  },
  statusPending: {
    color: '#FF9500'
  },
  statusFailed: {
    color: '#FF3B30'
  },
  statusRefunded: {
    color: '#AF52DE'
  }
});

export default PaymentDemo;