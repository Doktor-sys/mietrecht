/**
 * Simple Performance Monitoring Module for Mietrecht Agent
 * This module provides lightweight performance monitoring specifically for the Mietrecht Agent.
 */

/**
 * Simple Performance Monitor
 */
class SimplePerfMonitor {
  constructor() {
    this.metrics = {
      executionTimes: [],
      apiCalls: {},
      emailSends: { success: 0, failure: 0 },
      memoryUsage: []
    };
    this.startTime = null;
    this.startMemory = null;
  }

  /**
   * Start monitoring
   */
  start() {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
  }

  /**
   * Record API call
   * @param {String} dataSource - Data source name
   * @param {Number} duration - Call duration in milliseconds
   * @param {Boolean} success - Whether the call was successful
   */
  recordApiCall(dataSource, duration, success) {
    if (!this.metrics.apiCalls[dataSource]) {
      this.metrics.apiCalls[dataSource] = { count: 0, totalDuration: 0, success: 0, failure: 0 };
    }
    
    this.metrics.apiCalls[dataSource].count++;
    this.metrics.apiCalls[dataSource].totalDuration += duration;
    
    if (success) {
      this.metrics.apiCalls[dataSource].success++;
    } else {
      this.metrics.apiCalls[dataSource].failure++;
    }
  }

  /**
   * Record email send
   * @param {Boolean} success - Whether the email was sent successfully
   * @param {Number} duration - Send duration in milliseconds
   */
  recordEmailSend(success, duration) {
    if (success) {
      this.metrics.emailSends.success++;
    } else {
      this.metrics.emailSends.failure++;
    }
  }

  /**
   * Record execution time for a function
   * @param {String} functionName - Name of the function
   * @param {Number} duration - Execution duration in milliseconds
   */
  recordExecutionTime(functionName, duration) {
    this.metrics.executionTimes.push({
      function: functionName,
      duration: duration,
      timestamp: Date.now()
    });
    
    // Keep only the last 100 execution times
    if (this.metrics.executionTimes.length > 100) {
      this.metrics.executionTimes.shift();
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
      timestamp: Date.now()
    });
    
    // Keep only the last 50 memory readings
    if (this.metrics.memoryUsage.length > 50) {
      this.metrics.memoryUsage.shift();
    }
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
      apiStats[source] = {
        count: stats.count,
        totalDuration: stats.totalDuration,
        averageDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
        successRate: stats.count > 0 ? (stats.success / stats.count) * 100 : 100
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
    
    return {
      timestamp: new Date().toISOString(),
      execution: {
        duration: duration,
        memoryUsed: memoryUsed
      },
      api: apiStats,
      email: {
        sent: this.metrics.emailSends.success,
        failed: this.metrics.emailSends.failure,
        successRate: emailSuccessRate
      },
      functions: functionStats,
      results: results
    };
  }

  /**
   * Print performance report to console
   * @param {Object} report - Performance report
   */
  printReport(report) {
    console.log('\n=== Mietrecht Agent Performance Report ===');
    console.log(`Execution Time: ${report.execution.duration}ms`);
    console.log(`Memory Used: RSS ${report.execution.memoryUsed.rss} bytes, Heap ${report.execution.memoryUsed.heapUsed} bytes`);
    
    console.log('\nAPI Calls:');
    for (const [source, stats] of Object.entries(report.api)) {
      console.log(`  ${source}: ${stats.count} calls, avg ${stats.averageDuration.toFixed(2)}ms, ${stats.successRate.toFixed(2)}% success`);
    }
    
    console.log(`\nEmails: ${report.email.sent} sent, ${report.email.failed} failed, ${report.email.successRate.toFixed(2)}% success rate`);
    
    console.log('\nFunction Performance:');
    for (const [funcName, stats] of Object.entries(report.functions)) {
      console.log(`  ${funcName}: ${stats.count} calls, avg ${stats.averageDuration.toFixed(2)}ms, min ${stats.minDuration}ms, max ${stats.maxDuration}ms`);
    }
    
    if (report.results) {
      console.log('\nExecution Results:');
      for (const [key, value] of Object.entries(report.results)) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    console.log('========================================\n');
  }
}

// Export the monitor
module.exports = { SimplePerfMonitor };