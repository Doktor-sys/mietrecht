/**
 * Test creating a single table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database directory exists
const dbDir = path.join(__dirname, 'database', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, 'test.db');

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

// Test creating a simple table
const testTable = `
CREATE TABLE IF NOT EXISTS test_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.run(testTable, (err) => {
  if (err) {
    console.error('Error creating test table:', err.message);
  } else {
    console.log('✅ Test table created successfully');
  }
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});