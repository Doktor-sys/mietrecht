/**
 * Advanced Performance Monitoring Module
 * This module provides comprehensive performance monitoring capabilities for the Mietrecht Agent.
 */

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Import database modules
const { initializeDatabase, closeDatabase } = require('../database/connection.js');
const { getCourtDecisionsCount, getUnprocessedCourtDecisionsCount } = require('../database/dao/courtDecisionDao.js');
const { getLawyersCount } = require('../database/dao/lawyerDao.js');

// Import data source modules
const { getCacheSize } = require('../mietrecht_data_sources.js');

// Import performance modules
const { measureExecutionTime } = require('./benchmark.js');

// Configuration
const MONITORING_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'performance_monitoring.log');
const METRICS_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'metrics.log');

/**
 * Performance metrics collector
 */
class PerformanceMetricsCollector {
  constructor() {
    this.metrics = {
      system: {},
      database: {},
      application: {},
      api: {},
      cache: {}
    };
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system = {
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user / 1000, // microseconds to milliseconds
        system: cpuUsage.system / 1000 // microseconds to milliseconds
      },
      uptime: Math.round(process.uptime()) // seconds
    };
    
    return this.metrics.system;
  }
  
  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      await initializeDatabase();
      
      this.metrics.database = {
        timestamp: new Date().toISOString(),
        decisions: {
          total: await getCourtDecisionsCount(),
          unprocessed: await getUnprocessedCourtDecisionsCount()
        },
        lawyers: await getLawyersCount()
      };
      
      await closeDatabase();
    } catch (error) {
      console.error('Error collecting database metrics:', error);
      this.metrics.database = {
        error: error.message
      };
    }
    
    return this.metrics.database;
  }
  
  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    this.metrics.application = {
      timestamp: new Date().toISOString(),
      cache: {
        size: getCacheSize()
      }
    };
    
    return this.metrics.application;
  }
  
  /**
   * Collect API metrics
   */
  collectApiMetrics() {
    // In a real implementation, this would collect metrics from API calls
    // For now, we'll simulate some data
    this.metrics.api = {
      timestamp: new Date().toISOString(),
      bgbRequests: Math.floor(Math.random() * 100),
      landgerichtRequests: Math.floor(Math.random() * 50),
      bverfgRequests: Math.floor(Math.random() * 30),
      beckOnlineRequests: Math.floor(Math.random() * 20),
      averageResponseTime: Math.random() * 500 // ms
    };
    
    return this.metrics.api;
  }
  
  /**
   * Collect all metrics
   */
  async collectAllMetrics() {
    this.collectSystemMetrics();
    await this.collectDatabaseMetrics();
    this.collectApplicationMetrics();
    this.collectApiMetrics();
    
    return this.metrics;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics;
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      system: {},
      database: {},
      application: {},
      api: {},
      cache: {}
    };
  }
}

/**
 * Performance monitor
 */
class PerformanceMonitor {
  constructor() {
    this.metricsCollector = new PerformanceMetricsCollector();
    this.alerts = [];
    this.monitoringInterval = null;
  }
  
  /**
   * Log metrics to file
   */
  async logMetrics(metrics) {
    try {
      const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(metrics)}\n`;
      
      // Ensure logs directory exists
      const logsDir = path.dirname(METRICS_LOG_PATH);
      try {
        await fs.access(logsDir);
      } catch {
        await fs.mkdir(logsDir, { recursive: true });
      }
      
      // Append to log file
      await fs.appendFile(METRICS_LOG_PATH, logEntry);
    } catch (error) {
      console.error('Error logging metrics:', error);
    }
  }
  
  /**
   * Check for performance alerts
   */
  checkForAlerts(metrics) {
    const newAlerts = [];
    
    // Check memory usage
    if (metrics.system.memory.heapUsed > 500) { // 500 MB
      newAlerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `High memory usage: ${metrics.system.memory.heapUsed} MB`,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check cache size
    if (metrics.application.cache.size > 1000) {
      newAlerts.push({
        type: 'LARGE_CACHE_SIZE',
        message: `Large cache size: ${metrics.application.cache.size} items`,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check unprocessed decisions
    if (metrics.database.decisions && metrics.database.decisions.unprocessed > 100) {
      newAlerts.push({
        type: 'MANY_UNPROCESSED_DECISIONS',
        message: `Many unprocessed decisions: ${metrics.database.decisions.unprocessed}`,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check API response times
    if (metrics.api.averageResponseTime > 1000) { // 1 second
      newAlerts.push({
        type: 'SLOW_API_RESPONSE',
        message: `Slow API response time: ${metrics.api.averageResponseTime.toFixed(2)} ms`,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add new alerts to the list
    this.alerts.push(...newAlerts);
    
    return newAlerts;
  }
  
  /**
   * Log alerts to file
   */
  async logAlerts(alerts) {
    if (alerts.length === 0) return;
    
    try {
      const logEntries = alerts.map(alert => 
        `[${alert.timestamp}] [${alert.severity}] ${alert.type}: ${alert.message}\n`
      ).join('');
      
      // Ensure logs directory exists
      const logsDir = path.dirname(MONITORING_LOG_PATH);
      try {
        await fs.access(logsDir);
      } catch {
        await fs.mkdir(logsDir, { recursive: true });
      }
      
      // Append to log file
      await fs.appendFile(MONITORING_LOG_PATH, logEntries);
    } catch (error) {
      console.error('Error logging alerts:', error);
    }
  }
  
  /**
   * Perform a monitoring cycle
   */
  async performMonitoringCycle() {
    try {
      // Collect metrics
      const metrics = await this.metricsCollector.collectAllMetrics();
      
      // Log metrics
      await this.logMetrics(metrics);
      
      // Check for alerts
      const alerts = this.checkForAlerts(metrics);
      
      // Log alerts
      await this.logAlerts(alerts);
      
      // Print summary to console
      console.log(`Monitoring cycle completed:`);
      console.log(`  Memory usage: ${metrics.system.memory.heapUsed} MB`);
      console.log(`  Cache size: ${metrics.application.cache.size} items`);
      console.log(`  Total decisions: ${metrics.database.decisions?.total || 'N/A'}`);
      console.log(`  Unprocessed decisions: ${metrics.database.decisions?.unprocessed || 'N/A'}`);
      console.log(`  Lawyers: ${metrics.database.lawyers || 'N/A'}`);
      console.log(`  API response time: ${metrics.api.averageResponseTime.toFixed(2)} ms`);
      
      if (alerts.length > 0) {
        console.log(`  Alerts: ${alerts.length}`);
        alerts.forEach(alert => {
          console.log(`    ${alert.severity}: ${alert.message}`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }
  
  /**
   * Start continuous monitoring
   */
  startMonitoring(interval = 60000) { // Default: 1 minute
    console.log(`Starting performance monitoring (interval: ${interval / 1000} seconds)...`);
    console.log('');
    
    // Perform initial monitoring cycle
    this.performMonitoringCycle();
    
    // Set up interval for continuous monitoring
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, interval);
  }
  
  /**
   * Stop continuous monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Performance monitoring stopped.');
    }
  }
  
  /**
   * Get current alerts
   */
  getAlerts() {
    return this.alerts;
  }
  
  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
  }
  
  /**
   * Get metrics collector
   */
  getMetricsCollector() {
    return this.metricsCollector;
  }
}

// Export classes and functions
module.exports = {
  PerformanceMetricsCollector,
  PerformanceMonitor
};