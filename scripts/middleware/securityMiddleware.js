/**
 * Security Middleware for Mietrecht Agent
 * This module provides centralized security functions for the application.
 */

// Import required modules
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Apply security headers using Helmet
 * @param {Object} app - Express application instance
 */
function applySecurityHeaders(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    // Disable powered by header to prevent leaking information
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // Prevent cross-site scripting attacks
    xssFilter: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Enforce HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // Prevent cross-site scripting
    referrerPolicy: { policy: 'no-referrer' },
    // Prevent DNS prefetching
    dnsPrefetchControl: { allow: false }
  }));
}

/**
 * Apply rate limiting to prevent abuse
 * @param {Object} app - Express application instance
 */
function applyRateLimiting(app) {
  // General rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // API rate limiter (stricter)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
      error: 'Too many API requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Authentication rate limiter (most strict)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 attempts per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all requests
  app.use(generalLimiter);
  
  // Apply stricter rate limiting to API endpoints
  app.use('/api/', apiLimiter);
  
  // Apply strictest rate limiting to auth endpoints
  app.use('/api/auth/', authLimiter);
}

/**
 * Sanitize input to prevent XSS and other attacks
 * @param {String} input - Input string to sanitize
 * @returns {String} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize lawyer data
 * @param {Object} lawyerData - Lawyer data to validate
 * @returns {Object} Validated and sanitized lawyer data
 */
function validateLawyerData(lawyerData) {
  const sanitizedData = {};
  
  // Name validation (required, max 100 characters)
  if (lawyerData.name) {
    if (typeof lawyerData.name !== 'string' || lawyerData.name.length > 100) {
      throw new Error('Name must be a string with maximum 100 characters');
    }
    sanitizedData.name = sanitizeInput(lawyerData.name);
  } else {
    throw new Error('Name is required');
  }
  
  // Email validation (required, valid email format)
  if (lawyerData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof lawyerData.email !== 'string' || !emailRegex.test(lawyerData.email)) {
      throw new Error('Invalid email format');
    }
    sanitizedData.email = lawyerData.email.toLowerCase();
  } else {
    throw new Error('Email is required');
  }
  
  // Law firm validation (optional, max 100 characters)
  if (lawyerData.law_firm) {
    if (typeof lawyerData.law_firm !== 'string' || lawyerData.law_firm.length > 100) {
      throw new Error('Law firm must be a string with maximum 100 characters');
    }
    sanitizedData.law_firm = sanitizeInput(lawyerData.law_firm);
  }
  
  // Practice areas validation (optional array of strings)
  if (lawyerData.practice_areas) {
    if (!Array.isArray(lawyerData.practice_areas)) {
      throw new Error('Practice areas must be an array');
    }
    if (lawyerData.practice_areas.length > 20) {
      throw new Error('Maximum 20 practice areas allowed');
    }
    sanitizedData.practice_areas = lawyerData.practice_areas.map(area => {
      if (typeof area !== 'string' || area.length > 50) {
        throw new Error('Each practice area must be a string with maximum 50 characters');
      }
      return sanitizeInput(area);
    });
  }
  
  // Regions validation (optional array of strings)
  if (lawyerData.regions) {
    if (!Array.isArray(lawyerData.regions)) {
      throw new Error('Regions must be an array');
    }
    if (lawyerData.regions.length > 20) {
      throw new Error('Maximum 20 regions allowed');
    }
    sanitizedData.regions = lawyerData.regions.map(region => {
      if (typeof region !== 'string' || region.length > 50) {
        throw new Error('Each region must be a string with maximum 50 characters');
      }
      return sanitizeInput(region);
    });
  }
  
  return sanitizedData;
}

/**
 * Validate and sanitize configuration data
 * @param {String} key - Configuration key
 * @param {any} value - Configuration value
 * @returns {Object} Validated and sanitized configuration data
 */
function validateConfigData(key, value) {
  const sanitizedKey = sanitizeInput(key);
  
  // For configuration values, we'll just sanitize strings
  let sanitizedValue = value;
  if (typeof value === 'string') {
    sanitizedValue = sanitizeInput(value);
  }
  
  return {
    key: sanitizedKey,
    value: sanitizedValue
  };
}

/**
 * Validate and sanitize user registration data
 * @param {Object} userData - User registration data
 * @returns {Object} Validated and sanitized user data
 */
function validateUserData(userData) {
  const sanitizedData = {};
  
  // Username validation (required, max 50 characters)
  if (userData.username) {
    if (typeof userData.username !== 'string' || userData.username.length > 50) {
      throw new Error('Username must be a string with maximum 50 characters');
    }
    sanitizedData.username = sanitizeInput(userData.username);
  } else {
    throw new Error('Username is required');
  }
  
  // Password validation (required, min 8 characters, max 100 characters)
  if (userData.password) {
    if (typeof userData.password !== 'string' || userData.password.length < 8 || userData.password.length > 100) {
      throw new Error('Password must be a string with 8-100 characters');
    }
    // Note: We don't sanitize passwords as that would change their value
    sanitizedData.password = userData.password;
  } else {
    throw new Error('Password is required');
  }
  
  // Role validation (optional, defaults to 'user')
  if (userData.role) {
    if (typeof userData.role !== 'string' || (userData.role !== 'user' && userData.role !== 'admin')) {
      throw new Error('Role must be either "user" or "admin"');
    }
    sanitizedData.role = userData.role;
  } else {
    sanitizedData.role = 'user';
  }
  
  return sanitizedData;
}

// Export functions
module.exports = {
  applySecurityHeaders,
  applyRateLimiting,
  sanitizeInput,
  validateLawyerData,
  validateConfigData,
  validateUserData
};