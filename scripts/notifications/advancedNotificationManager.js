/**
 * Advanced Notification Manager
 * This module manages advanced notification features including real-time alerts, 
 * push notifications, and RSS feeds.
 */

const { notificationConfig } = require('./advancedNotificationConfig.js');
const { createNotificationChannel } = require('./notificationService.js');
const { newCourtDecisionTemplate } = require('./templates.js');
const crypto = require('crypto');
const https = require('https');

/**
 * Advanced Notification Manager Class
 */
class AdvancedNotificationManager {
  constructor(config = notificationConfig) {
    this.config = config;
    this.channels = {};
    this.rssFeedItems = [];
    this.subscribers = [];
    
    // Initialize notification channels
    this.initializeChannels();
  }
  
  /**
   * Initialize notification channels
   */
  initializeChannels() {
    // Email channel
    if (this.config.email && this.config.email.enabled) {
      this.channels.email = createNotificationChannel('email', this.config.email);
    }
    
    // SMS channel
    if (this.config.sms && this.config.sms.enabled) {
      this.channels.sms = createNotificationChannel('sms', this.config.sms);
    }
    
    // Push notification channel
    if (this.config.push && this.config.push.enabled) {
      this.channels.push = createNotificationChannel('push', this.config.push);
    }
    
    // Stub channel for testing
    this.channels.stub = createNotificationChannel('stub', {});
  }
  
  /**
   * Send real-time notification via webhook
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendRealtimeNotification(data) {
    if (!this.config.realtime || !this.config.realtime.enabled) {
      return { success: false, error: 'Real-time notifications are disabled' };
    }
    
    try {
      // Create signature for webhook verification
      const payload = JSON.stringify(data);
      const signature = crypto
        .createHmac('sha256', this.config.realtime.webhookSecret)
        .update(payload)
        .digest('hex');
      
      // Send webhook request
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'User-Agent': 'Mietrecht-Agent-Webhook'
        }
      };
      
      return new Promise((resolve, reject) => {
        const req = https.request(this.config.realtime.webhookUrl, options, (res) => {
          let responseData = '';
          
          res.on('data', chunk => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, statusCode: res.statusCode, data: responseData });
            } else {
              reject(new Error(`Webhook request failed with status ${res.statusCode}: ${responseData}`));
            }
          });
        });
        
        req.on('error', error => {
          reject(error);
        });
        
        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send push notification to a device via mobile notification service
   * @param {string} deviceId - Device identifier
   * @param {Object} decision - Court decision data
   * @param {Object} lawyer - Lawyer information
   * @returns {Promise<Object>} Send result
   */
  async sendPushNotification(deviceId, decision, lawyer) {
    return await this.sendPushNotificationViaMobileService(deviceId, decision, lawyer);
  }
  
  /**
   * Send push notification to a device via mobile notification service
   * @param {string} deviceId - Device identifier
   * @param {Object} decision - Court decision data
   * @param {Object} lawyer - Lawyer information
   * @returns {Promise<Object>} Send result
   */
  async sendPushNotificationViaMobileService(deviceId, decision, lawyer) {
    try {
      // Make HTTP request to mobile notification service
      const postData = JSON.stringify({
        deviceId: deviceId,
        title: `Neues Mietrechtsurteil: ${decision.az}`,
        body: `${decision.zusammenfassung.substring(0, 100)}...`,
        data: {
          decisionId: decision.id,
          lawyerId: lawyer.id,
          url: decision.url
        }
      });

      const options = {
        hostname: process.env.MOBILE_NOTIFICATIONS_SERVICE_HOST || 'localhost',
        port: process.env.MOBILE_NOTIFICATIONS_SERVICE_PORT || 3005,
        path: '/send-notification',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', chunk => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: JSON.parse(responseData) });
            } else {
              reject(new Error(`Mobile notification service request failed with status ${res.statusCode}: ${responseData}`));
            }
          });
        });
        
        req.on('error', error => {
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Error sending push notification via mobile service:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send SMS notification
   * @param {string} phoneNumber - Phone number
   * @param {Object} decision - Court decision data
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phoneNumber, decision) {
    if (!this.channels.sms) {
      return { success: false, error: 'SMS notifications are not configured' };
    }
    
    try {
      const message = `Neues Mietrechtsurteil (${decision.az}): ${decision.zusammenfassung.substring(0, 120)}...`;
      
      const result = await this.channels.sms.send(phoneNumber, message);
      return result;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Add item to RSS feed
   * @param {Object} decision - Court decision data
   */
  addToRSSFeed(decision) {
    if (!this.config.rss || !this.config.rss.enabled) {
      return;
    }
    
    const feedItem = {
      id: decision.id,
      title: `Neues Mietrechtsurteil: ${decision.az}`,
      description: decision.zusammenfassung,
      link: decision.url,
      pubDate: new Date(decision.datum).toUTCString(),
      guid: `urn:uuid:${decision.id}`
    };
    
    // Add to beginning of array (most recent first)
    this.rssFeedItems.unshift(feedItem);
    
    // Limit to 50 most recent items
    if (this.rssFeedItems.length > 50) {
      this.rssFeedItems = this.rssFeedItems.slice(0, 50);
    }
  }
  
  /**
   * Generate RSS feed XML
   * @returns {string} RSS feed XML
   */
  generateRSSFeed() {
    if (!this.config.rss || !this.config.rss.enabled) {
      return '';
    }
    
    const now = new Date().toUTCString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${this.config.rss.feedTitle}</title>
    <description>${this.config.rss.feedDescription}</description>
    <link>${this.config.rss.feedLink}</link>
    <language>${this.config.rss.feedLanguage}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Mietrecht Agent RSS Generator</generator>
`;
    
    // Add feed items
    this.rssFeedItems.forEach(item => {
      xml += `    <item>
      <title>${item.title}</title>
      <description>${item.description}</description>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>
`;
    });
    
    xml += `  </channel>
</rss>`;
    
    return xml;
  }
  
  /**
   * Send chat notification to a user via chat service
   * @param {string} userId - User identifier
   * @param {Object} decision - Court decision data
   * @param {Object} lawyer - Lawyer information
   * @returns {Promise<Object>} Send result
   */
  async sendChatNotification(userId, decision, lawyer) {
    try {
      // Make HTTP request to chat service
      const postData = JSON.stringify({
        message: `Neues Mietrechtsurteil verfügbar: ${decision.az}\n\n${decision.zusammenfassung.substring(0, 200)}...`,
        userId: userId,
        context: {
          decisionId: decision.id,
          lawyerId: lawyer.id,
          url: decision.url,
          type: 'new_court_decision'
        }
      });

      const options = {
        hostname: process.env.CHAT_SERVICE_HOST || 'localhost',
        port: process.env.CHAT_SERVICE_PORT || 3006,
        path: '/process-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', chunk => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: JSON.parse(responseData) });
            } else {
              reject(new Error(`Chat service request failed with status ${res.statusCode}: ${responseData}`));
            }
          });
        });
        
        req.on('error', error => {
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Error sending chat notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Subscribe to real-time notifications
   * @param {Function} callback - Callback function for notifications
   * @returns {string} Subscription ID
   */
  subscribe(callback) {
    const subscriptionId = crypto.randomBytes(16).toString('hex');
    this.subscribers.push({ id: subscriptionId, callback });
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from real-time notifications
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(subscriptionId) {
    this.subscribers = this.subscribers.filter(sub => sub.id !== subscriptionId);
  }
  
  /**
   * Notify subscribers of a new decision
   * @param {Object} decision - Court decision data
   */
  notifySubscribers(decision) {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback(decision);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }
  
  /**
   * Send multi-channel notification for a new court decision
   * @param {Object} decision - Court decision data
   * @param {Object} lawyer - Lawyer information
   * @param {Array} channels - Channels to use
   * @returns {Promise<Array>} Array of send results
   */
  async sendMultiChannelNotification(decision, lawyer, channels = ['email']) {
    const results = [];
    
    // Add to RSS feed
    this.addToRSSFeed(decision);
    
    // Notify subscribers
    this.notifySubscribers(decision);
    
    // Send real-time notification
    if (this.config.realtime && this.config.realtime.enabled) {
      const realtimeResult = await this.sendRealtimeNotification({
        type: 'new_court_decision',
        decision: decision,
        lawyer: lawyer,
        timestamp: new Date().toISOString()
      });
      results.push({ channel: 'realtime', success: realtimeResult.success, error: realtimeResult.error });
    }
    
    // Send email notification
    if (channels.includes('email') && lawyer.email && this.channels.email) {
      try {
        const { subject, body } = newCourtDecisionTemplate(decision, lawyer);
        const emailResult = await this.channels.email.send(lawyer.email, subject, body);
        results.push({ channel: 'email', success: emailResult.success, error: emailResult.error });
      } catch (error) {
        results.push({ channel: 'email', success: false, error: error.message });
      }
    }
    
    // Send push notification
    if (channels.includes('push') && lawyer.deviceId) {
      const pushResult = await this.sendPushNotificationViaMobileService(lawyer.deviceId, decision, lawyer);
      results.push({ channel: 'push', success: pushResult.success, error: pushResult.error });
    }
    
    // Send SMS notification
    if (channels.includes('sms') && lawyer.phoneNumber && this.channels.sms) {
      const smsResult = await this.sendSMS(lawyer.phoneNumber, decision);
      results.push({ channel: 'sms', success: smsResult.success, error: smsResult.error });
    }
    
    // Send chat notification
    if (channels.includes('chat') && lawyer.userId) {
      const chatResult = await this.sendChatNotification(lawyer.userId, decision, lawyer);
      results.push({ channel: 'chat', success: chatResult.success, error: chatResult.error });
    }
    
    return results;
  }
}

// Export the AdvancedNotificationManager class
module.exports = { AdvancedNotificationManager };