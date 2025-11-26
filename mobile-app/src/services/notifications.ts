// @ts-ignore
import * as Notifications from 'expo-notifications';
// @ts-ignore
import * as Device from 'expo-device';
// @ts-ignore
import { Platform } from 'react-native';
// @ts-ignore
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  // @ts-ignore
  async initialize() {
    if (!Device.isDevice) {
      // @ts-ignore
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // @ts-ignore
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // @ts-ignore
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id-here';
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976d2',
        });

        await Notifications.setNotificationChannelAsync('chat', {
          name: 'Chat Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976d2',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      // @ts-ignore
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // @ts-ignore
  async registerPushToken() {
    if (!this.expoPushToken) {
      await this.initialize();
    }

    if (this.expoPushToken) {
      try {
        // Add basic security validation
        if (this.expoPushToken.length < 10) {
          throw new Error('Invalid push token');
        }
        
        await api.post('/notifications/register', {
          token: this.expoPushToken,
          platform: Platform.OS,
        });
      } catch (error) {
        // @ts-ignore
        console.error('Error registering push token:', error);
      }
    }
  }

  // @ts-ignore
  async scheduleLocalNotification(title: string, body: string, data?: any) {
    try {
      // Add basic validation
      if (!title || !body) {
        throw new Error('Title and body are required');
      }
      
      // Limit content length for security
      if (title.length > 100 || body.length > 500) {
        throw new Error('Notification content too long');
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      // @ts-ignore
      console.error('Error scheduling notification:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ) {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener((notification: any) => {
      // @ts-ignore
      console.log('Notification received:', notification);
      
      // Basic security validation
      if (notification && typeof notification === 'object') {
        onNotificationReceived?.(notification);
      }
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      // @ts-ignore
      console.log('Notification response:', response);
      
      // Basic security validation
      if (response && typeof response === 'object') {
        onNotificationResponse?.(response);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(receivedListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // @ts-ignore
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  // @ts-ignore
  async setBadgeCount(count: number) {
    // Add validation
    if (count < 0 || count > 99) {
      throw new Error('Badge count must be between 0 and 99');
    }
    await Notifications.setBadgeCountAsync(count);
  }

  // @ts-ignore
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  // @ts-ignore
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export default new NotificationService();
