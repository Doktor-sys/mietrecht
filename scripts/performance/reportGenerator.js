/**
 * Performance Report Generator
 * This module generates detailed performance reports for the Mietrecht Agent.
 */

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Import performance modules
const { PerformanceMetricsCollector } = require('./advancedMonitor.js');

/**
 * Performance Report Generator
 */
class PerformanceReportGenerator {
  /**
   * Constructor
   */
  constructor() {
    this.metricsCollector = new PerformanceMetricsCollector();
  }
  
  /**
   * Generate a comprehensive performance report
   * @returns {Promise<Object>} Performance report data
   */
  async generateComprehensiveReport() {
    console.log('Generating comprehensive performance report...');
    
    try {
      // Collect all metrics
      const metrics = await this.metricsCollector.collectAllMetrics();
      
      // Generate report sections
      const report = {
        timestamp: new Date().toISOString(),
        systemInfo: await this.generateSystemInfo(),
        performanceMetrics: metrics,
        recommendations: this.generateRecommendations(metrics),
        summary: this.generateSummary(metrics)
      };
      
      return report;
    } catch (error) {
      console.error('Error generating comprehensive performance report:', error);
      throw error;
    }
  }
  
  /**
   * Generate system information
   * @returns {Object} System information
   */
  async generateSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
  
  /**
   * Generate performance recommendations
   * @param {Object} metrics - Performance metrics
   * @returns {Array} Recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Check cache performance
    if (metrics.cache && metrics.cache.hitRate < 0.7) {
      recommendations.push({
        priority: 'high',
        message: 'Cache hit rate is below 70%. Consider adjusting cache size or TTL settings.',
        action: 'Review cache configuration in mietrecht_data_sources.js'
      });
    }
    
    // Check database performance
    if (metrics.database && metrics.database.avgQueryTime > 100) {
      recommendations.push({
        priority: 'medium',
        message: 'Average database query time exceeds 100ms. Consider adding more indexes.',
        action: 'Review database indexes and queries'
      });
    }
    
    // Check API performance
    if (metrics.api && metrics.api.avgResponseTime > 2000) {
      recommendations.push({
        priority: 'high',
        message: 'Average API response time exceeds 2 seconds. Check network connectivity or API provider status.',
        action: 'Review data source connections and rate limiting'
      });
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      recommendations.push({
        priority: 'medium',
        message: 'Memory usage exceeds 80%. Consider implementing more aggressive cache eviction.',
        action: 'Review cache size limits and data retention policies'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate performance summary
   * @param {Object} metrics - Performance metrics
   * @returns {Object} Summary
   */
  generateSummary(metrics) {
    return {
      overallHealth: this.calculateOverallHealth(metrics),
      keyMetrics: {
        cacheHitRate: metrics.cache ? metrics.cache.hitRate : null,
        avgDatabaseQueryTime: metrics.database ? metrics.database.avgQueryTime : null,
        avgApiResponseTime: metrics.api ? metrics.api.avgResponseTime : null,
        memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal
      }
    };
  }
  
  /**
   * Calculate overall health score
   * @param {Object} metrics - Performance metrics
   * @returns {String} Health status
   */
  calculateOverallHealth(metrics) {
    // Simple health calculation based on key metrics
    let score = 100;
    
    if (metrics.cache && metrics.cache.hitRate < 0.5) score -= 30;
    if (metrics.cache && metrics.cache.hitRate < 0.7) score -= 15;
    
    if (metrics.database && metrics.database.avgQueryTime > 200) score -= 20;
    if (metrics.database && metrics.database.avgQueryTime > 100) score -= 10;
    
    if (metrics.api && metrics.api.avgResponseTime > 5000) score -= 30;
    if (metrics.api && metrics.api.avgResponseTime > 2000) score -= 15;
    
    const memoryUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
    if (memoryUsage > 0.9) score -= 25;
    if (memoryUsage > 0.8) score -= 10;
    
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }
  
  /**
   * Save report to file
   * @param {Object} report - Report data
   * @param {String} filename - Output filename
   * @returns {Promise<void>}
   */
  async saveReportToFile(report, filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `performance-report-${timestamp}.json`;
    }
    
    const reportPath = path.join(__dirname, '..', '..', 'reports', filename);
    
    try {
      // Ensure reports directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      
      // Write report to file
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`Performance report saved to ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('Error saving performance report:', error);
      throw error;
    }
  }
  
  /**
   * Generate HTML report
   * @param {Object} report - Report data
   * @returns {Promise<String>} HTML report
   */
  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang=\"de\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Mietrecht Agent Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #2c3e50; }
        .metric-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 10px 0; }
        .recommendation { padding: 10px; margin: 10px 0; border-left: 4px solid; }
        .high { border-color: #e74c3c; background-color: #fdf2f2; }
        .medium { border-color: #f39c12; background-color: #fff9f2; }
        .good { color: #27ae60; }
        .fair { color: #f39c12; }
        .poor { color: #e67e22; }
        .critical { color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Mietrecht Agent Performance Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <div class=\"metric-card\">
        <h2>System Information</h2>
        <p>Node.js Version: ${report.systemInfo.nodeVersion}</p>
        <p>Platform: ${report.systemInfo.platform} (${report.systemInfo.arch})</p>
        <p>Uptime: ${Math.round(report.systemInfo.uptime / 60)} minutes</p>
    </div>
    
    <div class=\"metric-card\">
        <h2>Overall Health: <span class=\"${report.summary.overallHealth.toLowerCase()}\">${report.summary.overallHealth}</span></h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Cache Hit Rate</td>
                <td>${report.summary.keyMetrics.cacheHitRate !== null ? (report.summary.keyMetrics.cacheHitRate * 100).toFixed(2) + '%' : 'N/A'}</td>
            </tr>
            <tr>
                <td>Avg Database Query Time</td>
                <td>${report.summary.keyMetrics.avgDatabaseQueryTime !== null ? report.summary.keyMetrics.avgDatabaseQueryTime.toFixed(2) + 'ms' : 'N/A'}</td>
            </tr>
            <tr>
                <td>Avg API Response Time</td>
                <td>${report.summary.keyMetrics.avgApiResponseTime !== null ? report.summary.keyMetrics.avgApiResponseTime.toFixed(2) + 'ms' : 'N/A'}</td>
            </tr>
            <tr>
                <td>Memory Usage</td>
                <td>${(report.summary.keyMetrics.memoryUsage * 100).toFixed(2)}%</td>
            </tr>
        </table>
    </div>
    
    <div class=\"metric-card\">
        <h2>Performance Metrics</h2>
        <h3>Cache Performance</h3>
        ${report.performanceMetrics.cache ? `
        <p>Hits: ${report.performanceMetrics.cache.hits}</p>
        <p>Misses: ${report.performanceMetrics.cache.misses}</p>
        <p>Hit Rate: ${(report.performanceMetrics.cache.hitRate * 100).toFixed(2)}%</p>
        <p>Current Size: ${report.performanceMetrics.cache.currentSize}/${report.performanceMetrics.cache.maxSize}</p>
        ` : '<p>No cache metrics available</p>'}
        
        <h3>Database Performance</h3>
        ${report.performanceMetrics.database ? `
        <p>Total Queries: ${report.performanceMetrics.database.totalQueries}</p>
        <p>Average Query Time: ${report.performanceMetrics.database.avgQueryTime.toFixed(2)}ms</p>
        <p>Slowest Query: ${report.performanceMetrics.database.slowestQueryTime.toFixed(2)}ms</p>
        ` : '<p>No database metrics available</p>'}
        
        <h3>API Performance</h3>
        ${report.performanceMetrics.api ? `
        <p>Total Requests: ${report.performanceMetrics.api.totalRequests}</p>
        <p>Average Response Time: ${report.performanceMetrics.api.avgResponseTime.toFixed(2)}ms</p>
        <p>Error Rate: ${(report.performanceMetrics.api.errorRate * 100).toFixed(2)}%</p>
        ` : '<p>No API metrics available</p>'}
    </div>
    
    <div class=\"metric-card\">
        <h2>Recommendations</h2>
        ${report.recommendations.length > 0 ? 
          report.recommendations.map(rec => `
          <div class=\"recommendation ${rec.priority}\">
              <strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}<br>
              <em>Action: ${rec.action}</em>
          </div>
          `).join('') : 
          '<p>No recommendations at this time.</p>'
        }
    </div>
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Save HTML report to file
   * @param {String} html - HTML content
   * @param {String} filename - Output filename
   * @returns {Promise<void>}
   */
  async saveHtmlReportToFile(html, filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `performance-report-${timestamp}.html`;
    }
    
    const reportPath = path.join(__dirname, '..', '..', 'reports', filename);
    
    try {
      // Ensure reports directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      
      // Write report to file
      await fs.writeFile(reportPath, html);
      
      console.log(`HTML performance report saved to ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('Error saving HTML performance report:', error);
      throw error;
    }
  }
}

// Export class
module.exports = { PerformanceReportGenerator };
