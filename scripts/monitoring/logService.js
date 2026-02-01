/**
 * Logging Service Module
 * This module provides a centralized logging service for the Mietrecht Agent.
 */

const fs = require('fs');
const path = require('path');
const { createLogEntry } = require('../database/dao/systemLogDao.js');
const { getLogConfig, isLevelEnabled, formatLogMessage } = require('./logConfig.js');

/**
 * Logger class
 */
class Logger {
  constructor(serviceName = 'mietrecht-agent') {
    this.serviceName = serviceName;
    this.config = getLogConfig();
    
    // Ensure log directory exists
    if (this.config.file.enabled) {
      const logDir = path.dirname(this.config.file.path);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level (debug, info, warning, error)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async log(level, message, metadata = {}) {
    // Add service name to metadata
    const logMetadata = {
      service: this.serviceName,
      ...metadata
    };

    // Console logging
    if (isLevelEnabled(level, 'console')) {
      const formattedMessage = formatLogMessage(level, message, logMetadata, this.config.console.format);
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warning':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // File logging
    if (isLevelEnabled(level, 'file')) {
      try {
        const formattedMessage = formatLogMessage(level, message, logMetadata, 'simple') + '\n';
        fs.appendFileSync(this.config.file.path, formattedMessage);
      } catch (error) {
        // If file logging fails, log to console as fallback
        console.error(`Failed to log to file: ${error.message}`);
      }
    }

    // Database logging
    if (isLevelEnabled(level, 'database')) {
      try {
        await createLogEntry(level, `${message} ${JSON.stringify(logMetadata)}`);
      } catch (error) {
        // If database logging fails, log to console as fallback
        console.error(`Failed to log to database: ${error.message}`);
      }
    }

    // External logging
    if (isLevelEnabled(level, 'external') && this.config.external.endpoint) {
      try {
        await this.sendToExternalService(level, message, logMetadata);
      } catch (error) {
        console.error(`Failed to log to external service: ${error.message}`);
      }
    }
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async debug(message, metadata = {}) {
    await this.log('debug', message, metadata);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async info(message, metadata = {}) {
    await this.log('info', message, metadata);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async warn(message, metadata = {}) {
    await this.log('warning', message, metadata);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async error(message, metadata = {}) {
    await this.log('error', message, metadata);
  }

  /**
   * Send log to external service
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async sendToExternalService(level, message, metadata) {
    // This is a placeholder implementation
    // In a real implementation, you would send to services like:
    // - Loggly
    // - Papertrail
    // - AWS CloudWatch
    // - Google Cloud Logging
    // - Datadog
    // - etc.
    
    const axios = require('axios');
    
    const logData = {
      service: this.serviceName,
      level,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    // Add authentication if token is provided
    const headers = {};
    if (this.config.external.token) {
      headers['Authorization'] = `Bearer ${this.config.external.token}`;
    }
    
    await axios.post(this.config.external.endpoint, logData, {
      headers,
      timeout: 5000
    });
  }

  /**
   * Rotate log files based on size or age
   */
  rotateLogs() {
    if (!this.config.file.enabled) return;
    
    try {
      const stats = fs.statSync(this.config.file.path);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Check if file size exceeds maximum
      const maxSizeInMB = parseFloat(this.config.file.maxSize.replace('m', ''));
      if (fileSizeInMB > maxSizeInMB) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = `${this.config.file.path}.${timestamp}`;
        fs.renameSync(this.config.file.path, rotatedPath);
        
        // Remove old files based on maxFiles setting
        this.cleanupOldLogFiles();
      }
    } catch (error) {
      console.error(`Failed to rotate logs: ${error.message}`);
    }
  }

  /**
   * Clean up old log files
   */
  cleanupOldLogFiles() {
    if (!this.config.file.enabled) return;
    
    try {
      const logDir = path.dirname(this.config.file.path);
      const files = fs.readdirSync(logDir);
      const logFileName = path.basename(this.config.file.path);
      
      // Filter log files
      const logFiles = files.filter(file => 
        file.startsWith(logFileName) && file !== logFileName
      );
      
      // Sort by modification time
      logFiles.sort((a, b) => {
        const aStat = fs.statSync(path.join(logDir, a));
        const bStat = fs.statSync(path.join(logDir, b));
        return aStat.mtime - bStat.mtime;
      });
      
      // Remove old files based on maxFiles setting
      if (this.config.file.maxFiles.endsWith('d')) {
        // Keep logs for specified number of days
        const days = parseInt(this.config.file.maxFiles.replace('d', ''));
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        for (const file of logFiles) {
          const filePath = path.join(logDir, file);
          const stat = fs.statSync(filePath);
          if (stat.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
          }
        }
      } else if (this.config.file.maxFiles.endsWith('n')) {
        // Keep a specific number of files
        const maxFiles = parseInt(this.config.file.maxFiles.replace('n', ''));
        if (logFiles.length > maxFiles) {
          const filesToRemove = logFiles.slice(0, logFiles.length - maxFiles);
          for (const file of filesToRemove) {
            fs.unlinkSync(path.join(logDir, file));
          }
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup old log files: ${error.message}`);
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger();

// Export logger class and default instance
module.exports = {
  Logger,
  logger: defaultLogger,
  // Convenience methods that use the default logger
  debug: (message, metadata) => defaultLogger.debug(message, metadata),
  info: (message, metadata) => defaultLogger.info(message, metadata),
  warn: (message, metadata) => defaultLogger.warn(message, metadata),
  error: (message, metadata) => defaultLogger.error(message, metadata)
};