/**
 * Performance Monitoring Script
 * This script continuously monitors the performance of the Mietrecht Agent.
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
const MONITORING_INTERVAL = 60000; // 1 minute
const LOG_FILE_PATH = path.join(__dirname, '..', '..', 'logs', 'performance_monitoring.log');

/**
 * Log monitoring data to file
 * @param {Object} data - Monitoring data to log
 */
async function logMonitoringData(data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;
    
    // Ensure logs directory exists
    const logsDir = path.dirname(LOG_FILE_PATH);
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
    }
    
    // Append to log file
    await fs.appendFile(LOG_FILE_PATH, logEntry);
  } catch (error) {
    console.error('Error logging monitoring data:', error);
  }
}

/**
 * Collect system metrics
 * @returns {Object} System metrics
 */
function collectSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
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
}

/**
 * Collect database metrics
 * @returns {Promise<Object>} Database metrics
 */
async function collectDatabaseMetrics() {
  try {
    await initializeDatabase();
    
    const decisionsCount = await getCourtDecisionsCount();
    const unprocessedCount = await getUnprocessedCourtDecisionsCount();
    const lawyersCount = await getLawyersCount();
    
    await closeDatabase();
    
    return {
      decisions: {
        total: decisionsCount,
        unprocessed: unprocessedCount
      },
      lawyers: lawyersCount
    };
  } catch (error) {
    console.error('Error collecting database metrics:', error);
    return {
      error: error.message
    };
  }
}

/**
 * Collect application metrics
 * @returns {Object} Application metrics
 */
function collectApplicationMetrics() {
  return {
    cache: {
      size: getCacheSize()
    }
  };
}

/**
 * Collect all metrics
 * @returns {Promise<Object>} All metrics
 */
async function collectAllMetrics() {
  const systemMetrics = collectSystemMetrics();
  const databaseMetrics = await collectDatabaseMetrics();
  const applicationMetrics = collectApplicationMetrics();
  
  return {
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    database: databaseMetrics,
    application: applicationMetrics
  };
}

/**
 * Check for performance alerts
 * @param {Object} metrics - Metrics to check
 * @returns {Array} Array of alert messages
 */
function checkForAlerts(metrics) {
  const alerts = [];
  
  // Check memory usage
  if (metrics.system.memory.heapUsed > 500) { // 500 MB
    alerts.push(`High memory usage: ${metrics.system.memory.heapUsed} MB`);
  }
  
  // Check cache size
  if (metrics.application.cache.size > 1000) {
    alerts.push(`Large cache size: ${metrics.application.cache.size} items`);
  }
  
  // Check unprocessed decisions
  if (metrics.database.decisions && metrics.database.decisions.unprocessed > 100) {
    alerts.push(`Many unprocessed decisions: ${metrics.database.decisions.unprocessed}`);
  }
  
  return alerts;
}

/**
 * Perform a monitoring cycle
 */
async function performMonitoringCycle() {
  try {
    console.log('Performing monitoring cycle...');
    
    // Collect metrics
    const metrics = await collectAllMetrics();
    
    // Check for alerts
    const alerts = checkForAlerts(metrics);
    
    // Add alerts to metrics
    metrics.alerts = alerts;
    
    // Log metrics
    await logMonitoringData(metrics);
    
    // Print summary to console
    console.log(`Monitoring cycle completed:`);
    console.log(`  Memory usage: ${metrics.system.memory.heapUsed} MB`);
    console.log(`  Cache size: ${metrics.application.cache.size} items`);
    console.log(`  Total decisions: ${metrics.database.decisions?.total || 'N/A'}`);
    console.log(`  Unprocessed decisions: ${metrics.database.decisions?.unprocessed || 'N/A'}`);
    console.log(`  Lawyers: ${metrics.database.lawyers || 'N/A'}`);
    
    if (alerts.length > 0) {
      console.log(`  Alerts: ${alerts.join(', ')}`);
    }
    
    console.log('');
  } catch (error) {
    console.error('Error in monitoring cycle:', error);
  }
}

/**
 * Start continuous monitoring
 */
function startMonitoring() {
  console.log(`Starting performance monitoring (interval: ${MONITORING_INTERVAL / 1000} seconds)...`);
  console.log('');
  
  // Perform initial monitoring cycle
  performMonitoringCycle();
  
  // Set up interval for continuous monitoring
  setInterval(performMonitoringCycle, MONITORING_INTERVAL);
}

/**
 * Run monitoring for a specific duration
 * @param {number} duration - Duration in milliseconds
 */
async function runMonitoringForDuration(duration) {
  console.log(`Running monitoring for ${duration / 1000} seconds...`);
  
  const endTime = Date.now() + duration;
  
  while (Date.now() < endTime) {
    await performMonitoringCycle();
    await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
  }
  
  console.log('Monitoring duration completed.');
}

// Start monitoring if script is executed directly
if (require.main === module) {
  // Check if a duration was specified
  const durationArg = process.argv[2];
  
  if (durationArg) {
    const duration = parseInt(durationArg) * 1000; // Convert seconds to milliseconds
    runMonitoringForDuration(duration)
      .then(() => {
        console.log('Monitoring script finished.');
        process.exit(0);
      })
      .catch(error => {
        console.error('Error running monitoring script:', error);
        process.exit(1);
      });
  } else {
    startMonitoring();
  }
}

// Export functions for use in other modules
module.exports = {
  logMonitoringData,
  collectSystemMetrics,
  collectDatabaseMetrics,
  collectApplicationMetrics,
  collectAllMetrics,
  checkForAlerts,
  performMonitoringCycle,
  startMonitoring,
  runMonitoringForDuration
};