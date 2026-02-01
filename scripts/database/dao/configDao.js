/**
 * Configuration DAO
 * This module provides data access methods for configuration settings.
 */

const { db } = require('../connection.js');

/**
 * Get a configuration value by key
 * @param {string} key - Configuration key
 * @returns {Promise<string|null>} Configuration value or null if not found
 */
function getConfigValue(key) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT value FROM config WHERE key = ?';
    db.get(sql, [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 * @returns {Promise<void>}
 */
function setConfigValue(key, value) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)';
    db.run(sql, [key, value], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get all configuration values
 * @returns {Promise<Object>} Object containing all configuration key-value pairs
 */
function getAllConfig() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT key, value FROM config';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const config = {};
        rows.forEach(row => {
          config[row.key] = row.value;
        });
        resolve(config);
      }
    });
  });
}

/**
 * Delete a configuration value by key
 * @param {string} key - Configuration key
 * @returns {Promise<void>}
 */
function deleteConfigValue(key) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM config WHERE key = ?';
    db.run(sql, [key], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Export functions
module.exports = {
  getConfigValue,
  setConfigValue,
  getAllConfig,
  deleteConfigValue
};