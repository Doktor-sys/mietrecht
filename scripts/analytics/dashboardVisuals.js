/**
 * Dashboard Visualization Components
 * This file contains visualization components for the dashboard.
 */

/**
 * Generate HTML for trend chart
 * @param {Object} trends - Trend data
 * @returns {string} HTML for trend chart
 */
function generateTrendChart(trends) {
  // For simplicity, we'll create a basic bar chart representation
  // In a real implementation, you would use a library like Chart.js
  
  let html = '<div class="chart-container">\n';
  html += '  <h3>Entscheidungstrends</h3>\n';
  html += '  <div class="chart">\n';
  
  // Get the last 6 months of data
  const months = Object.keys(trends.monthlyTrends)
    .sort()
    .slice(-6);
  
  months.forEach(month => {
    const count = trends.monthlyTrends[month];
    const height = Math.min(100, count * 2); // Scale height (adjust as needed)
    
    html += `    <div class="bar" style="height: ${height}px;" title="${month}: ${count} Entscheidungen">\n`;
    html += `      <span class="bar-label">${month.split('-')[1]}/${month.split('-')[0].substr(2)}</span>\n`;
    html += '    </div>\n';
  });
  
  html += '  </div>\n';
  html += '</div>\n';
  
  return html;
}

/**
 * Generate HTML for topic distribution
 * @param {Array} topTopics - Top topics data
 * @returns {string} HTML for topic distribution
 */
function generateTopicDistribution(topTopics) {
  let html = '<div class="chart-container">\n';
  html += '  <h3>Häufigste Themen</h3>\n';
  html += '  <div class="topic-list">\n';
  
  topTopics.slice(0, 5).forEach(([topic, count], index) => {
    const percentage = Math.min(100, count); // Scale percentage (adjust as needed)
    
    html += '    <div class="topic-item">\n';
    html += `      <span class="topic-rank">${index + 1}.</span>\n`;
    html += `      <span class="topic-name">${topic}</span>\n`;
    html += `      <div class="topic-bar" style="width: ${percentage}%;">\n`;
    html += `        <span class="topic-count">${count}</span>\n`;
    html += '      </div>\n';
    html += '    </div>\n';
  });
  
  html += '  </div>\n';
  html += '</div>\n';
  
  return html;
}

/**
 * Generate HTML for performance metrics
 * @param {Object} performance - Performance data
 * @returns {string} HTML for performance metrics
 */
function generatePerformanceMetrics(performance) {
  let html = '<div class="metrics-container">\n';
  html += '  <h3>Systemleistung</h3>\n';
  html += '  <div class="metrics-grid">\n';
  
  // Average response time
  html += '    <div class="metric-card">\n';
  html += '      <div class="metric-title">Durchschnittliche Antwortzeit</div>\n';
  html += `      <div class="metric-value">${performance.avgResponseTime.toFixed(2)} ms</div>\n`;
  html += '    </div>\n';
  
  // Cache hit rate
  html += '    <div class="metric-card">\n';
  html += '      <div class="metric-title">Cache-Trefferquote</div>\n';
  html += `      <div class="metric-value">${(performance.avgCacheHitRate * 100).toFixed(1)}%</div>\n`;
  html += '    </div>\n';
  
  // Active requests
  html += '    <div class="metric-card">\n';
  html += '      <div class="metric-title">Aktive Anfragen</div>\n';
  html += `      <div class="metric-value">${performance.activeRequests}</div>\n`;
  html += '    </div>\n';
  
  html += '  </div>\n';
  html += '</div>\n';
  
  return html;
}

/**
 * Generate HTML for bottleneck alerts
 * @param {Array} bottlenecks - Bottleneck data
 * @returns {string} HTML for bottleneck alerts
 */
function generateBottleneckAlerts(bottlenecks) {
  if (bottlenecks.length === 0) {
    return '';
  }
  
  let html = '<div class="alerts-container">\n';
  html += '  <h3>Systemwarnungen</h3>\n';
  html += '  <div class="alerts-list">\n';
  
  bottlenecks.forEach(bottleneck => {
    const severityClass = bottleneck.severity === 'high' ? 'alert-high' : 
                         bottleneck.severity === 'medium' ? 'alert-medium' : 'alert-low';
    
    html += `    <div class="alert-item ${severityClass}">\n`;
    html += `      <span class="alert-description">${bottleneck.description}</span>\n`;
    html += '    </div>\n';
  });
  
  html += '  </div>\n';
  html += '</div>\n';
  
  return html;
}

// Export functions
module.exports = {
  generateTrendChart,
  generateTopicDistribution,
  generatePerformanceMetrics,
  generateBottleneckAlerts
};