/**
 * Data Source Status DAO
 * This module provides data access methods for data source statuses.
 */

const { db } = require('../connection.js');

/**
 * Get all data source statuses
 * @returns {Promise<Array>} Array of data source status objects
 */
function getAllDataSourceStatuses() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM data_source_status';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Get data source status by name
 * @param {string} sourceName - Name of the data source
 * @returns {Promise<Object|null>} Data source status object or null if not found
 */
function getDataSourceStatusByName(sourceName) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM data_source_status WHERE source_name = ?';
    db.get(sql, [sourceName], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Update data source status
 * @param {string} sourceName - Name of the data source
 * @param {string} status - New status
 * @param {string} lastCheck - Timestamp of last check
 * @returns {Promise<void>}
 */
function updateDataSourceStatus(sourceName, status, lastCheck = null) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR REPLACE INTO data_source_status (source_name, status, last_check, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [sourceName, status, lastCheck], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get data source statistics
 * @returns {Promise<Object>} Statistics object with count by status
 */
function getDataSourceStatistics() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT status, COUNT(*) as count FROM data_source_status GROUP BY status';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Convert to object with status as keys
        const stats = {};
        rows.forEach(row => {
          stats[row.status] = row.count;
        });
        resolve(stats);
      }
    });
  });
}

// Export functions
module.exports = {
  getAllDataSourceStatuses,
  getDataSourceStatusByName,
  updateDataSourceStatus,
  getDataSourceStatistics
};