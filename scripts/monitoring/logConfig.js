/**
 * Logging Configuration Module
 * This module provides centralized logging configuration for the Mietrecht Agent.
 */

// Default logging configuration
const defaultConfig = {
  // Console logging
  console: {
    enabled: true,
    level: 'info',
    format: 'simple' // 'simple' or 'json'
  },
  
  // File logging
  file: {
    enabled: false,
    level: 'debug',
    path: './logs/mietrecht-agent.log',
    maxSize: '100m', // Maximum file size
    maxFiles: '14d'  // Keep logs for 14 days
  },
  
  // Database logging
  database: {
    enabled: true,
    level: 'info'
  },
  
  // External logging (e.g., Loggly, Papertrail, etc.)
  external: {
    enabled: false,
    level: 'error',
    endpoint: null,
    token: null
  },
  
  // Log filtering
  filtering: {
    // Exclude certain log messages
    excludePatterns: [],
    // Only include certain log messages
    includePatterns: []
  }
};

/**
 * Get logging configuration
 * @returns {Object} Logging configuration
 */
function getLogConfig() {
  // Merge default config with environment variables
  const config = { ...defaultConfig };
  
  // Override with environment variables
  if (process.env.LOG_CONSOLE_ENABLED !== undefined) {
    config.console.enabled = process.env.LOG_CONSOLE_ENABLED === 'true';
  }
  
  if (process.env.LOG_CONSOLE_LEVEL) {
    config.console.level = process.env.LOG_CONSOLE_LEVEL;
  }
  
  if (process.env.LOG_FILE_ENABLED !== undefined) {
    config.file.enabled = process.env.LOG_FILE_ENABLED === 'true';
  }
  
  if (process.env.LOG_FILE_LEVEL) {
    config.file.level = process.env.LOG_FILE_LEVEL;
  }
  
  if (process.env.LOG_FILE_PATH) {
    config.file.path = process.env.LOG_FILE_PATH;
  }
  
  if (process.env.LOG_DATABASE_ENABLED !== undefined) {
    config.database.enabled = process.env.LOG_DATABASE_ENABLED === 'true';
  }
  
  if (process.env.LOG_DATABASE_LEVEL) {
    config.database.level = process.env.LOG_DATABASE_LEVEL;
  }
  
  if (process.env.LOG_EXTERNAL_ENABLED !== undefined) {
    config.external.enabled = process.env.LOG_EXTERNAL_ENABLED === 'true';
  }
  
  if (process.env.LOG_EXTERNAL_LEVEL) {
    config.external.level = process.env.LOG_EXTERNAL_LEVEL;
  }
  
  if (process.env.LOG_EXTERNAL_ENDPOINT) {
    config.external.endpoint = process.env.LOG_EXTERNAL_ENDPOINT;
  }
  
  if (process.env.LOG_EXTERNAL_TOKEN) {
    config.external.token = process.env.LOG_EXTERNAL_TOKEN;
  }
  
  return config;
}

/**
 * Check if a log level is enabled for a specific output
 * @param {string} level - Log level to check
 * @param {string} output - Output type ('console', 'file', 'database', 'external')
 * @returns {boolean} Whether the level is enabled for the output
 */
function isLevelEnabled(level, output) {
  const config = getLogConfig();
  
  if (!config[output] || !config[output].enabled) {
    return false;
  }
  
  const levels = ['debug', 'info', 'warning', 'error'];
  const currentLevelIndex = levels.indexOf(config[output].level);
  const messageLevelIndex = levels.indexOf(level);
  
  // If level is not recognized, default to info
  if (currentLevelIndex === -1) {
    return messageLevelIndex >= levels.indexOf('info');
  }
  
  // If message level is not recognized, default to info
  if (messageLevelIndex === -1) {
    messageLevelIndex = levels.indexOf('info');
  }
  
  return messageLevelIndex >= currentLevelIndex;
}

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @param {string} format - Format type ('simple' or 'json')
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, metadata, format = 'simple') {
  const timestamp = new Date().toISOString();
  
  if (format === 'json') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...metadata
    });
  } else {
    // Simple format
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` ${JSON.stringify(metadata)}`;
    }
    return formatted;
  }
}

// Export functions
module.exports = {
  getLogConfig,
  isLevelEnabled,
  formatLogMessage
};