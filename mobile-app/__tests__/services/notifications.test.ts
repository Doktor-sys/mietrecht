import notificationService from '../../src/services/notifications';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('../../src/services/api');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device.isDevice as any) = true;
  });

  describe('initialize', () => {
    it('should initialize notifications on physical device', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[test-token]',
      });

      const token = await notificationService.initialize();
      
      expect(token).toBe('ExponentPushToken[test-token]');
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('should request permission if not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[test-token]',
      });

      await notificationService.initialize();
      
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return null if not a physical device', async () => {
      (Device.isDevice as any) = false;

      const token = await notificationService.initialize();
      
      expect(token).toBeNull();
    });

    it('should return null if permission denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const token = await notificationService.initialize();
      
      expect(token).toBeNull();
    });
  });

  describe('scheduleLocalNotification', () => {
    it('should schedule a local notification', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

      await notificationService.scheduleLocalNotification(
        'Test Title',
        'Test Body',
        { data: 'test' }
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { data: 'test' },
          sound: 'default',
        },
        trigger: null,
      });
    });
  });

  describe('badge management', () => {
    it('should get badge count', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(5);

      const count = await notificationService.getBadgeCount();
      
      expect(count).toBe(5);
      expect(Notifications.getBadgeCountAsync).toHaveBeenCalled();
    });

    it('should set badge count', async () => {
      await notificationService.setBadgeCount(10);
      
      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(10);
    });

    it('should clear badge', async () => {
      await notificationService.clearBadge();
      
      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('setupNotificationListeners', () => {
    it('should setup notification listeners', () => {
      const mockReceivedListener = { remove: jest.fn() };
      const mockResponseListener = { remove: jest.fn() };

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(
        mockReceivedListener
      );
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockResponseListener
      );

      const onReceived = jest.fn();
      const onResponse = jest.fn();

      const cleanup = notificationService.setupNotificationListeners(onReceived, onResponse);

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

      // Test cleanup
      cleanup();
      expect(Notifications.removeNotificationSubscription).toHaveBeenCalledTimes(2);
    });
  });
});
