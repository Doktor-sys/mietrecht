/**
 * Mietrecht Agent Performance Monitoring Module
 * This module provides specialized performance monitoring for the Mietrecht Agent.
 */

// Import required modules
const { PerformanceMonitor } = require('./advancedMonitor.js');
const { getConfigValue } = require('../config_manager.js');
const { createLogEntry } = require('../database/dao/systemLogDao.js');

/**
 * Mietrecht Agent Performance Monitor
 */
class MietrechtAgentPerformanceMonitor {
  constructor() {
    this.baseMonitor = new PerformanceMonitor();
    this.executionTimes = [];
    this.apiCallCounts = {
      bgh: 0,
      landgerichte: 0,
      bverfg: 0,
      beckOnline: 0
    };
    this.emailSendCounts = {
      success: 0,
      failure: 0
    };
  }

  /**
   * Start monitoring the Mietrecht Agent execution
   * @param {Object} options - Monitoring options
   */
  async startAgentExecution(options = {}) {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
    
    // Log start of execution
    await createLogEntry('info', 'Mietrecht Agent execution started');
    
    // Start base monitoring if enabled
    const perfConfig = getConfigValue(this.baseMonitor.metricsCollector.getMetrics(), 'performance') || {};
    if (perfConfig.enabled !== false) {
      await this.baseMonitor.startMonitoring({
        interval: perfConfig.monitoringInterval || 60000
      });
    }
  }

  /**
   * Record API call metrics
   * @param {String} dataSource - Data source name (bgh, landgerichte, etc.)
   * @param {Number} duration - Call duration in milliseconds
   * @param {Boolean} success - Whether the call was successful
   */
  recordApiCall(dataSource, duration, success) {
    if (this.apiCallCounts[dataSource] !== undefined) {
      this.apiCallCounts[dataSource]++;
      
      // Log API call
      createLogEntry('info', `API call to ${dataSource}: ${success ? 'SUCCESS' : 'FAILURE'} (${duration}ms)`);
    }
  }

  /**
   * Record email sending metrics
   * @param {Boolean} success - Whether the email was sent successfully
   * @param {Number} duration - Send duration in milliseconds
   */
  recordEmailSend(success, duration) {
    if (success) {
      this.emailSendCounts.success++;
    } else {
      this.emailSendCounts.failure++;
    }
    
    // Log email send
    createLogEntry('info', `Email send: ${success ? 'SUCCESS' : 'FAILURE'} (${duration}ms)`);
  }

  /**
   * Record execution time for a function
   * @param {String} functionName - Name of the function
   * @param {Number} duration - Execution duration in milliseconds
   */
  recordExecutionTime(functionName, duration) {
    this.executionTimes.push({
      function: functionName,
      duration: duration,
      timestamp: Date.now()
    });
    
    // Keep only the last 100 execution times
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift();
    }
    
    // Log execution time
    createLogEntry('info', `Function ${functionName} executed in ${duration}ms`);
  }

  /**
   * End monitoring the Mietrecht Agent execution
   * @param {Object} results - Execution results
   */
  async endAgentExecution(results) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const duration = endTime - this.startTime;
    const memoryUsed = {
      rss: endMemory.rss - this.startMemory.rss,
      heapUsed: endMemory.heapUsed - this.startMemory.heapUsed
    };
    
    // Collect final metrics
    const metrics = await this.baseMonitor.metricsCollector.collectAllMetrics();
    
    // Log end of execution
    await createLogEntry('info', `Mietrecht Agent execution completed in ${duration}ms`);
    
    // Stop base monitoring
    await this.baseMonitor.stopMonitoring();
    
    // Return performance report
    return {
      duration,
      memoryUsed,
      apiCalls: { ...this.apiCallCounts },
      emails: { ...this.emailSendCounts },
      executionTimes: [...this.executionTimes],
      systemMetrics: metrics,
      results
    };
  }

  /**
   * Generate performance report
   * @param {Object} executionData - Data from endAgentExecution
   * @returns {Object} Performance report
   */
  generatePerformanceReport(executionData) {
    const avgExecutionTime = this.executionTimes.length > 0 
      ? this.executionTimes.reduce((sum, item) => sum + item.duration, 0) / this.executionTimes.length
      : 0;
      
    const successRate = executionData.emails.success + executionData.emails.failure > 0
      ? (executionData.emails.success / (executionData.emails.success + executionData.emails.failure)) * 100
      : 100;
      
    const totalApiCalls = Object.values(executionData.apiCalls).reduce((sum, count) => sum + count, 0);
    
    return {
      timestamp: new Date().toISOString(),
      execution: {
        duration: executionData.duration,
        memoryUsed: executionData.memoryUsed
      },
      api: {
        totalCalls: totalApiCalls,
        breakdown: executionData.apiCalls,
        successRate: totalApiCalls > 0 ? 
          (Object.values(executionData.apiCalls).reduce((sum, count) => sum + count, 0) / totalApiCalls) * 100 : 
          100
      },
      email: {
        sent: executionData.emails.success,
        failed: executionData.emails.failure,
        successRate: successRate
      },
      performance: {
        avgFunctionExecutionTime: avgExecutionTime,
        slowestFunctions: this.executionTimes
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
      },
      system: executionData.systemMetrics
    };
  }

  /**
   * Log performance metrics
   * @param {Object} report - Performance report
   */
  async logPerformanceMetrics(report) {
    await createLogEntry('info', `PERFORMANCE REPORT: Duration=${report.execution.duration}ms, Memory RSS=${report.execution.memoryUsed.rss}bytes, API Calls=${report.api.totalCalls}, Emails Sent=${report.email.sent}, Success Rate=${report.email.successRate.toFixed(2)}%`);
  }
}

// Export the monitor
module.exports = { MietrechtAgentPerformanceMonitor };