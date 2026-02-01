import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { store } from './src/store';
import { theme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import notificationService from './src/services/notifications';
import offlineManager from './src/services/offlineManager';
// Import the new enhanced services
import pushNotificationService from './src/services/pushNotifications';
import enhancedOfflineStorage from './src/services/enhancedOfflineStorage';
import './src/i18n';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkStatus } from './src/components/NetworkStatus';

function AppContent() {
  const navigationRef = useRef<any>();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initialize offline manager
    const cleanupFunction = offlineManager.initialize();
    if (typeof cleanupFunction === 'function') {
      cleanupRef.current = cleanupFunction;
    }

    // Initialize notifications
    notificationService.initialize();

    // Setup notification listeners
    const cleanupNotifications = notificationService.setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);

        // Navigate based on notification data
        const data = response.notification.request.content.data;
        if (data?.screen && navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params);
        }
      }
    );

    return () => {
      // Clean up offline manager listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Clean up notification listeners
      if (typeof cleanupNotifications === 'function') {
        cleanupNotifications();
      }
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <NetworkStatus />
            <AppContent />
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </ErrorBoundary>
  );
}