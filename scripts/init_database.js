/**
 * Database Initialization Script
 * This script initializes the database with all required tables.
 */

const { initializeDatabase } = require('./database/connection.js');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };