/**
 * Advanced Notification Configuration
 * This module defines advanced notification settings and channels.
 */

// Configuration for different notification channels
const notificationConfig = {
  // Email configuration
  email: {
    enabled: true,
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'mietrecht.agent@example.com',
      pass: process.env.EMAIL_PASS || 'sicheres-passwort-hier'
    },
    defaultSender: process.env.EMAIL_FROM || 'mietrecht.agent@example.com',
    templates: {
      newDecision: 'new_court_decision',
      systemAlert: 'system_alert',
      performanceAlert: 'performance_alert',
      dailySummary: 'daily_summary'
    }
  },
  
  // SMS configuration (using a service like Twilio)
  sms: {
    enabled: false, // Disabled by default
    provider: 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  },
  
  // Push notification configuration (using Firebase Cloud Messaging)
  push: {
    enabled: true, // Enabled
    provider: 'fcm',
    serverKey: process.env.FCM_SERVER_KEY || '',
    projectId: process.env.FCM_PROJECT_ID || ''
  },
  
  // RSS feed configuration
  rss: {
    enabled: true,
    feedTitle: 'Mietrecht Agent - Neue Urteile',
    feedDescription: 'Aktuelle Mietrechtsurteile aus Deutschland',
    feedLanguage: 'de',
    feedUrl: process.env.RSS_FEED_URL || 'https://mietrecht-agent.example.com/feed.xml',
    feedLink: process.env.RSS_FEED_LINK || 'https://mietrecht-agent.example.com'
  },
  
  // Real-time notification configuration (WebSocket/Webhook)
  realtime: {
    enabled: true, // Enabled
    webhookUrl: process.env.WEBHOOK_URL || 'https://mietrecht-agent.example.com/webhook',
    webhookSecret: process.env.WEBHOOK_SECRET || 'geheimes-webhook-secret'
  },
  
  // Admin recipients for system alerts
  adminRecipients: [
    process.env.ADMIN_EMAIL || 'admin@mietrecht-agent.example.com'
  ],
  
  // Default notification preferences
  defaultPreferences: {
    channels: ['email'],
    frequency: 'immediate', // immediate, daily, weekly
    importanceThreshold: 'medium' // low, medium, high
  },
  
  // Channel priorities (for fallback)
  channelPriorities: [
    'email',
    'sms',
    'push'
  ],
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true
  }
};

// Export configuration
module.exports = { notificationConfig };