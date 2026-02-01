/**
 * Performance Test Component
 * 
 * This component tests the performance of all mobile extension features
 * and provides metrics for optimization.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { integrationService } from '../services/integrationService';
import { mobileOfflineStorageService } from '../services/mobileOfflineStorage';
import { smartSyncService } from '../services/smartSyncService';
import { offlineDocumentManager } from '../services/offlineDocumentManager';
import { pushNotificationService } from '../services/pushNotificationService';
import { paymentService } from '../services/paymentService';

interface PerformanceMetrics {
  initializationTime: number;
  offlineSaveTime: number;
  offlineRetrieveTime: number;
  syncTime: number;
  notificationTime: number;
  paymentTime: number;
  memoryUsage: number;
}

const PerformanceTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  // Run performance tests
  const runPerformanceTests = async () => {
    try {
      setIsTesting(true);
      setMetrics(null);
      setTestResults({});

      const startTime = Date.now();
      const metrics: PerformanceMetrics = {
        initializationTime: 0,
        offlineSaveTime: 0,
        offlineRetrieveTime: 0,
        syncTime: 0,
        notificationTime: 0,
        paymentTime: 0,
        memoryUsage: 0
      };

      // Test 1: Initialization time
      const initStartTime = Date.now();
      await integrationService.initializeAllServices();
      metrics.initializationTime = Date.now() - initStartTime;

      // Test 2: Offline save time
      const saveStartTime = Date.now();
      await mobileOfflineStorageService.saveLawFirmCase('perf-test-case', {
        id: 'perf-test-case',
        title: 'Performance Test Case',
        status: 'active'
      });
      metrics.offlineSaveTime = Date.now() - saveStartTime;

      // Test 3: Offline retrieve time
      const retrieveStartTime = Date.now();
      await mobileOfflineStorageService.getLawFirmCase('perf-test-case');
      metrics.offlineRetrieveTime = Date.now() - retrieveStartTime;

      // Test 4: Sync time
      const syncStartTime = Date.now();
      await smartSyncService.startSync();
      metrics.syncTime = Date.now() - syncStartTime;

      // Test 5: Notification time
      const notificationStartTime = Date.now();
      await pushNotificationService.sendNotification({
        title: 'Performance Test',
        body: 'Testing notification performance',
        priority: 'normal',
        category: 'reminder',
        userId: 'perf-test-user'
      });
      metrics.notificationTime = Date.now() - notificationStartTime;

      // Test 6: Payment time
      const paymentStartTime = Date.now();
      await paymentService.processApplePayPayment({
        amount: 1.00,
        currency: 'EUR',
        description: 'Performance Test Payment'
      });
      metrics.paymentTime = Date.now() - paymentStartTime;

      // Estimate memory usage (simplified)
      if (typeof performance !== 'undefined' && performance.memory) {
        metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      setMetrics(metrics);

      // Run service tests
      const results = await integrationService.testAllServices();
      setTestResults(results);

      Alert.alert('Erfolg', `Performance-Tests abgeschlossen in ${Date.now() - startTime}ms`);
    } catch (error) {
      Alert.alert('Fehler', 'Fehler bei den Performance-Tests');
    } finally {
      setIsTesting(false);
    }
  };

  // Run stress test
  const runStressTest = async () => {
    try {
      setIsTesting(true);
      
      // Create multiple documents
      const startTime = Date.now();
      const docPromises = [];
      
      for (let i = 0; i < 100; i++) {
        docPromises.push(
          offlineDocumentManager.createDocument(
            `Stress Test Document ${i}`,
            'txt',
            `This is stress test document content ${i}`,
            { tags: ['stress-test'] }
          )
        );
      }
      
      await Promise.all(docPromises);
      
      const duration = Date.now() - startTime;
      Alert.alert('Erfolg', `Stress-Test abgeschlossen: 100 Dokumente in ${duration}ms erstellt`);
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Stress-Test');
    } finally {
      setIsTesting(false);
    }
  };

  // Get service status
  const getServiceStatus = () => {
    const state = integrationService.getIntegrationState();
    return {
      offline: state.offlineServices,
      notifications: state.notificationServices,
      payments: state.paymentServices,
      overall: state.overallStatus
    };
  };

  const serviceStatus = getServiceStatus();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Performance und Integrationstests</Text>
      
      {/* Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicestatus</Text>
        
        <View style={styles.statusRow}>
          <Text>Offline-Services:</Text>
          <Text style={getServiceStatusStyle(serviceStatus.offline)}>
            {serviceStatus.offline === 'ready' && 'Bereit'}
            {serviceStatus.offline === 'initializing' && 'Initialisierung...'}
            {serviceStatus.offline === 'error' && 'Fehler'}
            {serviceStatus.offline === 'idle' && 'Inaktiv'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text>Benachrichtigungsservices:</Text>
          <Text style={getServiceStatusStyle(serviceStatus.notifications)}>
            {serviceStatus.notifications === 'ready' && 'Bereit'}
            {serviceStatus.notifications === 'initializing' && 'Initialisierung...'}
            {serviceStatus.notifications === 'error' && 'Fehler'}
            {serviceStatus.notifications === 'idle' && 'Inaktiv'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text>Zahlungsservices:</Text>
          <Text style={getServiceStatusStyle(serviceStatus.payments)}>
            {serviceStatus.payments === 'ready' && 'Bereit'}
            {serviceStatus.payments === 'initializing' && 'Initialisierung...'}
            {serviceStatus.payments === 'error' && 'Fehler'}
            {serviceStatus.payments === 'idle' && 'Inaktiv'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text>Gesamtstatus:</Text>
          <Text style={getServiceStatusStyle(serviceStatus.overall)}>
            {serviceStatus.overall === 'ready' && 'Bereit'}
            {serviceStatus.overall === 'initializing' && 'Initialisierung...'}
            {serviceStatus.overall === 'error' && 'Fehler'}
            {serviceStatus.overall === 'idle' && 'Inaktiv'}
          </Text>
        </View>
      </View>

      {/* Test Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests durchführen</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runPerformanceTests}
          disabled={isTesting}
        >
          {isTesting ? (
            <>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.buttonTextWhite}>Führe Tests durch...</Text>
            </>
          ) : (
            <Text style={styles.buttonTextWhite}>Performance-Tests starten</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={runStressTest}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>Stress-Test starten (100 Dokumente)</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testergebnisse</Text>
          
          {Object.entries(testResults).map(([service, passed]) => (
            <View key={service} style={styles.statusRow}>
              <Text>{service}:</Text>
              <Text style={passed ? styles.success : styles.error}>
                {passed ? 'Bestanden' : 'Fehlgeschlagen'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance-Metriken</Text>
          
          <View style={styles.metricRow}>
            <Text>Initialisierungszeit:</Text>
            <Text>{metrics.initializationTime} ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text>Offline-Speicherzeit:</Text>
            <Text>{metrics.offlineSaveTime} ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text>Offline-Lesezeit:</Text>
            <Text>{metrics.offlineRetrieveTime} ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text>Synchronisationszeit:</Text>
            <Text>{metrics.syncTime} ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text>Benachrichtigungszeit:</Text>
            <Text>{metrics.notificationTime} ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text>Zahlungsverarbeitungszeit:</Text>
            <Text>{metrics.paymentTime} ms</Text>
          </View>
          
          {metrics.memoryUsage > 0 && (
            <View style={styles.metricRow}>
              <Text>Speicherverbrauch:</Text>
              <Text>{metrics.memoryUsage.toFixed(2)} MB</Text>
            </View>
          )}
        </View>
      )}

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Empfehlungen</Text>
        
        <Text style={styles.infoText}>
          • Bei langsamen Initialisierungszeiten: Lazy Loading für nicht-kritische Services in Betracht ziehen
        </Text>
        
        <Text style={styles.infoText}>
          • Bei hohem Speicherverbrauch: Dokumente bei Nichtgebrauch aus dem Speicher entfernen
        </Text>
        
        <Text style={styles.infoText}>
          • Bei langsamen Synchronisationszeiten: Batch-Größe reduzieren oder Priorisierung optimieren
        </Text>
      </View>
    </ScrollView>
  );
};

// Helper function for service status styling
const getServiceStatusStyle = (status: string) => {
  switch (status) {
    case 'ready':
      return styles.success;
    case 'error':
      return styles.error;
    case 'initializing':
      return styles.warning;
    default:
      return styles.info;
  }
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  success: {
    color: '#00aa00',
    fontWeight: 'bold'
  },
  error: {
    color: '#ff0000',
    fontWeight: 'bold'
  },
  warning: {
    color: '#ff9500',
    fontWeight: 'bold'
  },
  info: {
    color: '#666',
    fontWeight: 'bold'
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
    fontSize: 14,
    marginBottom: 8,
    color: '#666'
  }
});

export default PerformanceTest;