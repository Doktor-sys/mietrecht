/**
 * Database connection module for Mietrecht Webinterface
 */

// Import required modules
const { Pool } = require('pg');
const dbConfig = require('../config/db_heroku');

let pool;

try {
  // Get database configuration
  const config = dbConfig.getDatabaseConfig();
  
  if (config) {
    // Create connection pool
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: dbConfig.poolConfig.max,
      min: dbConfig.poolConfig.min,
      idleTimeoutMillis: dbConfig.poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: dbConfig.poolConfig.connectionTimeoutMillis,
    });

    // Test database connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('Database connection warning:', err.message);
        console.warn('Database features will be disabled until PostgreSQL is running');
      } else {
        console.log('Database connected successfully');
      }
    });
  } else {
    console.warn('Database configuration not found');
    pool = null;
  }
} catch (error) {
  console.warn('Database initialization error:', error.message);
  console.warn('Database features will be disabled');
  pool = null;
}

// Export pool for use in other modules
module.exports = {
  query: (text, params) => {
    if (!pool) {
      return Promise.reject(new Error('Database not available'));
    }
    return pool.query(text, params);
  },
};