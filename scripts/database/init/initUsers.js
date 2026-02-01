/**
 * Database Initialization for Users
 * This script creates the users table if it doesn't exist.
 */

// Import database connection
const { db } = require('../connection.js');

// SQL to create users table
const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`;

/**
 * Initialize users table
 */
function initUsersTable() {
  return new Promise((resolve, reject) => {
    // Split the SQL into separate statements
    const statements = createUsersTableSQL.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    let completed = 0;
    const total = statements.length;
    
    statements.forEach(statement => {
      db.exec(statement, (err) => {
        if (err) {
          console.error('Error executing statement:', statement, err.message);
          // Don't reject immediately, continue with other statements
        }
        
        completed++;
        if (completed === total) {
          console.log('Users table initialized successfully');
          resolve();
        }
      });
    });
  });
}

// Export function
module.exports = { initUsersTable };