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

// Überprüfung der Passwort-Policy
function validatePasswordPolicy(password, userPasswordHistory = []) {
  const errors = [];
  
  // Mindestlänge
  if (password.length < 8) {
    errors.push('Das Passwort muss mindestens 8 Zeichen lang sein.');
  }
  
  // Maximallänge
  if (password.length > 128) {
    errors.push('Das Passwort darf maximal 128 Zeichen lang sein.');
  }
  
  // Komplexitätsanforderungen
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Das Passwort muss mindestens einen Kleinbuchstaben enthalten.');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Das Passwort muss mindestens einen Großbuchstaben enthalten.');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Das Passwort muss mindestens eine Zahl enthalten.');
  }
  
  // Überprüfung auf frühere Passwörter
  if (userPasswordHistory.length > 0) {
    // In einer echten Implementierung würden wir hier die früheren Hashes vergleichen
    // Für dieses Beispiel vereinfachen wir es
    for (const oldPassword of userPasswordHistory) {
      if (password === oldPassword) {
        errors.push('Das Passwort wurde bereits verwendet. Bitte wählen Sie ein neues Passwort.');
        break;
      }
    }
  }
  
  return errors;
}

// Überprüfung, ob das Konto gesperrt ist
function isAccountLocked(accountLockedUntil) {
  if (!accountLockedUntil) return false;
  
  const lockedUntil = new Date(accountLockedUntil);
  const now = new Date();
  
  return lockedUntil > now;
}

// Überprüfung, ob das Passwort abgelaufen ist
function isPasswordExpired(passwordExpiresAt) {
  if (!passwordExpiresAt) return false;
  
  const expiresAt = new Date(passwordExpiresAt);
  const now = new Date();
  
  return expiresAt < now;
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
  validatePasswordPolicy,
  isAccountLocked,
  isPasswordExpired,
  authenticate,
  authenticateAdmin
};