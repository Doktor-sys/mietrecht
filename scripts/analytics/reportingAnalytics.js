/**
 * Reporting and Analytics Module
 * This module provides reporting and analytics functionality for the Mietrecht Agent.
 */

const { getMetrics, getMetricStatistics } = require('../database/dao/dashboardMetricsDao.js');
const { getInteractionStatsByLawyerId, getTopicInterestsByLawyerId } = require('../database/dao/userInteractionDao.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');
const { getAllDataSourceStatuses } = require('../database/dao/dataSourceStatusDao.js');

/**
 * Generate system performance report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Performance report
 */
async function generatePerformanceReport(options = {}) {
  try {
    // Get performance metrics
    const metrics = await getMetrics({
      startDate: options.startDate,
      endDate: options.endDate,
      limit: 1000
    });
    
    // Group metrics by name
    const groupedMetrics = {};
    metrics.forEach(metric => {
      if (!groupedMetrics[metric.metric_name]) {
        groupedMetrics[metric.metric_name] = [];
      }
      groupedMetrics[metric.metric_name].push(metric);
    });
    
    // Calculate statistics for each metric
    const metricStats = {};
    for (const [metricName, metricValues] of Object.entries(groupedMetrics)) {
      const values = metricValues.map(m => m.metric_value);
      metricStats[metricName] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: values.length,
        latest: values[0]
      };
    }
    
    return {
      type: 'performance',
      generatedAt: new Date().toISOString(),
      period: {
        start: options.startDate,
        end: options.endDate
      },
      metrics: metricStats,
      totalMetrics: metrics.length
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    throw error;
  }
}

/**
 * Generate lawyer engagement report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Engagement report
 */
async function generateEngagementReport(options = {}) {
  try {
    // Get all lawyers
    const lawyers = await getAllLawyers();
    
    // Get engagement data for each lawyer
    const lawyerReports = [];
    for (const lawyer of lawyers) {
      // Get interaction statistics
      const interactionStats = await getInteractionStatsByLawyerId(lawyer.id);
      
      // Get topic interests
      const topicInterests = await getTopicInterestsByLawyerId(lawyer.id);
      
      // Calculate engagement score (simple calculation based on interactions)
      const totalInteractions = interactionStats.reduce((sum, stat) => sum + stat.count, 0);
      const engagementScore = Math.min(totalInteractions / 10, 10); // Scale to 0-10
      
      lawyerReports.push({
        lawyerId: lawyer.id,
        lawyerName: lawyer.name,
        lawFirm: lawyer.law_firm,
        totalInteractions,
        interactionStats,
        topTopics: topicInterests.slice(0, 5),
        engagementScore: parseFloat(engagementScore.toFixed(2))
      });
    }
    
    // Sort by engagement score
    lawyerReports.sort((a, b) => b.engagementScore - a.engagementScore);
    
    return {
      type: 'engagement',
      generatedAt: new Date().toISOString(),
      period: {
        start: options.startDate,
        end: options.endDate
      },
      lawyers: lawyerReports,
      totalLawyers: lawyers.length
    };
  } catch (error) {
    console.error('Error generating engagement report:', error);
    throw error;
  }
}

/**
 * Generate data source report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Data source report
 */
async function generateDataSourceReport(options = {}) {
  try {
    // Get all data source statuses
    const dataSources = await getAllDataSourceStatuses();
    
    // Calculate statistics
    const statusCounts = {};
    dataSources.forEach(source => {
      statusCounts[source.status] = (statusCounts[source.status] || 0) + 1;
    });
    
    return {
      type: 'dataSources',
      generatedAt: new Date().toISOString(),
      period: {
        start: options.startDate,
        end: options.endDate
      },
      sources: dataSources,
      statusSummary: statusCounts,
      totalSources: dataSources.length
    };
  } catch (error) {
    console.error('Error generating data source report:', error);
    throw error;
  }
}

/**
 * Generate comprehensive analytics report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Comprehensive report
 */
async function generateComprehensiveReport(options = {}) {
  try {
    // Generate individual reports
    const performanceReport = await generatePerformanceReport(options);
    const engagementReport = await generateEngagementReport(options);
    const dataSourceReport = await generateDataSourceReport(options);
    
    return {
      type: 'comprehensive',
      generatedAt: new Date().toISOString(),
      period: {
        start: options.startDate,
        end: options.endDate
      },
      performance: performanceReport,
      engagement: engagementReport,
      dataSources: dataSourceReport
    };
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    throw error;
  }
}

/**
 * Get lawyer-specific analytics
 * @param {number} lawyerId - Lawyer ID
 * @param {Object} options - Options
 * @returns {Promise<Object>} Lawyer analytics
 */
async function getLawyerAnalytics(lawyerId, options = {}) {
  try {
    // Get interaction statistics
    const interactionStats = await getInteractionStatsByLawyerId(lawyerId);
    
    // Get topic interests
    const topicInterests = await getTopicInterestsByLawyerId(lawyerId);
    
    // Get performance metrics for this lawyer (if any)
    // Note: This would require extending the metrics system to track per-lawyer metrics
    
    return {
      lawyerId,
      generatedAt: new Date().toISOString(),
      interactionStats,
      topTopics: topicInterests.slice(0, 10),
      totalInteractions: interactionStats.reduce((sum, stat) => sum + (stat.count || 0), 0)
    };
  } catch (error) {
    console.error(`Error getting analytics for lawyer ${lawyerId}:`, error);
    throw error;
  }
}

/**
 * Generate CSV report
 * @param {Object} reportData - Report data
 * @returns {string} CSV formatted report
 */
function generateCSVReport(reportData) {
  if (reportData.type === 'engagement' && reportData.lawyers) {
    // Generate CSV for engagement report
    let csv = 'Lawyer ID,Name,Law Firm,Total Interactions,Engagement Score\n';
    
    reportData.lawyers.forEach(lawyer => {
      csv += `"${lawyer.lawyerId}","${lawyer.lawyerName}","${lawyer.lawFirm}",${lawyer.totalInteractions},${lawyer.engagementScore}\n`;
    });
    
    return csv;
  } else if (reportData.type === 'performance' && reportData.metrics) {
    // Generate CSV for performance report
    let csv = 'Metric Name,Min,Max,Average,Count,Latest\n';
    
    Object.entries(reportData.metrics).forEach(([name, stats]) => {
      csv += `"${name}",${stats.min},${stats.max},${stats.avg},${stats.count},${stats.latest}\n`;
    });
    
    return csv;
  }
  
  return 'CSV generation not supported for this report type';
}

// Export functions
module.exports = {
  generatePerformanceReport,
  generateEngagementReport,
  generateDataSourceReport,
  generateComprehensiveReport,
  getLawyerAnalytics,
  generateCSVReport
};