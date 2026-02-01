/**
 * Mobile Notification Service
 * 
 * This service handles mobile push notifications using Firebase Cloud Messaging.
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  // Initialize with default credentials for development
  admin.initializeApp();
}

interface DeviceRegistration {
  deviceId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  lawyerId?: string;
  registeredAt: Date;
}

export class MobileNotificationService {
  private registeredDevices: Map<string, DeviceRegistration> = new Map();

  constructor() {
    console.log('Mobile Notification Service initialized');
  }

  /**
   * Register a device for push notifications
   */
  async registerDevice(deviceId: string, deviceToken: string, platform: 'ios' | 'android', lawyerId?: string): Promise<void> {
    const registration: DeviceRegistration = {
      deviceId,
      deviceToken,
      platform,
      lawyerId,
      registeredAt: new Date()
    };

    this.registeredDevices.set(deviceId, registration);
    console.log(`Device registered: ${deviceId} (${platform})`);
  }

  /**
   * Unregister a device from push notifications
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    if (this.registeredDevices.has(deviceId)) {
      this.registeredDevices.delete(deviceId);
      console.log(`Device unregistered: ${deviceId}`);
    }
  }

  /**
   * Send a push notification to a specific device
   */
  async sendNotification(deviceId: string, title: string, body: string, data?: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    const device = this.registeredDevices.get(deviceId);
    
    if (!device) {
      return { success: false, error: 'Device not registered' };
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        token: device.deviceToken,
        data: data || {}
      };

      const response = await admin.messaging().send(message);
      console.log(`Notification sent successfully to device ${deviceId}: ${response}`);
      return { success: true };
    } catch (error: any) {
      console.error(`Error sending notification to device ${deviceId}:`, error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendBulkNotifications(deviceIds: string[], title: string, body: string, data?: Record<string, string>): Promise<Array<{ deviceId: string; success: boolean; error?: string }>> {
    const results: Array<{ deviceId: string; success: boolean; error?: string }> = [];
    
    // Process devices in batches to avoid rate limiting
    const batchSize = 500;
    for (let i = 0; i < deviceIds.length; i += batchSize) {
      const batch = deviceIds.slice(i, i + batchSize);
      const batchPromises = batch.map(deviceId => this.sendNotification(deviceId, title, body, data));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, index) => {
        results.push({
          deviceId: batch[index],
          success: result.success,
          error: result.error
        });
      });
    }
    
    return results;
  }

  /**
   * Send notification to all devices of a specific lawyer
   */
  async sendNotificationToLawyer(lawyerId: string, title: string, body: string, data?: Record<string, string>): Promise<Array<{ deviceId: string; success: boolean; error?: string }>> {
    const lawyerDevices = Array.from(this.registeredDevices.values())
      .filter(device => device.lawyerId === lawyerId)
      .map(device => device.deviceId);
      
    return this.sendBulkNotifications(lawyerDevices, title, body, data);
  }

  /**
   * Get registered devices count
   */
  getRegisteredDevicesCount(): number {
    return this.registeredDevices.size;
  }

  /**
   * Get devices registered for a lawyer
   */
  getLawyerDevices(lawyerId: string): string[] {
    return Array.from(this.registeredDevices.values())
      .filter(device => device.lawyerId === lawyerId)
      .map(device => device.deviceId);
  }
}