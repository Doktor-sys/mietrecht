/**
 * Database Initialization Script
 * This script initializes the database with tables and initial data.
 */

const path = require('path');
const { initializeDatabase, closeDatabase } = require(path.join(__dirname, '../connection.js'));
const { initUsersTable } = require('./initUsers.js');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Initialize users table
    await initUsersTable();
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };