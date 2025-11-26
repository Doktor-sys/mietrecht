/**
 * Authentication middleware for Mietrecht Webinterface
 */

const bcrypt = require('bcrypt');
const LawyerDAO = require('../database/dao/LawyerDAO');

// Hash a password
async function hashPassword(password) {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Compare a password with its hash
async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
}

// Authentication middleware
async function authenticate(req, res, next) {
  try {
    // In a real implementation, this would check for a valid session or JWT token
    // For now, we'll simulate authentication with a fixed lawyer ID
    const lawyerId = 1;
    const lawyer = await LawyerDAO.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(401).render('error', {
        title: 'Nicht autorisiert - Mietrecht Agent',
        message: 'Sie müssen sich anmelden, um auf diese Seite zuzugreifen.'
      });
    }
    
    // Attach lawyer to request object
    req.lawyer = lawyer;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).render('error', {
      title: 'Fehler - Mietrecht Agent',
      message: 'Ein Fehler ist bei der Authentifizierung aufgetreten.'
    });
  }
}

// Admin authentication middleware (for demonstration)
async function authenticateAdmin(req, res, next) {
  try {
    // In a real implementation, this would check for admin privileges
    // For now, we'll simulate admin authentication
    const lawyerId = 1;
    const lawyer = await LawyerDAO.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(401).render('error', {
        title: 'Nicht autorisiert - Mietrecht Agent',
        message: 'Sie müssen sich als Administrator anmelden, um auf diese Seite zuzugreifen.'
      });
    }
    
    // For demo purposes, we'll assume the first lawyer is an admin
    // In a real implementation, you would check actual admin privileges
    req.lawyer = lawyer;
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).render('error', {
      title: 'Fehler - Mietrecht Agent',
      message: 'Ein Fehler ist bei der Admin-Authentifizierung aufgetreten.'
    });
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  authenticate,
  authenticateAdmin
};