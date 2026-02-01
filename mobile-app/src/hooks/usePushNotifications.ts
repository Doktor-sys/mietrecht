/**
 * React Hook for Push Notifications
 * 
 * This hook provides easy access to push notification functionality in React components
 * with proper state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  pushNotificationService, 
  PushNotificationPayload, 
  UserNotificationPreferences,
  RichNotificationAction
} from '../services/pushNotificationService';
import { 
  personalizedNotificationService, 
  UserBehaviorData, 
  CaseNotificationData 
} from '../services/personalizedNotificationService';

// Type definitions for hook state
interface PushNotificationState {
  isSupported: boolean;
  isInitialized: boolean;
  isPermissionGranted: boolean;
  error?: string;
  preferences: UserNotificationPreferences | null;
  scheduledNotifications: any[];
}

// Initial state
const INITIAL_STATE: PushNotificationState = {
  isSupported: true, // Mobile apps always support push notifications
  isInitialized: false,
  isPermissionGranted: false,
  preferences: null,
  scheduledNotifications: []
};

/**
 * Custom React hook for push notification functionality
 */
export const usePushNotifications = (userId: string) => {
  const [state, setState] = useState<PushNotificationState>(INITIAL_STATE);

  /**
   * Initialize push notification functionality
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: undefined }));
      
      // Initialize push notification service
      await pushNotificationService.initialize();
      
      // Initialize personalized notification service
      await personalizedNotificationService.initialize();
      
      // Register notification categories
      await personalizedNotificationService.registerNotificationCategories();
      
      // Get user preferences
      const preferences = await pushNotificationService.getUserPreferences(userId);
      
      // Get scheduled notifications
      const scheduledNotifications = await pushNotificationService.getScheduledNotifications(userId);
      
      setState({
        isSupported: true,
        isInitialized: true,
        isPermissionGranted: true, // Simplified for this example
        preferences,
        scheduledNotifications
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Push notification initialization failed'
      }));
      throw error;
    }
  }, [userId]);

  /**
   * Request permission for push notifications
   */
  const requestPermission = useCallback(async () => {
    try {
      // In a real implementation, this would request permission from the user
      // For now, we'll just simulate granting permission
      
      setState(prev => ({
        ...prev,
        isPermissionGranted: true
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request push notification permission'
      }));
      throw error;
    }
  }, []);

  /**
   * Register device token
   */
  const registerDeviceToken = useCallback(async (deviceToken: string, platform: 'ios' | 'android') => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      await pushNotificationService.registerDeviceToken(userId, deviceToken, platform);
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to register device token'
      }));
      throw error;
    }
  }, [state.isInitialized, userId]);

  /**
   * Send a push notification
   */
  const sendNotification = useCallback(async (payload: PushNotificationPayload) => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      const success = await pushNotificationService.sendNotification(payload);
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Set user notification preferences
   */
  const setPreferences = useCallback(async (preferences: UserNotificationPreferences) => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      await pushNotificationService.setUserPreferences(preferences);
      
      setState(prev => ({
        ...prev,
        preferences
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set notification preferences'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Schedule a notification
   */
  const scheduleNotification = useCallback(async (payload: PushNotificationPayload) => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      const notificationId = await pushNotificationService.scheduleNotification(payload);
      
      // Refresh scheduled notifications list
      const scheduledNotifications = await pushNotificationService.getScheduledNotifications(userId);
      
      setState(prev => ({
        ...prev,
        scheduledNotifications
      }));
      
      return notificationId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to schedule notification'
      }));
      throw error;
    }
  }, [state.isInitialized, userId]);

  /**
   * Cancel a scheduled notification
   */
  const cancelScheduledNotification = useCallback(async (notificationId: string) => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      await pushNotificationService.cancelScheduledNotification(notificationId);
      
      // Refresh scheduled notifications list
      const scheduledNotifications = await pushNotificationService.getScheduledNotifications(userId);
      
      setState(prev => ({
        ...prev,
        scheduledNotifications
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel scheduled notification'
      }));
      throw error;
    }
  }, [state.isInitialized, userId]);

  /**
   * Generate and send a personalized notification
   */
  const sendPersonalizedNotification = useCallback(async (
    caseData: CaseNotificationData,
    notificationType: 'deadline_reminder' | 'document_ready' | 'message_received' | 'case_update' | 'payment_due',
    priorityOverride?: 'high' | 'normal' | 'low',
    includeRichContent: boolean = true
  ) => {
    if (!state.isInitialized) {
      throw new Error('Push notification functionality not initialized');
    }

    try {
      // Get user behavior data
      const behaviorData = await personalizedNotificationService.getUserBehavior(userId) || {
        userId,
        frequentlyAccessedCases: [],
        recentlyCreatedItems: [],
        favoriteDocuments: [],
        preferredCategories: ['case_update', 'deadline', 'document', 'payment'],
        preferredCommunicationTimes: {
          morning: 1,
          afternoon: 1,
          evening: 1,
          night: 1
        }
      };

      // Generate and send personalized notification
      const success = await personalizedNotificationService.generateAndSendNotification({
        userId,
        caseData,
        behaviorData,
        notificationType,
        priorityOverride,
        includeRichContent
      });
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send personalized notification'
      }));
      throw error;
    }
  }, [state.isInitialized, userId]);

  /**
   * Track user behavior for personalization
   */
  const trackUserBehavior = useCallback(async (behavior: Partial<UserBehaviorData>) => {
    try {
      await personalizedNotificationService.trackUserBehavior(userId, behavior);
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to track user behavior'
      }));
      throw error;
    }
  }, [userId]);

  /**
   * Handle incoming notification
   */
  const handleIncomingNotification = useCallback(async (notificationData: any) => {
    try {
      await pushNotificationService.handleIncomingNotification(notificationData);
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to handle incoming notification'
      }));
      throw error;
    }
  }, []);

  /**
   * Handle notification action
   */
  const handleNotificationAction = useCallback(async (actionId: string, notificationData: any) => {
    try {
      await pushNotificationService.handleNotificationAction(actionId, notificationData);
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to handle notification action'
      }));
      throw error;
    }
  }, []);

  /**
   * Register notification categories
   */
  const registerNotificationCategories = useCallback(async (categories: {
    identifier: string;
    actions: RichNotificationAction[];
  }[]) => {
    try {
      await pushNotificationService.registerNotificationCategories(categories);
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to register notification categories'
      }));
      throw error;
    }
  }, []);

  // Effect to initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    ...state,
    
    // Functions
    initialize,
    requestPermission,
    registerDeviceToken,
    sendNotification,
    setPreferences,
    scheduleNotification,
    cancelScheduledNotification,
    sendPersonalizedNotification,
    trackUserBehavior,
    handleIncomingNotification,
    handleNotificationAction,
    registerNotificationCategories
  };
};