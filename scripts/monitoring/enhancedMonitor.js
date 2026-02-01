/**
 * Enhanced Monitoring Module for Mietrecht Agent
 * This module provides advanced monitoring capabilities including external service integration.
 */

const { createLogEntry } = require('../database/dao/systemLogDao.js');

/**
 * Enhanced Monitor
 */
class EnhancedMonitor {
  constructor() {
    this.metrics = {
      executionTimes: [],
      apiCalls: {},
      emailSends: { success: 0, failure: 0 },
      memoryUsage: [],
      errors: [],
      warnings: []
    };
    this.startTime = null;
    this.startMemory = null;
    this.isMonitoring = false;
    
    // Configuration
    this.config = {
      logToDatabase: process.env.LOG_TO_DATABASE !== 'false',
      logToConsole: process.env.LOG_TO_CONSOLE !== 'false',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logFilePath: process.env.LOG_FILE_PATH || './logs/mietrecht-agent.log',
      enableExternalMonitoring: process.env.ENABLE_EXTERNAL_MONITORING === 'true',
      externalMonitoringEndpoint: process.env.EXTERNAL_MONITORING_ENDPOINT || null
    };
  }

  /**
   * Start monitoring
   */
  start() {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
    this.isMonitoring = true;
    
    // Start periodic memory logging
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000); // Every 30 seconds
    
    this.log('info', 'Enhanced monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    this.isMonitoring = false;
    this.log('info', 'Enhanced monitoring stopped');
  }

  /**
   * Log a message
   * @param {string} level - Log level (info, warning, error, debug)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      metadata
    };
    
    // Log to console
    if (this.config.logToConsole) {
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      switch (level) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warning':
          console.warn(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    }
    
    // Log to database
    if (this.config.logToDatabase) {
      try {
        await createLogEntry(level, `${message} ${JSON.stringify(metadata)}`);
      } catch (error) {
        // If database logging fails, log to console as fallback
        console.error(`Failed to log to database: ${error.message}`);
      }
    }
    
    // Log to file
    if (this.config.logToFile) {
      try {
        const fs = require('fs');
        const logLine = `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(metadata)}\n`;
        fs.appendFileSync(this.config.logFilePath, logLine);
      } catch (error) {
        console.error(`Failed to log to file: ${error.message}`);
      }
    }
    
    // Store in memory for metrics
    if (level === 'error') {
      this.metrics.errors.push(logEntry);
      // Keep only last 100 errors
      if (this.metrics.errors.length > 100) {
        this.metrics.errors.shift();
      }
    } else if (level === 'warning') {
      this.metrics.warnings.push(logEntry);
      // Keep only last 100 warnings
      if (this.metrics.warnings.length > 100) {
        this.metrics.warnings.shift();
      }
    }
  }

  /**
   * Record API call
   * @param {String} dataSource - Data source name
   * @param {Number} duration - Call duration in milliseconds
   * @param {Boolean} success - Whether the call was successful
   * @param {Object} details - Additional details about the API call
   */
  recordApiCall(dataSource, duration, success, details = {}) {
    if (!this.metrics.apiCalls[dataSource]) {
      this.metrics.apiCalls[dataSource] = { 
        count: 0, 
        totalDuration: 0, 
        success: 0, 
        failure: 0,
        details: []
      };
    }
    
    this.metrics.apiCalls[dataSource].count++;
    this.metrics.apiCalls[dataSource].totalDuration += duration;
    
    if (success) {
      this.metrics.apiCalls[dataSource].success++;
    } else {
      this.metrics.apiCalls[dataSource].failure++;
    }
    
    // Store details for analysis
    this.metrics.apiCalls[dataSource].details.push({
      duration,
      success,
      timestamp: Date.now(),
      ...details
    });
    
    // Keep only last 50 details per data source
    if (this.metrics.apiCalls[dataSource].details.length > 50) {
      this.metrics.apiCalls[dataSource].details.shift();
    }
    
    // Log significant API issues
    if (!success) {
      this.log('warning', `API call failed for ${dataSource}`, {
        duration,
        details
      });
    }
  }

  /**
   * Record email send
   * @param {Boolean} success - Whether the email was sent successfully
   * @param {Number} duration - Send duration in milliseconds
   * @param {Object} details - Additional details about the email
   */
  recordEmailSend(success, duration, details = {}) {
    if (success) {
      this.metrics.emailSends.success++;
    } else {
      this.metrics.emailSends.failure++;
      this.log('error', 'Email send failed', {
        duration,
        ...details
      });
    }
  }

  /**
   * Record execution time for a function
   * @param {String} functionName - Name of the function
   * @param {Number} duration - Execution duration in milliseconds
   * @param {Object} details - Additional details
   */
  recordExecutionTime(functionName, duration, details = {}) {
    this.metrics.executionTimes.push({
      function: functionName,
      duration: duration,
      timestamp: Date.now(),
      ...details
    });
    
    // Keep only the last 100 execution times
    if (this.metrics.executionTimes.length > 100) {
      this.metrics.executionTimes.shift();
    }
    
    // Log slow executions
    if (duration > 5000) { // More than 5 seconds
      this.log('warning', `Slow execution detected`, {
        function: functionName,
        duration,
        ...details
      });
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    const memory = process.memoryUsage();
    this.metrics.memoryUsage.push({
      rss: Math.round(memory.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
      external: Math.round(memory.external / 1024 / 1024), // MB
      timestamp: Date.now()
    });
    
    // Keep only the last 50 memory readings
    if (this.metrics.memoryUsage.length > 50) {
      this.metrics.memoryUsage.shift();
    }
    
    // Log high memory usage
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    if (heapUsedMB > 200) { // More than 200 MB
      this.log('warning', `High memory usage detected`, {
        heapUsed: heapUsedMB,
        rss: Math.round(memory.rss / 1024 / 1024)
      });
    }
  }

  /**
   * Record an error
   * @param {Error} error - Error object
   * @param {String} context - Context where error occurred
   */
  recordError(error, context = '') {
    this.log('error', `Error in ${context}: ${error.message}`, {
      stack: error.stack,
      context
    });
  }

  /**
   * End monitoring and generate report
   * @param {Object} results - Execution results
   * @returns {Object} Performance report
   */
  end(results) {
    if (!this.startTime) {
      throw new Error('Performance monitoring was not started');
    }
    
    this.stop();
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const duration = endTime - this.startTime;
    const memoryUsed = {
      rss: endMemory.rss - this.startMemory.rss,
      heapUsed: endMemory.heapUsed - this.startMemory.heapUsed
    };
    
    return this.generateReport(duration, memoryUsed, results);
  }

  /**
   * Generate performance report
   * @param {Number} duration - Total execution duration
   * @param {Object} memoryUsed - Memory usage difference
   * @param {Object} results - Execution results
   * @returns {Object} Performance report
   */
  generateReport(duration, memoryUsed, results) {
    // Calculate API call statistics
    const apiStats = {};
    for (const [source, stats] of Object.entries(this.metrics.apiCalls)) {
      const successRate = stats.count > 0 ? (stats.success / stats.count) * 100 : 100;
      const averageDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0;
      
      apiStats[source] = {
        count: stats.count,
        totalDuration: stats.totalDuration,
        averageDuration: averageDuration,
        successRate: successRate,
        failures: stats.failure
      };
    }
    
    // Calculate function execution statistics
    const functionStats = {};
    const functionGroups = {};
    
    // Group execution times by function name
    this.metrics.executionTimes.forEach(item => {
      if (!functionGroups[item.function]) {
        functionGroups[item.function] = [];
      }
      functionGroups[item.function].push(item.duration);
    });
    
    // Calculate statistics for each function
    for (const [funcName, durations] of Object.entries(functionGroups)) {
      const total = durations.reduce((sum, dur) => sum + dur, 0);
      const average = durations.length > 0 ? total / durations.length : 0;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      functionStats[funcName] = {
        count: durations.length,
        totalDuration: total,
        averageDuration: average,
        minDuration: min,
        maxDuration: max
      };
    }
    
    // Email statistics
    const totalEmails = this.metrics.emailSends.success + this.metrics.emailSends.failure;
    const emailSuccessRate = totalEmails > 0 ? 
      (this.metrics.emailSends.success / totalEmails) * 100 : 100;
    
    // Memory statistics
    const memoryStats = {
      peakHeapUsed: Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed), 0),
      averageHeapUsed: this.metrics.memoryUsage.length > 0 ? 
        this.metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memoryUsage.length : 0
    };
    
    return {
      timestamp: new Date().toISOString(),
      execution: {
        duration: duration,
        memoryUsed: memoryUsed,
        memoryStats: memoryStats
      },
      api: apiStats,
      email: {
        sent: this.metrics.emailSends.success,
        failed: this.metrics.emailSends.failure,
        successRate: emailSuccessRate
      },
      functions: functionStats,
      errors: {
        count: this.metrics.errors.length,
        warnings: this.metrics.warnings.length
      },
      results: results
    };
  }

  /**
   * Print performance report to console
   * @param {Object} report - Performance report
   */
  printReport(report) {
    console.log('\n=== Enhanced Mietrecht Agent Performance Report ===');
    console.log(`Execution Time: ${report.execution.duration}ms`);
    console.log(`Memory Used: RSS ${report.execution.memoryUsed.rss} bytes, Heap ${report.execution.memoryUsed.heapUsed} bytes`);
    console.log(`Peak Memory: ${report.execution.memoryStats.peakHeapUsed} MB`);
    
    console.log('\nAPI Calls:');
    for (const [source, stats] of Object.entries(report.api)) {
      console.log(`  ${source}: ${stats.count} calls, avg ${stats.averageDuration.toFixed(2)}ms, ${stats.successRate.toFixed(2)}% success, ${stats.failures} failures`);
    }
    
    console.log(`\nEmails: ${report.email.sent} sent, ${report.email.failed} failed, ${report.email.successRate.toFixed(2)}% success rate`);
    
    console.log('\nFunction Performance:');
    for (const [funcName, stats] of Object.entries(report.functions)) {
      console.log(`  ${funcName}: ${stats.count} calls, avg ${stats.averageDuration.toFixed(2)}ms, min ${stats.minDuration}ms, max ${stats.maxDuration}ms`);
    }
    
    console.log(`\nIssues: ${report.errors.count} errors, ${report.errors.warnings} warnings`);
    
    if (report.results) {
      console.log('\nExecution Results:');
      for (const [key, value] of Object.entries(report.results)) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    console.log('==================================================\n');
  }

  /**
   * Send metrics to external monitoring service
   * @param {Object} report - Performance report
   */
  async sendToExternalMonitoring(report) {
    if (!this.config.enableExternalMonitoring || !this.config.externalMonitoringEndpoint) {
      return;
    }
    
    try {
      const axios = require('axios');
      await axios.post(this.config.externalMonitoringEndpoint, {
        service: 'mietrecht-agent',
        timestamp: report.timestamp,
        metrics: report
      }, {
        timeout: 5000
      });
    } catch (error) {
      this.log('error', 'Failed to send metrics to external monitoring service', {
        error: error.message
      });
    }
  }
}

// Export the monitor
module.exports = { EnhancedMonitor };