/**
 * Personalized Notification Service
 * 
 * This service creates personalized notifications based on user behavior,
 * case data, and preferences using AI-driven insights.
 */

import { pushNotificationService, PushNotificationPayload, NotificationCategory, RichNotificationAction, RichNotificationAttachment } from './pushNotificationService';
import { mobileOfflineStorageService } from './mobileOfflineStorage';

// Types for personalized notifications
export interface UserBehaviorData {
  userId: string;
  frequentlyAccessedCases: string[];
  recentlyCreatedItems: string[];
  favoriteDocuments: string[];
  preferredCommunicationTimes: {
    morning: number; // 6-12, count of interactions
    afternoon: number; // 12-18, count of interactions
    evening: number; // 18-24, count of interactions
    night: number; // 0-6, count of interactions
  };
  lastActiveTimestamp?: Date;
  preferredCategories: NotificationCategory[];
}

export interface CaseNotificationData {
  caseId: string;
  caseTitle: string;
  nextDeadline?: Date;
  unreadMessages: number;
  pendingDocuments: number;
  caseStatus: 'active' | 'closed' | 'pending';
  assignedLawyer?: string;
  caseType?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface PersonalizedNotificationConfig {
  userId: string;
  caseData: CaseNotificationData;
  behaviorData: UserBehaviorData;
  notificationType: 'deadline_reminder' | 'document_ready' | 'message_received' | 'case_update' | 'payment_due';
  priorityOverride?: 'high' | 'normal' | 'low';
  includeRichContent?: boolean;
}

// KI-basierte Kategorisierung
export interface NotificationCategorization {
  category: NotificationCategory;
  confidence: number; // 0-1
  reasoning: string;
}

class PersonalizedNotificationService {
  private userBehaviors: Map<string, UserBehaviorData> = new Map();

  /**
   * Initialize the personalized notification service
   */
  async initialize(): Promise<void> {
    try {
      // Load user behavior data from storage
      await this.loadUserBehaviorData();
      console.log('Personalized notification service initialized');
    } catch (error) {
      console.error('Failed to initialize personalized notification service:', error);
      throw error;
    }
  }

  /**
   * Load user behavior data from storage
   */
  private async loadUserBehaviorData(): Promise<void> {
    try {
      // In a real implementation, this would load from a database or API
      // For now, we'll initialize with empty data
      console.log('Loaded user behavior data');
    } catch (error) {
      console.error('Failed to load user behavior data:', error);
      throw error;
    }
  }

  /**
   * Generate and send a personalized notification
   */
  async generateAndSendNotification(config: PersonalizedNotificationConfig): Promise<boolean> {
    try {
      // Generate personalized notification content
      const notificationPayload = await this.generatePersonalizedNotification(config);
      
      // Send the notification
      const success = await pushNotificationService.sendNotification(notificationPayload);
      
      if (success) {
        console.log(`Personalized notification sent to user ${config.userId}`);
        return true;
      } else {
        console.log(`Personalized notification not sent to user ${config.userId} (possibly filtered)`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to generate and send personalized notification to user ${config.userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate personalized notification content
   */
  private async generatePersonalizedNotification(config: PersonalizedNotificationConfig): Promise<PushNotificationPayload> {
    const { userId, caseData, behaviorData, notificationType, includeRichContent } = config;
    
    let title = '';
    let body = '';
    let priority: 'high' | 'normal' | 'low' = 'normal';
    let category: NotificationCategory = 'reminder';
    let subtitle: string | undefined;
    let badge: number | undefined;
    let sound: string | undefined;
    let attachments: RichNotificationAttachment[] | undefined;
    let actions: RichNotificationAction[] | undefined;

    // Customize notification based on type
    switch (notificationType) {
      case 'deadline_reminder':
        title = `Erinnerung: Frist für ${caseData.caseTitle}`;
        body = `Die Frist für Ihren Fall "${caseData.caseTitle}" ist am ${caseData.nextDeadline?.toLocaleDateString('de-DE')} fällig.`;
        priority = config.priorityOverride || 'high';
        category = 'deadline';
        if (includeRichContent) {
          subtitle = 'Frist Erinnerung';
          badge = 1;
          actions = [
            {
              actionId: 'snooze',
              title: 'Später erinnern',
              behavior: 'default',
              activationMode: 'background'
            },
            {
              actionId: 'mark-complete',
              title: 'Als erledigt markieren',
              behavior: 'destructive',
              activationMode: 'background'
            }
          ];
        }
        break;
        
      case 'document_ready':
        title = `Dokument bereit: ${caseData.caseTitle}`;
        body = `Ein neues Dokument für Ihren Fall "${caseData.caseTitle}" ist bereit zum Herunterladen.`;
        priority = config.priorityOverride || 'normal';
        category = 'document';
        if (includeRichContent) {
          subtitle = 'Dokument verfügbar';
          badge = 1;
          attachments = [
            {
              id: 'document-preview',
              url: 'https://example.com/document-preview.png',
              mimeType: 'image/png'
            }
          ];
          actions = [
            {
              actionId: 'download',
              title: 'Herunterladen',
              behavior: 'default',
              activationMode: 'background'
            },
            {
              actionId: 'view',
              title: 'Ansehen',
              behavior: 'default',
              activationMode: 'foreground'
            }
          ];
        }
        break;
        
      case 'message_received':
        title = `Neue Nachricht: ${caseData.caseTitle}`;
        body = `Sie haben ${caseData.unreadMessages} ungelesene Nachricht${caseData.unreadMessages > 1 ? 'n' : ''} in Ihrem Fall "${caseData.caseTitle}".`;
        priority = config.priorityOverride || 'high';
        category = 'case_update';
        if (includeRichContent) {
          subtitle = 'Neue Nachricht';
          badge = caseData.unreadMessages;
          actions = [
            {
              actionId: 'reply',
              title: 'Antworten',
              behavior: 'textInput',
              activationMode: 'foreground'
            },
            {
              actionId: 'mark-read',
              title: 'Als gelesen markieren',
              behavior: 'default',
              activationMode: 'background'
            }
          ];
        }
        break;
        
      case 'case_update':
        title = `Fall-Update: ${caseData.caseTitle}`;
        body = `Es gibt Neuigkeiten zu Ihrem Fall "${caseData.caseTitle}".`;
        priority = config.priorityOverride || 'normal';
        category = 'case_update';
        if (includeRichContent) {
          subtitle = 'Fall Aktualisierung';
          badge = 1;
          actions = [
            {
              actionId: 'view-details',
              title: 'Details ansehen',
              behavior: 'default',
              activationMode: 'foreground'
            }
          ];
        }
        break;
        
      case 'payment_due':
        title = `Zahlung fällig: ${caseData.caseTitle}`;
        body = `Eine Zahlung für Ihren Fall "${caseData.caseTitle}" ist bald fällig.`;
        priority = config.priorityOverride || 'high';
        category = 'payment';
        if (includeRichContent) {
          subtitle = 'Zahlungserinnerung';
          badge = 1;
          actions = [
            {
              actionId: 'pay-now',
              title: 'Jetzt bezahlen',
              behavior: 'default',
              activationMode: 'foreground'
            },
            {
              actionId: 'snooze',
              title: 'Später erinnern',
              behavior: 'default',
              activationMode: 'background'
            }
          ];
        }
        break;
        
      default:
        title = 'Benachrichtigung';
        body = 'Sie haben eine neue Benachrichtigung.';
        priority = config.priorityOverride || 'normal';
        category = 'reminder';
    }

    // Personalize based on user behavior
    if (behaviorData.frequentlyAccessedCases.includes(caseData.caseId)) {
      // User frequently accesses this case, increase priority
      if (priority === 'normal') priority = 'high';
      body += ' Dies ist einer Ihrer häufig betrachteten Fälle.';
    }

    // Add lawyer information if available
    if (caseData.assignedLawyer) {
      body += ` Ihr Anwalt: ${caseData.assignedLawyer}`;
    }

    // Determine optimal sending time based on user behavior
    const optimalTime = this.calculateOptimalSendingTime(behaviorData);

    return {
      title,
      body,
      priority,
      category,
      subtitle,
      badge,
      sound: behaviorData.preferredCategories.includes(category) ? 'default' : undefined,
      attachments,
      actions,
      data: {
        caseId: caseData.caseId,
        notificationType,
        timestamp: new Date().toISOString()
      },
      scheduledTime: optimalTime,
      userId
    };
  }

  /**
   * Calculate optimal sending time based on user behavior
   */
  private calculateOptimalSendingTime(behaviorData: UserBehaviorData): Date {
    const now = new Date();
    const preferredTimes = behaviorData.preferredCommunicationTimes;
    
    // Find the user's most active time period
    const periods = [
      { name: 'morning', count: preferredTimes.morning },
      { name: 'afternoon', count: preferredTimes.afternoon },
      { name: 'evening', count: preferredTimes.evening },
      { name: 'night', count: preferredTimes.night }
    ];
    
    // Sort by interaction count (descending)
    periods.sort((a, b) => b.count - a.count);
    
    // Get the optimal hour based on preferred time
    let optimalHour = now.getHours();
    switch (periods[0].name) {
      case 'morning':
        optimalHour = 9; // 9 AM
        break;
      case 'afternoon':
        optimalHour = 14; // 2 PM
        break;
      case 'evening':
        optimalHour = 19; // 7 PM
        break;
      case 'night':
        optimalHour = 21; // 9 PM
        break;
    }
    
    // Create date for tomorrow at optimal time if it's too late today
    const sendDate = new Date(now);
    if (now.getHours() > optimalHour) {
      sendDate.setDate(sendDate.getDate() + 1);
    }
    sendDate.setHours(optimalHour, 0, 0, 0);
    
    return sendDate;
  }

  /**
   * Track user behavior for notification personalization
   */
  async trackUserBehavior(userId: string, behavior: Partial<UserBehaviorData>): Promise<void> {
    try {
      // Get existing behavior data or create new
      let userData = this.userBehaviors.get(userId);
      if (!userData) {
        userData = {
          userId,
          frequentlyAccessedCases: [],
          recentlyCreatedItems: [],
          favoriteDocuments: [],
          preferredCategories: ['case_update', 'deadline', 'document', 'payment'],
          preferredCommunicationTimes: {
            morning: 0,
            afternoon: 0,
            evening: 0,
            night: 0
          }
        };
      }

      // Update behavior data
      if (behavior.frequentlyAccessedCases) {
        userData.frequentlyAccessedCases = behavior.frequentlyAccessedCases;
      }
      
      if (behavior.recentlyCreatedItems) {
        userData.recentlyCreatedItems = behavior.recentlyCreatedItems;
      }
      
      if (behavior.favoriteDocuments) {
        userData.favoriteDocuments = behavior.favoriteDocuments;
      }
      
      if (behavior.preferredCommunicationTimes) {
        userData.preferredCommunicationTimes = {
          ...userData.preferredCommunicationTimes,
          ...behavior.preferredCommunicationTimes
        };
      }
      
      if (behavior.preferredCategories) {
        userData.preferredCategories = behavior.preferredCategories;
      }
      
      if (behavior.lastActiveTimestamp) {
        userData.lastActiveTimestamp = behavior.lastActiveTimestamp;
      }

      // Save updated behavior data
      this.userBehaviors.set(userId, userData);
      
      // Also save to persistent storage
      await mobileOfflineStorageService.saveSetting(`userBehavior_${userId}`, userData);
      
      console.log(`User behavior tracked for user ${userId}`);
    } catch (error) {
      console.error(`Failed to track user behavior for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user behavior data
   */
  async getUserBehavior(userId: string): Promise<UserBehaviorData | null> {
    try {
      // Check memory cache first
      if (this.userBehaviors.has(userId)) {
        return this.userBehaviors.get(userId) || null;
      }

      // Try to load from persistent storage
      const storedData = await mobileOfflineStorageService.getSetting(`userBehavior_${userId}`);
      if (storedData) {
        const userData = JSON.parse(storedData);
        this.userBehaviors.set(userId, userData);
        return userData;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get user behavior for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate case summary notification
   */
  async generateCaseSummaryNotification(userId: string, caseData: CaseNotificationData): Promise<boolean> {
    try {
      const behaviorData = await this.getUserBehavior(userId) || {
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

      const config: PersonalizedNotificationConfig = {
        userId,
        caseData,
        behaviorData,
        notificationType: 'case_update',
        includeRichContent: true
      };

      return await this.generateAndSendNotification(config);
    } catch (error) {
      console.error(`Failed to generate case summary notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate deadline reminder notification
   */
  async generateDeadlineReminder(userId: string, caseData: CaseNotificationData): Promise<boolean> {
    try {
      // Only send if there's a deadline
      if (!caseData.nextDeadline) {
        return false;
      }

      const behaviorData = await this.getUserBehavior(userId) || {
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

      const config: PersonalizedNotificationConfig = {
        userId,
        caseData,
        behaviorData,
        notificationType: 'deadline_reminder',
        includeRichContent: true
      };

      return await this.generateAndSendNotification(config);
    } catch (error) {
      console.error(`Failed to generate deadline reminder for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate document ready notification
   */
  async generateDocumentReadyNotification(userId: string, caseData: CaseNotificationData): Promise<boolean> {
    try {
      // Only send if there are pending documents
      if (caseData.pendingDocuments <= 0) {
        return false;
      }

      const behaviorData = await this.getUserBehavior(userId) || {
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

      const config: PersonalizedNotificationConfig = {
        userId,
        caseData,
        behaviorData,
        notificationType: 'document_ready',
        includeRichContent: true
      };

      return await this.generateAndSendNotification(config);
    } catch (error) {
      console.error(`Failed to generate document ready notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * KI-basierte Kategorisierung von Benachrichtigungen
   */
  async categorizeNotification(caseData: CaseNotificationData, behaviorData: UserBehaviorData): Promise<NotificationCategorization> {
    try {
      // Simple KI-basierte Kategorisierung basierend auf Falltyp und Nutzerverhalten
      let category: NotificationCategory = 'reminder';
      let confidence = 0.5;
      let reasoning = '';

      // Kategorisierung basierend auf Falltyp
      if (caseData.caseType) {
        switch (caseData.caseType.toLowerCase()) {
          case 'mietrecht':
            if (caseData.nextDeadline) {
              category = 'deadline';
              confidence = 0.9;
              reasoning = 'Mietrecht-Fall mit bevorstehender Frist';
            } else if (caseData.pendingDocuments > 0) {
              category = 'document';
              confidence = 0.8;
              reasoning = 'Mietrecht-Fall mit ausstehenden Dokumenten';
            } else {
              category = 'case_update';
              confidence = 0.7;
              reasoning = 'Mietrecht-Fall mit allgemeinem Update';
            }
            break;
          case 'arbeitsrecht':
            category = 'case_update';
            confidence = 0.7;
            reasoning = 'Arbeitsrecht-Fall';
            break;
          case 'familienrecht':
            category = 'case_update';
            confidence = 0.7;
            reasoning = 'Familienrecht-Fall';
            break;
          default:
            category = 'case_update';
            confidence = 0.6;
            reasoning = 'Allgemeiner Falltyp';
        }
      }

      // Anpassung basierend auf Nutzerverhalten
      if (behaviorData.frequentlyAccessedCases.includes(caseData.caseId)) {
        confidence = Math.min(confidence + 0.1, 1.0);
        reasoning += ' Nutzer greift häufig auf diesen Fall zu';
      }

      if (caseData.priority === 'high') {
        confidence = Math.min(confidence + 0.1, 1.0);
        reasoning += ' Fall hat hohe Priorität';
      }

      return {
        category,
        confidence,
        reasoning
      };
    } catch (error) {
      console.error('Failed to categorize notification:', error);
      throw error;
    }
  }

  /**
   * Registriere Benachrichtigungskategorien
   */
  async registerNotificationCategories(): Promise<void> {
    try {
      const categories = [
        {
          identifier: 'case_update',
          actions: [
            {
              actionId: 'view-details',
              title: 'Details ansehen',
              behavior: 'default',
              activationMode: 'foreground'
            }
          ] as RichNotificationAction[]
        },
        {
          identifier: 'deadline',
          actions: [
            {
              actionId: 'snooze',
              title: 'Später erinnern',
              behavior: 'default',
              activationMode: 'background'
            },
            {
              actionId: 'mark-complete',
              title: 'Als erledigt markieren',
              behavior: 'destructive',
              activationMode: 'background'
            }
          ] as RichNotificationAction[]
        },
        {
          identifier: 'document',
          actions: [
            {
              actionId: 'download',
              title: 'Herunterladen',
              behavior: 'default',
              activationMode: 'background'
            },
            {
              actionId: 'view',
              title: 'Ansehen',
              behavior: 'default',
              activationMode: 'foreground'
            }
          ] as RichNotificationAction[]
        },
        {
          identifier: 'payment',
          actions: [
            {
              actionId: 'pay-now',
              title: 'Jetzt bezahlen',
              behavior: 'default',
              activationMode: 'foreground'
            },
            {
              actionId: 'snooze',
              title: 'Später erinnern',
              behavior: 'default',
              activationMode: 'background'
            }
          ] as RichNotificationAction[]
        },
        {
          identifier: 'message',
          actions: [
            {
              actionId: 'reply',
              title: 'Antworten',
              behavior: 'textInput',
              activationMode: 'foreground'
            },
            {
              actionId: 'mark-read',
              title: 'Als gelesen markieren',
              behavior: 'default',
              activationMode: 'background'
            }
          ] as RichNotificationAction[]
        }
      ];

      await pushNotificationService.registerNotificationCategories(categories);
      console.log('Notification categories registered');
    } catch (error) {
      console.error('Failed to register notification categories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const personalizedNotificationService = new PersonalizedNotificationService();