/**
 * Smart Offline Demo Component
 * 
 * This component demonstrates the enhanced offline functionality for mobile apps.
 * It showcases intelligent synchronization, progressive sync, and conflict resolution.
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
  ProgressBarAndroid,
  Platform,
  TextInput
} from 'react-native';
import { useMobileOffline } from '../hooks/useMobileOffline';

const SmartOfflineDemo: React.FC = () => {
  const {
    isInitialized,
    isOffline,
    isSyncing,
    unsyncedItemCount,
    syncStatus,
    storageInfo,
    initialize,
    syncOfflineData,
    saveLawFirmCaseOffline,
    saveAccountingEntryOffline,
    saveCalendarEventOffline,
    saveDocumentOffline,
    createOfflineDocument,
    getDocumentMetadata,
    getDocumentContent,
    updateDocument,
    trackUserBehavior,
    retryFailedSyncItems
  } = useMobileOffline();

  const [demoData, setDemoData] = useState({
    caseId: '',
    accountId: '',
    eventId: '',
    docId: ''
  });

  // Document creation state
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('contract');
  const [documentContent, setDocumentContent] = useState('');
  const [createdDocumentId, setCreatedDocumentId] = useState('');

  // Initialize on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Generate demo data
  const generateDemoData = () => {
    const timestamp = Date.now();
    setDemoData({
      caseId: `case-${timestamp}`,
      accountId: `account-${timestamp}`,
      eventId: `event-${timestamp}`,
      docId: `doc-${timestamp}`
    });
  };

  // Save demo law firm case
  const saveDemoCase = async () => {
    try {
      const caseData = {
        caseId: demoData.caseId,
        clientName: 'Max Mustermann',
        caseType: 'Mietrecht',
        startDate: new Date().toISOString(),
        status: 'active',
        assignedLawyer: 'Erika Mustermann',
        billingInfo: {
          hourlyRate: 150,
          currency: 'EUR'
        }
      };

      await saveLawFirmCaseOffline(demoData.caseId, caseData);
      await trackUserBehavior(undefined, demoData.caseId, undefined);
      
      Alert.alert('Erfolg', 'Fall wurde offline gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern des Falls');
    }
  };

  // Save demo accounting entry
  const saveDemoAccounting = async () => {
    try {
      const entryData = {
        id: demoData.accountId,
        amount: 1500.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        description: 'Beratungshonorar für Mietrecht',
        category: 'legal_services'
      };

      await saveAccountingEntryOffline(demoData.accountId, entryData);
      await trackUserBehavior(undefined, demoData.accountId, undefined);
      
      Alert.alert('Erfolg', 'Buchhaltungseintrag wurde offline gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern des Buchhaltungseintrags');
    }
  };

  // Save demo calendar event
  const saveDemoEvent = async () => {
    try {
      const eventData = {
        id: demoData.eventId,
        title: 'Gerichtstermin',
        description: 'Hauptverhandlung im Mietrechtstreit',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        eventType: 'court_hearing',
        attendees: ['erika@kanzlei.de', 'max@client.de'],
        location: 'Amtsgericht Musterstadt, Raum 205'
      };

      await saveCalendarEventOffline(demoData.eventId, eventData);
      await trackUserBehavior(undefined, demoData.eventId, undefined);
      
      Alert.alert('Erfolg', 'Kalenderereignis wurde offline gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern des Kalenderereignisses');
    }
  };

  // Save demo document
  const saveDemoDocument = async () => {
    try {
      const docData = {
        id: demoData.docId,
        title: 'Mietvertrag',
        type: 'contract',
        createdAt: new Date().toISOString(),
        fileSize: 102400
      };

      const fileContent = `Mietvertrag für die Wohnung in der Musterstraße 123, ${new Date().getFullYear()}`;

      await saveDocumentOffline(demoData.docId, docData, fileContent);
      await trackUserBehavior(undefined, demoData.docId, demoData.docId);
      
      Alert.alert('Erfolg', 'Dokument wurde offline gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern des Dokuments');
    }
  };

  // Create advanced document
  const createAdvancedDocument = async () => {
    if (!documentTitle || !documentContent) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel und Inhalt für das Dokument ein');
      return;
    }

    try {
      const document = await createOfflineDocument(
        documentTitle,
        documentType,
        documentContent,
        {
          tags: ['demo', 'offline'],
          author: 'Demo User',
          description: 'Beispieldokument für Offline-Funktionalität'
        }
      );

      setCreatedDocumentId(document.id);
      Alert.alert('Erfolg', `Dokument "${document.title}" wurde erstellt`);
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Erstellen des Dokuments');
    }
  };

  // Get document info
  const getDocumentInfo = async () => {
    if (!createdDocumentId) {
      Alert.alert('Fehler', 'Bitte erstellen Sie zuerst ein Dokument');
      return;
    }

    try {
      const metadata = await getDocumentMetadata(createdDocumentId);
      const content = await getDocumentContent(createdDocumentId);

      if (metadata) {
        Alert.alert(
          'Dokumentinformationen',
          `Titel: ${metadata.title}
Typ: ${metadata.type}
Größe: ${metadata.fileSize} Bytes
Version: ${metadata.version}

Inhalt: ${content?.substring(0, 100)}${content && content.length > 100 ? '...' : ''}`
        );
      } else {
        Alert.alert('Fehler', 'Dokument nicht gefunden');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Abrufen der Dokumentinformationen');
    }
  };

  // Update document
  const updateDocumentContent = async () => {
    if (!createdDocumentId || !documentContent) {
      Alert.alert('Fehler', 'Bitte erstellen Sie zuerst ein Dokument und geben Sie neuen Inhalt ein');
      return;
    }

    try {
      const updatedDoc = await updateDocument(
        createdDocumentId,
        documentContent,
        'Inhalt aktualisiert über Demo'
      );

      Alert.alert('Erfolg', `Dokument wurde aktualisiert. Neue Version: ${updatedDoc.version}`);
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Aktualisieren des Dokuments');
    }
  };

  // Perform smart sync
  const performSmartSync = async () => {
    try {
      const success = await syncOfflineData();
      if (success) {
        Alert.alert('Erfolg', 'Alle Daten wurden erfolgreich synchronisiert');
      } else {
        Alert.alert('Warnung', 'Einige Daten konnten nicht synchronisiert werden');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler bei der Synchronisation');
    }
  };

  // Retry failed sync items
  const retryFailedItems = async () => {
    try {
      await retryFailedSyncItems();
      Alert.alert('Erfolg', 'Fehlgeschlagene Synchronisationen werden erneut versucht');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim erneuten Versuch');
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    if (!syncStatus) return null;

    const progress = syncStatus.totalItems > 0 
      ? (syncStatus.completedItems + syncStatus.inProgressItems) / syncStatus.totalItems
      : 0;

    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress}
          style={styles.progressBar}
        />
      );
    } else {
      // For iOS, we'll use a simple view since ProgressViewIOS might not be available
      return (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      );
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initialisiere Offline-Funktionalität...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Erweiterte Offline-Funktionen</Text>
      
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <Text>Offline-Modus:</Text>
          <Text style={isOffline ? styles.offline : styles.online}>
            {isOffline ? 'Aktiv' : 'Inaktiv'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text>Nicht synchronisierte Elemente:</Text>
          <Text style={styles.count}>{unsyncedItemCount}</Text>
        </View>
        {storageInfo && (
          <View style={styles.statusRow}>
            <Text>Plattform:</Text>
            <Text>{storageInfo.platform}</Text>
          </View>
        )}
      </View>

      {/* Sync Status Section */}
      {syncStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronisationsstatus</Text>
          <View style={styles.statusRow}>
            <Text>Gesamt:</Text>
            <Text>{syncStatus.totalItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text>Ausstehend:</Text>
            <Text>{syncStatus.pendingItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text>Abgeschlossen:</Text>
            <Text style={styles.success}>{syncStatus.completedItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text>Fehlgeschlagen:</Text>
            <Text style={styles.error}>{syncStatus.failedItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text>In Bearbeitung:</Text>
            <Text>{syncStatus.inProgressItems}</Text>
          </View>
          {renderProgressBar()}
        </View>
      )}

      {/* Demo Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo-Aktionen</Text>
        
        <TouchableOpacity style={styles.button} onPress={generateDemoData}>
          <Text style={styles.buttonText}>Demo-Daten generieren</Text>
        </TouchableOpacity>
        
        {demoData.caseId ? (
          <>
            <TouchableOpacity style={styles.button} onPress={saveDemoCase}>
              <Text style={styles.buttonText}>Fall offline speichern</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={saveDemoAccounting}>
              <Text style={styles.buttonText}>Buchhaltung offline speichern</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={saveDemoEvent}>
              <Text style={styles.buttonText}>Termin offline speichern</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={saveDemoDocument}>
              <Text style={styles.buttonText}>Dokument offline speichern</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>Generiere Demo-Daten, um Aktionen freizuschalten</Text>
        )}
      </View>

      {/* Advanced Document Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Erweiterte Dokumentenverwaltung</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Dokumententitel"
          value={documentTitle}
          onChangeText={setDocumentTitle}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Dokumenttyp:</Text>
          <TouchableOpacity 
            style={[styles.pickerOption, documentType === 'contract' && styles.selectedOption]}
            onPress={() => setDocumentType('contract')}
          >
            <Text>Vertrag</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, documentType === 'invoice' && styles.selectedOption]}
            onPress={() => setDocumentType('invoice')}
          >
            <Text>Rechnung</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, documentType === 'correspondence' && styles.selectedOption]}
            onPress={() => setDocumentType('correspondence')}
          >
            <Text>Korrespondenz</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Dokumentinhalt"
          value={documentContent}
          onChangeText={setDocumentContent}
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity style={styles.button} onPress={createAdvancedDocument}>
          <Text style={styles.buttonText}>Dokument erstellen</Text>
        </TouchableOpacity>
        
        {createdDocumentId ? (
          <>
            <TouchableOpacity style={styles.button} onPress={getDocumentInfo}>
              <Text style={styles.buttonText}>Dokumentinfo abrufen</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={updateDocumentContent}>
              <Text style={styles.buttonText}>Dokument aktualisieren</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Sync Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={performSmartSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.buttonTextWhite}>Synchronisiere...</Text>
            </>
          ) : (
            <Text style={styles.buttonTextWhite}>Intelligente Synchronisation</Text>
          )}
        </TouchableOpacity>
        
        {syncStatus && syncStatus.failedItems > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.warningButton]} 
            onPress={retryFailedItems}
          >
            <Text style={styles.buttonTextWhite}>Fehlgeschlagene erneut versuchen</Text>
          </TouchableOpacity>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  offline: {
    color: '#ff0000',
    fontWeight: 'bold'
  },
  online: {
    color: '#00aa00',
    fontWeight: 'bold'
  },
  count: {
    fontWeight: 'bold',
    fontSize: 16
  },
  success: {
    color: '#00aa00',
    fontWeight: 'bold'
  },
  error: {
    color: '#ff0000',
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
  warningButton: {
    backgroundColor: '#ff9500'
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
  progressBar: {
    height: 10,
    marginVertical: 10
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF'
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
    height: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  pickerLabel: {
    marginRight: 10,
    fontWeight: '500'
  },
  pickerOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  }
});

export default SmartOfflineDemo;