/**
 * Authentication Middleware for Mietrecht Agent
 * This module provides JWT-based authentication functionality.
 */

// Import required modules
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Secret key for JWT (in production, this should be stored in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'mietrecht-agent-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role || 'user'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {String} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Hash a password
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with its hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Boolean} True if passwords match
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  // Add user info to request object
  req.user = decoded;
  next();
}

/**
 * Authorization middleware for admin users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authorizeAdmin(req, res, next) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Create a default admin user (for development only)
 * @returns {Object} Admin user object
 */
function createDefaultAdmin() {
  return {
    id: 1,
    username: 'admin',
    role: 'admin'
  };
}

// Export functions
module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticate,
  authorizeAdmin,
  createDefaultAdmin
};