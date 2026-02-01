import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientIds: string[];
  subject: string;
  content: string;
  sentAt: Date;
  readAt?: Date;
  attachments?: Attachment[];
  priority: 'low' | 'normal' | 'high';
  status: 'sent' | 'delivered' | 'read';
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

interface Thread {
  id: string;
  subject: string;
  participants: Participant[];
  lastMessageAt: Date;
  unreadCount: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
}

export class MessagingIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Sendet eine neue Nachricht
   */
  async sendMessage(messageData: Omit<Message, 'id' | 'sentAt' | 'status'>): Promise<Message> {
    try {
      const response = await this.apiClient.post('/messages', { message: messageData });
      return response.data.message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Holt alle Nachrichtenthreads für einen Benutzer
   */
  async getMessageThreads(userId: string): Promise<Thread[]> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/threads`);
      return response.data.threads;
    } catch (error) {
      logger.error(`Error fetching threads for user ${userId}:`, error);
      throw new Error('Failed to fetch message threads');
    }
  }

  /**
   * Holt alle Nachrichten in einem Thread
   */
  async getMessagesInThread(threadId: string): Promise<Message[]> {
    try {
      const response = await this.apiClient.get(`/threads/${threadId}/messages`);
      return response.data.messages;
    } catch (error) {
      logger.error(`Error fetching messages in thread ${threadId}:`, error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Markiert eine Nachricht als gelesen
   */
  async markMessageAsRead(messageId: string): Promise<Message> {
    try {
      const response = await this.apiClient.patch(`/messages/${messageId}`, { 
        message: { status: 'read', readAt: new Date() } 
      });
      return response.data.message;
    } catch (error) {
      logger.error(`Error marking message ${messageId} as read:`, error);
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * Löscht eine Nachricht
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/messages/${messageId}`);
    } catch (error) {
      logger.error(`Error deleting message ${messageId}:`, error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Erstellt eine Benachrichtigung
   */
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    try {
      const response = await this.apiClient.post('/notifications', { notification: notificationData });
      return response.data.notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Holt alle Benachrichtigungen für einen Benutzer
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/notifications`);
      return response.data.notifications;
    } catch (error) {
      logger.error(`Error fetching notifications for user ${userId}:`, error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Markiert eine Benachrichtigung als gelesen
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await this.apiClient.patch(`/notifications/${notificationId}`, { 
        notification: { readAt: new Date() } 
      });
      return response.data.notification;
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as read:`, error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Löscht eine Benachrichtigung
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      logger.error(`Error deleting notification ${notificationId}:`, error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Sendet eine E-Mail über das Nachrichtensystem
   */
  async sendEmail(emailData: {
    to: string | string[];
    subject: string;
    body: string;
    attachments?: Attachment[];
  }): Promise<any> {
    try {
      const response = await this.apiClient.post('/emails', { email: emailData });
      return response.data;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Sendet eine SMS über das Nachrichtensystem
   */
  async sendSMS(smsData: {
    to: string;
    message: string;
  }): Promise<any> {
    try {
      const response = await this.apiClient.post('/sms', { sms: smsData });
      return response.data;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }
}