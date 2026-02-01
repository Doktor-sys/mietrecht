/**
 * Test creating schema tables individually
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const schema = require('./database/schema.js');

// Ensure the database directory exists
const dbDir = path.join(__dirname, 'database', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, 'test_schema.db');

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

// Test each table individually
const tables = [
  { name: 'configTable', sql: schema.configTable },
  { name: 'lawyersTable', sql: schema.lawyersTable },
  { name: 'lawyerPreferencesTable', sql: schema.lawyerPreferencesTable },
  { name: 'courtDecisionsTable', sql: schema.courtDecisionsTable },
  { name: 'dashboardMetricsTable', sql: schema.dashboardMetricsTable },
  { name: 'systemLogsTable', sql: schema.systemLogsTable },
  { name: 'dataSourceStatusTable', sql: schema.dataSourceStatusTable }
];

// Test each table
async function testTables() {
  for (const table of tables) {
    console.log(`Testing ${table.name}...`);
    
    try {
      await new Promise((resolve, reject) => {
        db.run(table.sql, (err) => {
          if (err) {
            console.error(`❌ Error creating ${table.name}:`, err.message);
            reject(err);
          } else {
            console.log(`✅ ${table.name} created successfully`);
            resolve();
          }
        });
      });
    } catch (error) {
      // Continue with next table
    }
  }
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

testTables();