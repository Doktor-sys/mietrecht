/**
 * Heroku Database Configuration
 * This module handles database configuration for Heroku deployment
 */

// Load environment variables
require('dotenv').config();

// Function to parse Heroku's DATABASE_URL
function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return null;
  }
  
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.substring(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: true // Heroku requires SSL
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
}

// Get database configuration
function getDatabaseConfig() {
  // Check if we're on Heroku (DATABASE_URL is set)
  if (process.env.DATABASE_URL) {
    console.log('Using Heroku database configuration');
    return parseDatabaseUrl(process.env.DATABASE_URL);
  }
  
  // Use local development configuration
  console.log('Using local database configuration');
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mietrecht_agent',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' || false
  };
}

// Pool configuration
const poolConfig = {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

module.exports = {
  getDatabaseConfig,
  poolConfig
};