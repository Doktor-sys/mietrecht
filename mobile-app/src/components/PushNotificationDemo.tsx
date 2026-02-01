/**
 * Push Notification Demo Component
 * 
 * This component demonstrates the enhanced push notification functionality for mobile apps.
 * It showcases personalized notifications, scheduling, and preference management.
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
  TextInput,
  Platform
} from 'react-native';
// import { Picker } from '@react-native-community/picker';
import { usePushNotifications } from '../hooks/usePushNotifications';

const PushNotificationDemo: React.FC = () => {
  const userId = 'demo-user-123'; // In a real app, this would come from auth context
  const {
    isInitialized,
    isPermissionGranted,
    preferences,
    scheduledNotifications,
    initialize,
    requestPermission,
    setPreferences,
    sendPersonalizedNotification,
    scheduleNotification,
    cancelScheduledNotification,
    trackUserBehavior
  } = usePushNotifications(userId);

  // Notification preference state
  const [enabledCategories, setEnabledCategories] = useState<string[]>([
    'case_update', 'deadline', 'document', 'payment', 'reminder', 'system'
  ]);
  
  // Additional preferences
  const [enableRichNotifications, setEnableRichNotifications] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);
  
  // Quiet hours state
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  
  // Demo notification state
  const [demoTitle, setDemoTitle] = useState('Demo Benachrichtigung');
  const [demoBody, setDemoBody] = useState('Dies ist eine Demo-Benachrichtigung');
  const [demoCategory, setDemoCategory] = useState('reminder');
  const [demoScheduled, setDemoScheduled] = useState(false);
  const [demoScheduleTime, setDemoScheduleTime] = useState('');
  const [demoRichContent, setDemoRichContent] = useState(true);
  
  // Demo case data
  const [demoCaseId, setDemoCaseId] = useState('case-001');
  const [demoCaseTitle, setDemoCaseTitle] = useState('Mietrecht Fall #001');
  const [demoCaseType, setDemoCaseType] = useState('mietrecht');
  const [demoNotificationType, setDemoNotificationType] = useState('case_update');
  const [demoPriority, setDemoPriority] = useState('normal');

  // Initialize on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Update preferences when they change
  useEffect(() => {
    if (preferences) {
      setEnabledCategories(preferences.enabledCategories);
      if (preferences.quietHoursStart) setQuietHoursStart(preferences.quietHoursStart);
      if (preferences.quietHoursEnd) setQuietHoursEnd(preferences.quietHoursEnd);
      setEnableRichNotifications(preferences.enableRichNotifications || true);
      setEnableSounds(preferences.enableSounds || true);
    }
  }, [preferences]);

  // Save preferences
  const savePreferences = async () => {
    try {
      await setPreferences({
        userId,
        enabledCategories: enabledCategories as any,
        quietHoursStart,
        quietHoursEnd,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enableRichNotifications,
        enableSounds
      });
      
      Alert.alert('Erfolg', 'Benachrichtigungseinstellungen gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern der Einstellungen');
    }
  };

  // Toggle category
  const toggleCategory = (category: string) => {
    if (enabledCategories.includes(category)) {
      setEnabledCategories(enabledCategories.filter(c => c !== category));
    } else {
      setEnabledCategories([...enabledCategories, category]);
    }
  };

  // Send demo notification
  const sendDemoNotification = async () => {
    try {
      const scheduledTime = demoScheduled && demoScheduleTime 
        ? new Date(Date.now() + parseInt(demoScheduleTime) * 60 * 1000) 
        : undefined;
      
      const success = await scheduleNotification({
        title: demoTitle,
        body: demoBody,
        priority: demoPriority as any,
        category: demoCategory as any,
        userId,
        scheduledTime,
        subtitle: demoRichContent ? 'Rich Content Demo' : undefined,
        badge: demoRichContent ? 1 : undefined,
        sound: enableSounds ? 'default' : undefined
      });
      
      if (success) {
        Alert.alert('Erfolg', 'Benachrichtigung gesendet');
      } else {
        Alert.alert('Info', 'Benachrichtigung nicht gesendet (möglicherweise gefiltert)');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Senden der Benachrichtigung');
    }
  };

  // Send personalized notification
  const sendPersonalizedDemo = async () => {
    try {
      // Track some demo behavior
      await trackUserBehavior({
        frequentlyAccessedCases: [demoCaseId],
        preferredCategories: enabledCategories as any,
        preferredCommunicationTimes: {
          morning: 5,
          afternoon: 3,
          evening: 2,
          night: 1
        }
      });
      
      const success = await sendPersonalizedNotification(
        {
          caseId: demoCaseId,
          caseTitle: demoCaseTitle,
          caseType: demoCaseType,
          unreadMessages: 2,
          pendingDocuments: 1,
          caseStatus: 'active',
          assignedLawyer: 'Erika Mustermann',
          priority: demoPriority as any
        },
        demoNotificationType as any,
        demoPriority as any,
        demoRichContent
      );
      
      if (success) {
        Alert.alert('Erfolg', 'Personalisierte Benachrichtigung gesendet');
      } else {
        Alert.alert('Info', 'Personalisierte Benachrichtigung nicht gesendet (möglicherweise gefiltert)');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Senden der personalisierten Benachrichtigung');
    }
  };

  // Cancel all scheduled notifications
  const cancelAllScheduled = async () => {
    try {
      for (const notification of scheduledNotifications) {
        await cancelScheduledNotification(notification.id);
      }
      
      Alert.alert('Erfolg', 'Alle geplanten Benachrichtigungen wurden abgebrochen');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Abbrechen der Benachrichtigungen');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initialisiere Benachrichtigungsdienst...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Erweiterte Push-Benachrichtigungen</Text>
      
      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Berechtigungsstatus</Text>
        <View style={styles.statusRow}>
          <Text>Berechtigung erteilt:</Text>
          <Text style={isPermissionGranted ? styles.success : styles.error}>
            {isPermissionGranted ? 'Ja' : 'Nein'}
          </Text>
        </View>
        
        {!isPermissionGranted && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Berechtigung anfordern</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benachrichtigungseinstellungen</Text>
        
        <Text style={styles.label}>Aktivierte Kategorien:</Text>
        {['case_update', 'deadline', 'document', 'payment', 'reminder', 'system'].map(category => (
          <View key={category} style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {category === 'case_update' && 'Fall-Updates'}
              {category === 'deadline' && 'Fristen'}
              {category === 'document' && 'Dokumente'}
              {category === 'payment' && 'Zahlungen'}
              {category === 'reminder' && 'Erinnerungen'}
              {category === 'system' && 'System'}
            </Text>
            <Switch
              value={enabledCategories.includes(category)}
              onValueChange={() => toggleCategory(category)}
            />
          </View>
        ))}
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Rich Notifications:</Text>
          <Switch
            value={enableRichNotifications}
            onValueChange={setEnableRichNotifications}
          />
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Töne aktivieren:</Text>
          <Switch
            value={enableSounds}
            onValueChange={setEnableSounds}
          />
        </View>
        
        <Text style={styles.label}>Ruhezeiten:</Text>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Von:</Text>
          <TextInput
            style={styles.timeInput}
            value={quietHoursStart}
            onChangeText={setQuietHoursStart}
            placeholder="HH:MM"
          />
          <Text style={styles.timeLabel}>Bis:</Text>
          <TextInput
            style={styles.timeInput}
            value={quietHoursEnd}
            onChangeText={setQuietHoursEnd}
            placeholder="HH:MM"
          />
        </View>
        
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={savePreferences}>
          <Text style={styles.buttonTextWhite}>Einstellungen speichern</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Notification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo-Benachrichtigung</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Titel"
          value={demoTitle}
          onChangeText={setDemoTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Nachricht"
          value={demoBody}
          onChangeText={setDemoBody}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.label}>Kategorie:</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoCategory('case_update')}>
            <Text style={demoCategory === 'case_update' ? styles.selectedOption : {}}>
              Fall-Update
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoCategory('deadline')}>
            <Text style={demoCategory === 'deadline' ? styles.selectedOption : {}}>
              Frist
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoCategory('document')}>
            <Text style={demoCategory === 'document' ? styles.selectedOption : {}}>
              Dokument
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Priorität:</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('low')}>
            <Text style={demoPriority === 'low' ? styles.selectedOption : {}}>
              Niedrig
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('normal')}>
            <Text style={demoPriority === 'normal' ? styles.selectedOption : {}}>
              Normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('high')}>
            <Text style={demoPriority === 'high' ? styles.selectedOption : {}}>
              Hoch
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Geplant senden:</Text>
          <Switch
            value={demoScheduled}
            onValueChange={setDemoScheduled}
          />
        </View>
        
        {demoScheduled && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>In (Minuten):</Text>
            <TextInput
              style={styles.timeInput}
              value={demoScheduleTime}
              onChangeText={setDemoScheduleTime}
              placeholder="Minuten"
              keyboardType="numeric"
            />
          </View>
        )}
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Rich Content:</Text>
          <Switch
            value={demoRichContent}
            onValueChange={setDemoRichContent}
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={sendDemoNotification}>
          <Text style={styles.buttonText}>Benachrichtigung senden</Text>
        </TouchableOpacity>
      </View>

      {/* Personalized Notification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalisierte Benachrichtigung</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Fall-ID"
          value={demoCaseId}
          onChangeText={setDemoCaseId}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Fall-Titel"
          value={demoCaseTitle}
          onChangeText={setDemoCaseTitle}
        />
        
        <Text style={styles.label}>Falltyp:</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoCaseType('mietrecht')}>
            <Text style={demoCaseType === 'mietrecht' ? styles.selectedOption : {}}>
              Mietrecht
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoCaseType('arbeitsrecht')}>
            <Text style={demoCaseType === 'arbeitsrecht' ? styles.selectedOption : {}}>
              Arbeitsrecht
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Benachrichtigungstyp:</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoNotificationType('case_update')}>
            <Text style={demoNotificationType === 'case_update' ? styles.selectedOption : {}}>
              Fall-Update
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoNotificationType('deadline_reminder')}>
            <Text style={demoNotificationType === 'deadline_reminder' ? styles.selectedOption : {}}>
              Frist-Erinnerung
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Priorität:</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('low')}>
            <Text style={demoPriority === 'low' ? styles.selectedOption : {}}>
              Niedrig
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('normal')}>
            <Text style={demoPriority === 'normal' ? styles.selectedOption : {}}>
              Normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOption} onPress={() => setDemoPriority('high')}>
            <Text style={demoPriority === 'high' ? styles.selectedOption : {}}>
              Hoch
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Rich Content:</Text>
          <Switch
            value={demoRichContent}
            onValueChange={setDemoRichContent}
          />
        </View>
        
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={sendPersonalizedDemo}>
          <Text style={styles.buttonTextWhite}>Personalisierte Benachrichtigung senden</Text>
        </TouchableOpacity>
      </View>

      {/* Scheduled Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Geplante Benachrichtigungen</Text>
        <Text style={styles.infoText}>
          Anzahl geplanter Benachrichtigungen: {scheduledNotifications.length}
        </Text>
        
        {scheduledNotifications.length > 0 && (
          <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={cancelAllScheduled}>
            <Text style={styles.buttonTextWhite}>Alle abbrechen</Text>
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
    marginBottom: 12,
    paddingVertical: 4
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
    marginBottom: 12
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  timeLabel: {
    fontSize: 16,
    marginRight: 8
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    width: 80,
    textAlign: 'center'
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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  pickerOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8
  },
  selectedOption: {
    color: '#007AFF',
    fontWeight: 'bold'
  },
  infoText: {
    fontSize: 16,
    marginBottom: 12
  }
});

export default PushNotificationDemo;