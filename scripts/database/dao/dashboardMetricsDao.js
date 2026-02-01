/**
 * Dashboard Metrics DAO
 * This module provides data access methods for dashboard metrics.
 */

const { db } = require('../connection.js');

/**
 * Record a dashboard metric
 * @param {string} metricName - Name of the metric
 * @param {number} metricValue - Value of the metric
 * @returns {Promise<number>} ID of the created metric record
 */
function recordMetric(metricName, metricValue) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO dashboard_metrics (metric_name, metric_value) VALUES (?, ?)';
    db.run(sql, [metricName, metricValue], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Get dashboard metrics
 * @param {Object} options - Query options
 * @param {string} options.metricName - Specific metric name to filter by
 * @param {string} options.startDate - Start date for filtering
 * @param {string} options.endDate - End date for filtering
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of metric objects
 */
function getMetrics(options = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM dashboard_metrics';
    const params = [];
    
    // Add WHERE conditions
    const whereConditions = [];
    
    if (options.metricName) {
      whereConditions.push('metric_name = ?');
      params.push(options.metricName);
    }
    
    if (options.startDate) {
      whereConditions.push('recorded_at >= ?');
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      whereConditions.push('recorded_at <= ?');
      params.push(options.endDate);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Add ORDER BY and LIMIT
    sql += ' ORDER BY recorded_at DESC';
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Get latest metric value by name
 * @param {string} metricName - Name of the metric
 * @returns {Promise<number|null>} Latest metric value or null if not found
 */
function getLatestMetricValue(metricName) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT metric_value 
      FROM dashboard_metrics 
      WHERE metric_name = ? 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `;
    
    db.get(sql, [metricName], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.metric_value : null);
      }
    });
  });
}

/**
 * Get metric statistics
 * @param {string} metricName - Name of the metric
 * @param {string} startDate - Start date for statistics
 * @param {string} endDate - End date for statistics
 * @returns {Promise<Object>} Statistics object with min, max, average values
 */
function getMetricStatistics(metricName, startDate, endDate) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        AVG(metric_value) as avg_value,
        COUNT(*) as count
      FROM dashboard_metrics 
      WHERE metric_name = ?
    `;
    
    const params = [metricName];
    
    if (startDate) {
      sql += ' AND recorded_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND recorded_at <= ?';
      params.push(endDate);
    }
    
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Export functions
module.exports = {
  recordMetric,
  getMetrics,
  getLatestMetricValue,
  getMetricStatistics
};