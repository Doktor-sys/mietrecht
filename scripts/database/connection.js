/**
 * Database Connection Module
 * This module handles the connection to the SQLite database.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, 'mietrecht_agent.db');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// Function to initialize the database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const schema = require('./schema.js');
    
    // Create tables in the correct order to handle foreign key dependencies
    const tableStatements = [
      schema.configTable,
      schema.lawyersTable,
      schema.lawyerPreferencesTable,
      schema.courtDecisionsTable,
      schema.userInteractionsTable,
      schema.dashboardMetricsTable,
      schema.systemLogsTable,
      schema.dataSourceStatusTable
    ];
    
    // Execute table creation statements
    db.serialize(() => {
      tableStatements.forEach(statement => {
        db.run(statement, (err) => {
          if (err) {
            console.error('Error creating table:', err.message);
            reject(err);
          }
        });
      });
      
      // Create indexes
      schema.indexes.forEach(indexStatement => {
        db.run(indexStatement, (err) => {
          if (err) {
            console.error('Error creating index:', err.message);
            reject(err);
          }
        });
      });
      
      // Insert initial data
      schema.initialData.forEach(dataStatement => {
        db.run(dataStatement, (err) => {
          if (err) {
            console.error('Error inserting initial data:', err.message);
            reject(err);
          }
        });
      });
      
      console.log('Database initialized successfully.');
      resolve();
    });
  });
}

// Function to close the database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed.');
        resolve();
      }
    });
  });
}

// Export database connection and utility functions
module.exports = {
  db,
  initializeDatabase,
  closeDatabase
};