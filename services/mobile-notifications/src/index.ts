/**
 * Mobile Notifications Service Main Entry Point
 * 
 * This service handles mobile push notifications for the SmartLaw Mietrecht application.
 */

import express from 'express';
import dotenv from 'dotenv';
import { MobileNotificationService } from './services/MobileNotificationService';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());

// Initialize mobile notification service
const mobileNotificationService = new MobileNotificationService();

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mobile Notifications Service'
  });
});

/**
 * Register device for push notifications
 */
app.post('/register-device', async (req, res) => {
  try {
    const { deviceId, deviceToken, platform, lawyerId } = req.body;
    
    if (!deviceId || !deviceToken || !platform) {
      return res.status(400).json({ error: 'Missing required fields: deviceId, deviceToken, platform' });
    }
    
    await mobileNotificationService.registerDevice(deviceId, deviceToken, platform, lawyerId);
    
    return res.status(200).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Error registering device:', error);
    return res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * Send push notification to a device
 */
app.post('/send-notification', async (req, res) => {
  try {
    const { deviceId, title, body, data } = req.body;
    
    if (!deviceId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: deviceId, title, body' });
    }
    
    const result = await mobileNotificationService.sendNotification(deviceId, title, body, data);
    
    if (result.success) {
      return res.status(200).json({ message: 'Notification sent successfully', result });
    } else {
      return res.status(500).json({ error: 'Failed to send notification', result });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * Send bulk notifications to multiple devices
 */
app.post('/send-bulk-notifications', async (req, res) => {
  try {
    const { deviceIds, title, body, data } = req.body;
    
    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid deviceIds array' });
    }
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Missing required fields: title, body' });
    }
    
    const results = await mobileNotificationService.sendBulkNotifications(deviceIds, title, body, data);
    
    return res.status(200).json({ message: 'Bulk notifications sent', results });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return res.status(500).json({ error: 'Failed to send bulk notifications' });
  }
});

/**
 * Unregister device from push notifications
 */
app.delete('/unregister-device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId parameter' });
    }
    
    await mobileNotificationService.unregisterDevice(deviceId);
    
    return res.status(200).json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    return res.status(500).json({ error: 'Failed to unregister device' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Mobile Notifications Service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Mobile Notifications Service...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Mobile Notifications Service...');
  process.exit(0);
});

export default app;