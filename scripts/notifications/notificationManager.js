/**
 * Notification Manager
 * This module manages the notification system and coordinates alerts.
 */

const { createNotificationChannel } = require('./notificationService.js');
const { 
  newCourtDecisionTemplate, 
  systemAlertTemplate, 
  performanceAlertTemplate,
  dailySummaryTemplate
} = require('./templates.js');
const { 
  AlertRulesManager,
  highErrorRateRule,
  lowCacheHitRateRule,
  highResponseTimeRule,
  dataSourceOfflineRule,
  noNewDecisionsRule
} = require('./alertRules.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');
const { getAllDataSourceStatuses } = require('../database/dao/dataSourceStatusDao.js');
const { getLogStatistics } = require('../database/dao/systemLogDao.js');
const { getLatestMetricValue } = require('../database/dao/dashboardMetricsDao.js');

/**
 * Notification manager class
 */
class NotificationManager {
  constructor(config) {
    this.config = config;
    this.channels = {};
    this.alertRulesManager = new AlertRulesManager();
    
    // Initialize notification channels
    this.initializeChannels();
    
    // Initialize alert rules
    this.initializeAlertRules();
  }
  
  /**
   * Initialize notification channels
   */
  initializeChannels() {
    // Email channel
    if (this.config.email && this.config.email.enabled) {
      this.channels.email = createNotificationChannel('email', this.config.email);
    }
    
    // SMS channel (stub)
    if (this.config.sms && this.config.sms.enabled) {
      this.channels.sms = createNotificationChannel('sms', this.config.sms);
    }
    
    // Push channel (stub)
    if (this.config.push && this.config.push.enabled) {
      this.channels.push = createNotificationChannel('push', this.config.push);
    }
    
    // Stub channel for testing
    this.channels.stub = createNotificationChannel('stub', {});
  }
  
  /**
   * Initialize alert rules
   */
  initializeAlertRules() {
    this.alertRulesManager.addRule(highErrorRateRule);
    this.alertRulesManager.addRule(lowCacheHitRateRule);
    this.alertRulesManager.addRule(highResponseTimeRule);
    this.alertRulesManager.addRule(dataSourceOfflineRule);
    this.alertRulesManager.addRule(noNewDecisionsRule);
  }
  
  /**
   * Send a notification through specified channels
   * @param {Array} channelNames - Names of channels to use
   * @param {string} recipient - Recipient information
   * @param {string} subject - Notification subject
   * @param {string} body - Notification body
   * @returns {Promise<Array>} Array of send results
   */
  async sendNotification(channelNames, recipient, subject, body) {
    const results = [];
    
    for (const channelName of channelNames) {
      const channel = this.channels[channelName];
      if (channel) {
        try {
          const result = await channel.send(recipient, subject, body);
          results.push({ channel: channelName, success: result.success, error: result.error });
        } catch (error) {
          results.push({ channel: channelName, success: false, error: error.message });
        }
      } else {
        results.push({ channel: channelName, success: false, error: 'Channel not configured' });
      }
    }
    
    return results;
  }
  
  /**
   * Notify lawyers about a new court decision
   * @param {Object} decision - Court decision data
   * @param {Array} relevantLawyers - Lawyers to notify
   * @returns {Promise<Array>} Array of notification results
   */
  async notifyLawyersAboutDecision(decision, relevantLawyers) {
    const results = [];
    
    for (const lawyer of relevantLawyers) {
      if (lawyer.email) {
        const { subject, body } = newCourtDecisionTemplate(decision, lawyer);
        const channelResult = await this.sendNotification(
          ['email'], 
          lawyer.email, 
          subject, 
          body
        );
        results.push({ lawyer: lawyer.name, results: channelResult });
      }
    }
    
    return results;
  }
  
  /**
   * Send system alert notification
   * @param {string} alertType - Type of alert
   * @param {string} message - Alert message
   * @param {string} severity - Severity level
   * @param {Array} channels - Channels to use
   * @returns {Promise<Array>} Array of notification results
   */
  async sendSystemAlert(alertType, message, severity, channels = ['email']) {
    const { subject, body } = systemAlertTemplate(alertType, message, severity);
    
    // Send to admin recipients
    const results = [];
    for (const recipient of this.config.adminRecipients) {
      const channelResults = await this.sendNotification(
        channels,
        recipient,
        subject,
        body
      );
      results.push({ recipient, results: channelResults });
    }
    
    return results;
  }
  
  /**
   * Send performance alert notification
   * @param {string} metric - Performance metric name
   * @param {number} value - Current value
   * @param {number} threshold - Threshold value
   * @returns {Promise<Array>} Array of notification results
   */
  async sendPerformanceAlert(metric, value, threshold) {
    const { subject, body } = performanceAlertTemplate(metric, value, threshold);
    
    // Send to admin recipients
    const results = [];
    for (const recipient of this.config.adminRecipients) {
      const channelResults = await this.sendNotification(
        ['email'],
        recipient,
        subject,
        body
      );
      results.push({ recipient, results: channelResults });
    }
    
    return results;
  }
  
  /**
   * Send daily summary notification
   * @param {Object} summaryData - Summary data
   * @returns {Promise<Array>} Array of notification results
   */
  async sendDailySummary(summaryData) {
    const { subject, body } = dailySummaryTemplate(summaryData);
    
    // Send to admin recipients
    const results = [];
    for (const recipient of this.config.adminRecipients) {
      const channelResults = await this.sendNotification(
        ['email'],
        recipient,
        subject,
        body
      );
      results.push({ recipient, results: channelResults });
    }
    
    return results;
  }
  
  /**
   * Check for alerts based on system status
   * @returns {Promise<Array>} Array of triggered alerts
   */
  async checkForAlerts() {
    try {
      // Gather system data for alert evaluation
      const context = await this.gatherSystemContext();
      
      // Evaluate alert rules
      const triggeredRules = this.alertRulesManager.evaluateRules(context);
      
      // Send notifications for triggered rules
      const alertResults = [];
      for (const rule of triggeredRules) {
        const message = `Alert rule "${rule.name}" has been triggered.`;
        const results = await this.sendSystemAlert(
          rule.name,
          message,
          rule.severity,
          rule.channels
        );
        alertResults.push({ rule: rule.name, results });
      }
      
      return alertResults;
    } catch (error) {
      console.error('Error checking for alerts:', error);
      return [];
    }
  }
  
  /**
   * Gather system context data for alert evaluation
   * @returns {Promise<Object>} Context data
   */
  async gatherSystemContext() {
    // Get data source statuses
    const dataSources = await getAllDataSourceStatuses();
    const dataSourceStatus = {};
    dataSources.forEach(source => {
      dataSourceStatus[source.source_name] = source.status;
    });
    
    // Get log statistics
    const logStats = await getLogStatistics();
    const totalLogs = Object.values(logStats).reduce((sum, count) => sum + count, 0);
    const errorRate = totalLogs > 0 ? (logStats.error || 0) / totalLogs : 0;
    
    // Get performance metrics
    const avgResponseTime = await getLatestMetricValue('avg_response_time') || 0;
    const cacheHitRate = await getLatestMetricValue('cache_hit_rate') || 0;
    
    return {
      dataSourceStatus,
      errorRate,
      avgResponseTime,
      cacheHitRate,
      newDecisionsCount: 0, // This would be set based on actual new decisions
      expectedDecisions: 5, // This would be configured based on expectations
    };
  }
}

// Export the NotificationManager class
module.exports = { NotificationManager };