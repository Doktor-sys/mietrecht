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

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

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

      // Configure Android channels
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

        await Notifications.setNotificationChannelAsync('legal_updates', {
          name: 'Legal Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#ff5722',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4caf50',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      // @ts-ignore
      console.error('Error initializing push notifications:', error);
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
  async scheduleLocalNotification(title: string, body: string, data?: any, channelId: string = 'default') {
    try {
      // Add basic validation
      if (!title || !body) {
        throw new Error('Title and body are required');
      }
      
      // Limit content length for security
      if (title.length > 100 || body.length > 500) {
        throw new Error('Notification content too long');
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          channelId, // Use specific channel
        },
        trigger: null, // Show immediately
      });
      
      return notificationId;
    } catch (error) {
      // @ts-ignore
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // @ts-ignore
  async scheduleDelayedNotification(
    title: string, 
    body: string, 
    delaySeconds: number, 
    data?: any, 
    channelId: string = 'default'
  ) {
    try {
      // Add basic validation
      if (!title || !body) {
        throw new Error('Title and body are required');
      }
      
      if (delaySeconds <= 0) {
        throw new Error('Delay must be positive');
      }
      
      // Limit content length for security
      if (title.length > 100 || body.length > 500) {
        throw new Error('Notification content too long');
      }
      
      const trigger = {
        seconds: delaySeconds,
      };
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          channelId,
        },
        trigger,
      });
      
      return notificationId;
    } catch (error) {
      // @ts-ignore
      console.error('Error scheduling delayed notification:', error);
      throw error;
    }
  }

  // @ts-ignore
  async scheduleRepeatingNotification(
    title: string, 
    body: string, 
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month', 
    data?: any,
    channelId: string = 'default'
  ) {
    try {
      // Add basic validation
      if (!title || !body) {
        throw new Error('Title and body are required');
      }
      
      // Limit content length for security
      if (title.length > 100 || body.length > 500) {
        throw new Error('Notification content too long');
      }
      
      const trigger = {
        repeats: true,
        seconds: this.getSecondsForInterval(interval),
      };
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          channelId,
        },
        trigger,
      });
      
      return notificationId;
    } catch (error) {
      // @ts-ignore
      console.error('Error scheduling repeating notification:', error);
      throw error;
    }
  }

  private getSecondsForInterval(interval: string): number {
    switch (interval) {
      case 'minute': return 60;
      case 'hour': return 3600;
      case 'day': return 86400;
      case 'week': return 604800;
      case 'month': return 2592000; // Approximate (30 days)
      default: return 86400; // Default to daily
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
      // @ts-ignore
      console.log('Notification received:', notification);
      
      // Basic security validation
      if (notification && typeof notification === 'object') {
        // Extract notification category if available
        const categoryId = notification.request?.content?.categoryId;
        
        // Handle different notification categories
        switch (categoryId) {
          case 'chat_message':
            // @ts-ignore
            console.log('Chat message notification received');
            break;
          case 'legal_update':
            // @ts-ignore
            console.log('Legal update notification received');
            break;
          case 'reminder':
            // @ts-ignore
            console.log('Reminder notification received');
            break;
          default:
            // @ts-ignore
            console.log('General notification received');
        }
        
        onNotificationReceived?.(notification);
      }
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      // @ts-ignore
      console.log('Notification response:', response);
      
      // Basic security validation
      if (response && typeof response === 'object') {
        // Extract action and notification data
        const action = response.actionIdentifier;
        const notification = response.notification;
        const inputData = response.userText; // For text input actions
        
        // Handle different actions
        switch (action) {
          case 'mark_as_read':
            // @ts-ignore
            console.log('Mark as read action triggered');
            break;
          case 'reply':
            // @ts-ignore
            console.log('Reply action triggered with input:', inputData);
            break;
          case 'dismiss':
            // @ts-ignore
            console.log('Dismiss action triggered');
            break;
          case Notifications.DEFAULT_ACTION_IDENTIFIER:
            // @ts-ignore
            console.log('Default action (notification tap) triggered');
            break;
          default:
            // @ts-ignore
            console.log('Unknown action triggered:', action);
        }
        
        onNotificationResponse?.(response);
      }
    });

    return () => {
      // Clean up listeners
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
      }
    };
  }

  // @ts-ignore
  async sendPushNotificationToUser(userId: string, title: string, body: string, data?: any) {
    try {
      // In a real implementation, this would call your backend API
      // to send a push notification to a specific user
      await api.post(`/notifications/send/${userId}`, {
        title,
        body,
        data,
      });
    } catch (error) {
      // @ts-ignore
      console.error('Error sending push notification to user:', error);
      throw error;
    }
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

  // @ts-ignore
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // @ts-ignore
  async presentNotification(title: string, body: string, data?: any, channelId: string = 'default') {
    try {
      // Add basic validation
      if (!title || !body) {
        throw new Error('Title and body are required');
      }
      
      // Limit content length for security
      if (title.length > 100 || body.length > 500) {
        throw new Error('Notification content too long');
      }
      
      const notificationId = await Notifications.presentNotificationAsync({
        title,
        body,
        data,
        channelId,
      });
      
      return notificationId;
    } catch (error) {
      // @ts-ignore
      console.error('Error presenting notification:', error);
      throw error;
    }
  }
}

export default new PushNotificationService();