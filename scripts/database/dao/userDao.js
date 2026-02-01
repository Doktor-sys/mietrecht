/**
 * User Data Access Object
 * This module provides functions to manage users in the database.
 */

// Import database connection
const { db } = require('../connection.js');

/**
 * Get a user by username
 * @param {String} username - Username
 * @returns {Promise<Object|null>} User object or null if not found
 */
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Get a user by ID
 * @param {Number} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
function getUserById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Create a new user
 * @param {Object} userData - User data (username, password_hash, role)
 * @returns {Promise<Number>} ID of the created user
 */
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)';
    const params = [userData.username, userData.password_hash, userData.role || 'user'];
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Update a user
 * @param {Number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<void>}
 */
function updateUser(id, userData) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const params = [];
    
    // Build dynamic query based on provided fields
    if (userData.username !== undefined) {
      fields.push('username = ?');
      params.push(userData.username);
    }
    
    if (userData.password_hash !== undefined) {
      fields.push('password_hash = ?');
      params.push(userData.password_hash);
    }
    
    if (userData.role !== undefined) {
      fields.push('role = ?');
      params.push(userData.role);
    }
    
    // Add ID to parameters
    params.push(id);
    
    if (fields.length === 0) {
      // No fields to update
      resolve();
      return;
    }
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Delete a user
 * @param {Number} id - User ID
 * @returns {Promise<void>}
 */
function deleteUser(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM users WHERE id = ?';
    
    db.run(sql, [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
function getAllUsers() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, role, created_at FROM users ORDER BY username';
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Export functions
module.exports = {
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers
};