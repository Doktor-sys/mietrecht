/**
 * System Log DAO
 * This module provides data access methods for system logs.
 */

const { db } = require('../connection.js');

/**
 * Create a new log entry
 * @param {string} level - Log level (info, warning, error)
 * @param {string} message - Log message
 * @returns {Promise<number>} ID of the created log entry
 */
function createLogEntry(level, message) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO system_logs (level, message) VALUES (?, ?)';
    db.run(sql, [level, message], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Get log entries
 * @param {Object} options - Query options
 * @param {string} options.level - Specific log level to filter by
 * @param {string} options.startDate - Start date for filtering
 * @param {string} options.endDate - End date for filtering
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Array>} Array of log entries
 */
function getLogEntries(options = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM system_logs';
    const params = [];
    
    // Add WHERE conditions
    const whereConditions = [];
    
    if (options.level) {
      whereConditions.push('level = ?');
      params.push(options.level);
    }
    
    if (options.startDate) {
      whereConditions.push('timestamp >= ?');
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      whereConditions.push('timestamp <= ?');
      params.push(options.endDate);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Add ORDER BY and LIMIT/OFFSET
    sql += ' ORDER BY timestamp DESC';
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
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
 * Get log statistics
 * @param {string} startDate - Start date for statistics
 * @param {string} endDate - End date for statistics
 * @returns {Promise<Object>} Statistics object with count by level
 */
function getLogStatistics(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT level, COUNT(*) as count
      FROM system_logs
    `;
    
    const params = [];
    
    if (startDate) {
      sql += ' WHERE timestamp >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      if (startDate) {
        sql += ' AND timestamp <= ?';
      } else {
        sql += ' WHERE timestamp <= ?';
      }
      params.push(endDate);
    }
    
    sql += ' GROUP BY level';
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Convert to object with level as keys
        const stats = {};
        rows.forEach(row => {
          stats[row.level] = row.count;
        });
        resolve(stats);
      }
    });
  });
}

/**
 * Delete old log entries
 * @param {string} olderThan - Date threshold for deletion
 * @returns {Promise<number>} Number of deleted entries
 */
function deleteOldLogs(olderThan) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM system_logs WHERE timestamp < ?';
    db.run(sql, [olderThan], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

/**
 * Get count of log entries
 * @returns {Promise<number>} Total count of log entries
 */
function getLogEntriesCount() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM system_logs';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

// Export functions
module.exports = {
  createLogEntry,
  getLogEntries,
  getLogStatistics,
  deleteOldLogs,
  getLogEntriesCount
};