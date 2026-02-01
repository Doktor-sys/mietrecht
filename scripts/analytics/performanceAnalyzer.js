/**
 * Performance Analysis Module
 * This module analyzes the performance of the Mietrecht Agent system.
 */

const { getMetrics } = require('../database/dao/dashboardMetricsDao.js');
const { getLogEntries, getLogStatistics } = require('../database/dao/systemLogDao.js');

/**
 * Analyze system performance metrics
 * @returns {Promise<Object>} Performance analysis results
 */
async function analyzeSystemPerformance() {
  try {
    // Get recent metrics
    const responseTimeMetrics = await getMetrics({
      metricName: 'avg_response_time',
      limit: 100
    });
    
    const cacheHitMetrics = await getMetrics({
      metricName: 'cache_hit_rate',
      limit: 100
    });
    
    const activeRequestsMetrics = await getMetrics({
      metricName: 'active_requests',
      limit: 100
    });
    
    // Calculate averages
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / responseTimeMetrics.length
      : 0;
      
    const avgCacheHitRate = cacheHitMetrics.length > 0
      ? cacheHitMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / cacheHitMetrics.length
      : 0;
      
    const maxActiveRequests = activeRequestsMetrics.length > 0
      ? Math.max(...activeRequestsMetrics.map(metric => metric.metric_value))
      : 0;
    
    return {
      avgResponseTime,
      avgCacheHitRate,
      maxActiveRequests,
      responseTimeHistory: responseTimeMetrics,
      cacheHitHistory: cacheHitMetrics,
      activeRequestsHistory: activeRequestsMetrics
    };
  } catch (error) {
    console.error('Error analyzing system performance:', error);
    throw error;
  }
}

/**
 * Analyze system logs for issues
 * @returns {Promise<Object>} Log analysis results
 */
async function analyzeSystemLogs() {
  try {
    // Get recent error logs
    const errorLogs = await getLogEntries({
      level: 'error',
      limit: 50
    });
    
    // Get recent warning logs
    const warningLogs = await getLogEntries({
      level: 'warning',
      limit: 50
    });
    
    // Get log statistics
    const logStats = await getLogStatistics();
    
    // Calculate error rate
    const totalLogs = Object.values(logStats).reduce((sum, count) => sum + count, 0);
    const errorRate = totalLogs > 0 ? (logStats.error || 0) / totalLogs : 0;
    
    return {
      errorLogs,
      warningLogs,
      logStatistics: logStats,
      errorRate,
      totalLogs
    };
  } catch (error) {
    console.error('Error analyzing system logs:', error);
    throw error;
  }
}

/**
 * Identify performance bottlenecks
 * @param {Object} performanceData - Performance analysis data
 * @param {Object} logData - Log analysis data
 * @returns {Object} Bottleneck analysis
 */
function identifyBottlenecks(performanceData, logData) {
  const bottlenecks = [];
  
  // Check for high response times
  if (performanceData.avgResponseTime > 2000) { // 2 seconds
    bottlenecks.push({
      type: 'performance',
      severity: 'high',
      description: 'High average response time detected',
      value: performanceData.avgResponseTime,
      threshold: 2000
    });
  }
  
  // Check for low cache hit rate
  if (performanceData.avgCacheHitRate < 0.5) { // 50%
    bottlenecks.push({
      type: 'performance',
      severity: 'medium',
      description: 'Low cache hit rate detected',
      value: performanceData.avgCacheHitRate,
      threshold: 0.5
    });
  }
  
  // Check for high error rate
  if (logData.errorRate > 0.05) { // 5%
    bottlenecks.push({
      type: 'stability',
      severity: 'high',
      description: 'High error rate detected',
      value: logData.errorRate,
      threshold: 0.05
    });
  }
  
  // Check for frequent errors
  if ((logData.logStatistics.error || 0) > 10) {
    bottlenecks.push({
      type: 'stability',
      severity: 'medium',
      description: 'Frequent errors detected',
      value: logData.logStatistics.error,
      threshold: 10
    });
  }
  
  return bottlenecks;
}

/**
 * Generate performance recommendations
 * @param {Array} bottlenecks - Identified bottlenecks
 * @returns {Array} Recommendations
 */
function generateRecommendations(bottlenecks) {
  const recommendations = [];
  
  bottlenecks.forEach(bottleneck => {
    switch (bottleneck.description) {
      case 'High average response time detected':
        recommendations.push({
          type: 'performance',
          priority: 'high',
          description: 'Consider optimizing database queries or implementing additional caching layers'
        });
        break;
        
      case 'Low cache hit rate detected':
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          description: 'Review caching strategy and increase cache size or adjust expiration policies'
        });
        break;
        
      case 'High error rate detected':
        recommendations.push({
          type: 'stability',
          priority: 'high',
          description: 'Investigate frequent errors and implement better error handling'
        });
        break;
        
      case 'Frequent errors detected':
        recommendations.push({
          type: 'maintenance',
          priority: 'medium',
          description: 'Review recent error logs and fix recurring issues'
        });
        break;
        
      default:
        recommendations.push({
          type: 'general',
          priority: 'low',
          description: 'Monitor system performance regularly'
        });
    }
  });
  
  return recommendations;
}

/**
 * Perform comprehensive performance analysis
 * @returns {Promise<Object>} Comprehensive performance analysis
 */
async function performPerformanceAnalysis() {
  try {
    console.log('Performing performance analysis...');
    
    // Get performance and log data
    const [performanceData, logData] = await Promise.all([
      analyzeSystemPerformance(),
      analyzeSystemLogs()
    ]);
    
    // Identify bottlenecks
    const bottlenecks = identifyBottlenecks(performanceData, logData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(bottlenecks);
    
    console.log('Performance analysis completed');
    
    return {
      performance: performanceData,
      logs: logData,
      bottlenecks,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing performance analysis:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  analyzeSystemPerformance,
  analyzeSystemLogs,
  identifyBottlenecks,
  generateRecommendations,
  performPerformanceAnalysis
};