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
import './src/i18n';

function AppContent() {
  const navigationRef = useRef<any>();

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();

    // Setup notification listeners
    const cleanup = notificationService.setupNotificationListeners(
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

    return cleanup;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}
