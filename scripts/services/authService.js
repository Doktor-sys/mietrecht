/**
 * Authentication Service for Mietrecht Agent
 * This module provides functions for user authentication and authorization.
 */

// Import required modules
const { generateToken, hashPassword, comparePassword } = require('../middleware/authMiddleware.js');
const { getUserByUsername, createUser } = require('../database/dao/userDao.js');

/**
 * Register a new user
 * @param {Object} userData - User registration data (username, password, role)
 * @returns {Promise<Object>} Result object with token and user info
 */
async function registerUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await hashPassword(userData.password);
    
    // Create user in database
    const userId = await createUser({
      username: userData.username,
      password_hash: passwordHash,
      role: userData.role || 'user'
    });
    
    // Get created user
    const user = await getUserByUsername(userData.username);
    
    // Generate token
    const token = generateToken(user);
    
    // Return result
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Login a user
 * @param {Object} credentials - User credentials (username, password)
 * @returns {Promise<Object>} Result object with token and user info
 */
async function loginUser(credentials) {
  try {
    // Get user by username
    const user = await getUserByUsername(credentials.username);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Compare passwords
    const isPasswordValid = await comparePassword(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return result
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create default admin user (for development only)
 * @returns {Promise<Object>} Result object
 */
async function createDefaultAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await getUserByUsername('admin');
    if (existingAdmin) {
      return {
        success: true,
        message: 'Admin user already exists'
      };
    }
    
    // Create default admin user with a default password
    const defaultPassword = 'admin123';
    const passwordHash = await hashPassword(defaultPassword);
    
    const userId = await createUser({
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin'
    });
    
    return {
      success: true,
      message: 'Default admin user created',
      username: 'admin',
      password: defaultPassword
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions
module.exports = {
  registerUser,
  loginUser,
  createDefaultAdminUser
};