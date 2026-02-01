/**
 * Performance Alerting Module
 * This module provides alerting capabilities for performance issues in the Mietrecht Agent.
 */

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Import notification modules
const { sendEmailNotification } = require('../notifications/emailNotifier.js');

/**
 * Performance Alerting System
 */
class PerformanceAlerting {
  /**
   * Constructor
   * @param {Object} config - Alerting configuration
   */
  constructor(config = {}) {
    this.config = {
      // Thresholds for alerts
      cacheHitRateThreshold: 0.7, // 70%
      databaseQueryTimeThreshold: 100, // ms
      apiResponseTimeThreshold: 2000, // ms
      memoryUsageThreshold: 0.8, // 80%
      errorRateThreshold: 0.05, // 5%
      
      // Notification settings
      adminEmail: 'admin@mietrecht-agent.de',
      alertCooldown: 300000, // 5 minutes in milliseconds
      
      // Enable/disable alerts
      enableEmailAlerts: true,
      enableLogAlerts: true,
      
      ...config
    };
    
    // Track last alert times to prevent spam
    this.lastAlertTimes = {};
    
    // Alert history
    this.alertHistory = [];
  }
  
  /**
   * Check performance metrics and send alerts if thresholds are exceeded
   * @param {Object} metrics - Performance metrics
   * @returns {Promise<Array>} Array of triggered alerts
   */
  async checkAndAlert(metrics) {
    const triggeredAlerts = [];
    
    // Check cache performance
    if (metrics.cache && metrics.cache.hitRate < this.config.cacheHitRateThreshold) {
      const alert = {
        type: 'cache_performance',
        severity: 'warning',
        message: `Cache hit rate (${(metrics.cache.hitRate * 100).toFixed(2)}%) is below threshold (${this.config.cacheHitRateThreshold * 100}%).`,
        timestamp: new Date().toISOString(),
        metrics: {
          hitRate: metrics.cache.hitRate,
          threshold: this.config.cacheHitRateThreshold
        }
      };
      
      triggeredAlerts.push(alert);
    }
    
    // Check database performance
    if (metrics.database && metrics.database.avgQueryTime > this.config.databaseQueryTimeThreshold) {
      const alert = {
        type: 'database_performance',
        severity: 'warning',
        message: `Average database query time (${metrics.database.avgQueryTime.toFixed(2)}ms) exceeds threshold (${this.config.databaseQueryTimeThreshold}ms).`,
        timestamp: new Date().toISOString(),
        metrics: {
          avgQueryTime: metrics.database.avgQueryTime,
          threshold: this.config.databaseQueryTimeThreshold
        }
      };
      
      triggeredAlerts.push(alert);
    }
    
    // Check API performance
    if (metrics.api && metrics.api.avgResponseTime > this.config.apiResponseTimeThreshold) {
      const alert = {
        type: 'api_performance',
        severity: 'error',
        message: `Average API response time (${metrics.api.avgResponseTime.toFixed(2)}ms) exceeds threshold (${this.config.apiResponseTimeThreshold}ms).`,
        timestamp: new Date().toISOString(),
        metrics: {
          avgResponseTime: metrics.api.avgResponseTime,
          threshold: this.config.apiResponseTimeThreshold
        }
      };
      
      triggeredAlerts.push(alert);
    }
    
    // Check error rate
    if (metrics.api && metrics.api.errorRate > this.config.errorRateThreshold) {
      const alert = {
        type: 'api_errors',
        severity: 'error',
        message: `API error rate (${(metrics.api.errorRate * 100).toFixed(2)}%) exceeds threshold (${this.config.errorRateThreshold * 100}%).`,
        timestamp: new Date().toISOString(),
        metrics: {
          errorRate: metrics.api.errorRate,
          threshold: this.config.errorRateThreshold
        }
      };
      
      triggeredAlerts.push(alert);
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
    if (memoryUsage > this.config.memoryUsageThreshold) {
      const alert = {
        type: 'memory_usage',
        severity: 'warning',
        message: `Memory usage (${(memoryUsage * 100).toFixed(2)}%) exceeds threshold (${this.config.memoryUsageThreshold * 100}%).`,
        timestamp: new Date().toISOString(),
        metrics: {
          memoryUsage: memoryUsage,
          threshold: this.config.memoryUsageThreshold
        }
      };
      
      triggeredAlerts.push(alert);
    }
    
    // Process triggered alerts
    for (const alert of triggeredAlerts) {
      await this.processAlert(alert);
    }
    
    return triggeredAlerts;
  }
  
  /**
   * Process an alert (log, send notifications, etc.)
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async processAlert(alert) {
    // Check if we should send this alert (cooldown period)
    if (!this.shouldSendAlert(alert.type)) {
      console.log(`Skipping alert ${alert.type} due to cooldown period.`);
      return;
    }
    
    // Add to alert history
    this.alertHistory.push(alert);
    
    // Update last alert time
    this.lastAlertTimes[alert.type] = Date.now();
    
    // Log alert
    if (this.config.enableLogAlerts) {
      await this.logAlert(alert);
    }
    
    // Send email notification
    if (this.config.enableEmailAlerts) {
      await this.sendEmailAlert(alert);
    }
    
    console.log(`Performance alert triggered: ${alert.message}`);
  }
  
  /**
   * Check if an alert should be sent based on cooldown period
   * @param {String} alertType - Type of alert
   * @returns {Boolean} Whether alert should be sent
   */
  shouldSendAlert(alertType) {
    const lastAlertTime = this.lastAlertTimes[alertType];
    if (!lastAlertTime) return true;
    
    return (Date.now() - lastAlertTime) > this.config.alertCooldown;
  }
  
  /**
   * Log an alert to file
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async logAlert(alert) {
    const logEntry = {
      timestamp: alert.timestamp,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metrics: alert.metrics
    };
    
    const logPath = path.join(__dirname, '..', '..', 'logs', 'alerts.log');
    
    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      
      // Append to log file
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }
  
  /**
   * Send email alert
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async sendEmailAlert(alert) {
    try {
      const subject = `[Mietrecht Agent] Performance Alert - ${alert.type}`;
      
      const htmlBody = `
        <h2>Performance Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
        <h3>Metrics:</h3>
        <ul>
          ${Object.entries(alert.metrics).map(([key, value]) => 
            `<li>${key}: ${typeof value === 'number' ? value.toFixed(2) : value}</li>`
          ).join('')}
        </ul>
      `;
      
      await sendEmailNotification(this.config.adminEmail, subject, htmlBody);
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }
  
  /**
   * Get alert history
   * @param {Number} limit - Number of recent alerts to return
   * @returns {Array} Alert history
   */
  getAlertHistory(limit = 50) {
    // Return most recent alerts
    return this.alertHistory.slice(-limit).reverse();
  }
  
  /**
   * Clear alert history
   * @returns {void}
   */
  clearAlertHistory() {
    this.alertHistory = [];
  }
  
  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   * @returns {void}
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export class
module.exports = { PerformanceAlerting };
