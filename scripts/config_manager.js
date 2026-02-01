/**
 * Configuration Management System
 * This module handles configuration for the Mietrecht Agent.
 */

// Default configuration
const defaultConfig = {
  // Data sources configuration
  dataSources: {
    bgh: {
      enabled: true,
      baseUrl: 'https://juris.bundesgerichtshof.de',
      maxResults: 50
    },
    landgerichte: {
      enabled: true,
      baseUrl: 'https://www.landesrecht.de',
      maxResults: 50
    },
    bverfg: {
      enabled: true,
      baseUrl: 'https://www.bundesverfassungsgericht.de',
      maxResults: 50
    },
    beckOnline: {
      enabled: false, // Requires subscription
      baseUrl: 'https://beck-online.beck.de',
      maxResults: 50
    }
  },
  
  // NLP configuration
  nlp: {
    enableSummarization: true,
    enableTopicExtraction: true,
    enableEntityExtraction: true,
    enableImportanceClassification: true,
    enablePracticeImplications: true
  },
  
  // Integration configuration
  integrations: {
    asana: {
      enabled: false,
      projectId: '',
      workspaceId: ''
    },
    github: {
      enabled: false,
      owner: '',
      repo: ''
    }
  },
  
  // Notification configuration
  notifications: {
    email: {
      enabled: false,
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: false
      }
    }
  },
  
  // Performance configuration
  performance: {
    cacheEnabled: true,
    cacheTtl: 30, // minutes
    rateLimit: 10, // requests per minute
    maxRetries: 3,
    retryDelay: 1000 // milliseconds
  },
  
  // Lawyer preferences
  lawyers: [
    {
      id: 1,
      name: "Max Mustermann",
      email: "max.mustermann@lawfirm.de",
      lawFirm: "Mustermann & Partner",
      practiceAreas: ["Mietrecht", "Wohnungsrecht"],
      regions: ["Berlin", "Brandenburg"],
      preferences: {
        courtLevels: ["Bundesgerichtshof", "Landgericht"],
        topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
        frequency: "weekly",
        importanceThreshold: "medium"
      }
    },
    {
      id: 2,
      name: "Anna Schmidt",
      email: "anna.schmidt@lawfirm.de",
      lawFirm: "Schmidt & Kollegen",
      practiceAreas: ["Mietrecht", "Baurecht"],
      regions: ["Hamburg", "Schleswig-Holstein"],
      preferences: {
        courtLevels: ["Bundesgerichtshof", "Oberlandesgericht"],
        topics: ["Modernisierung", "Mietpreisbremse", "Zwangsvollstreckung"],
        frequency: "daily",
        importanceThreshold: "high"
      }
    }
  ]
};

/**
 * Load configuration from file or environment variables
 * @returns {Object} Configuration object
 */
function loadConfig() {
  try {
    // Try to load from config file
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configFile);
      return { ...defaultConfig, ...fileConfig };
    }
  } catch (error) {
    console.warn("Could not load config file, using defaults:", error.message);
  }
  
  // Fall back to environment variables or defaults
  return {
    ...defaultConfig,
    dataSources: {
      ...defaultConfig.dataSources,
      bgh: {
        ...defaultConfig.dataSources.bgh,
        baseUrl: process.env.BGH_BASE_URL || defaultConfig.dataSources.bgh.baseUrl,
        maxResults: parseInt(process.env.BGH_MAX_RESULTS) || defaultConfig.dataSources.bgh.maxResults
      },
      landgerichte: {
        ...defaultConfig.dataSources.landgerichte,
        baseUrl: process.env.LANDGERICHTE_BASE_URL || defaultConfig.dataSources.landgerichte.baseUrl,
        maxResults: parseInt(process.env.LANDGERICHTE_MAX_RESULTS) || defaultConfig.dataSources.landgerichte.maxResults
      },
      bverfg: {
        ...defaultConfig.dataSources.bverfg,
        baseUrl: process.env.BVERFG_BASE_URL || defaultConfig.dataSources.bverfg.baseUrl,
        maxResults: parseInt(process.env.BVERFG_MAX_RESULTS) || defaultConfig.dataSources.bverfg.maxResults
      },
      beckOnline: {
        ...defaultConfig.dataSources.beckOnline,
        enabled: process.env.BECK_ONLINE_ENABLED === 'true',
        baseUrl: process.env.BECK_ONLINE_BASE_URL || defaultConfig.dataSources.beckOnline.baseUrl,
        maxResults: parseInt(process.env.BECK_ONLINE_MAX_RESULTS) || defaultConfig.dataSources.beckOnline.maxResults
      }
    },
    integrations: {
      ...defaultConfig.integrations,
      asana: {
        ...defaultConfig.integrations.asana,
        enabled: process.env.ASANA_ENABLED === 'true',
        projectId: process.env.ASANA_PROJECT_ID || defaultConfig.integrations.asana.projectId,
        workspaceId: process.env.ASANA_WORKSPACE_ID || defaultConfig.integrations.asana.workspaceId
      },
      github: {
        ...defaultConfig.integrations.github,
        enabled: process.env.GITHUB_ENABLED === 'true',
        owner: process.env.GITHUB_OWNER || defaultConfig.integrations.github.owner,
        repo: process.env.GITHUB_REPO || defaultConfig.integrations.github.repo
      }
    },
    notifications: {
      ...defaultConfig.notifications,
      email: {
        ...defaultConfig.notifications.email,
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' || defaultConfig.notifications.email.enabled,
        smtp: {
          ...defaultConfig.notifications.email.smtp,
          host: process.env.SMTP_HOST || defaultConfig.notifications.email.smtp.host,
          port: parseInt(process.env.SMTP_PORT) || defaultConfig.notifications.email.smtp.port,
          secure: process.env.SMTP_SECURE === 'true' || defaultConfig.notifications.email.smtp.secure,
          user: process.env.SMTP_USER || defaultConfig.notifications.email.smtp.user,
          pass: process.env.SMTP_PASS || defaultConfig.notifications.email.smtp.pass
        }
      }
    },
    performance: {
      ...defaultConfig.performance,
      cacheTtl: parseInt(process.env.CACHE_TTL) || defaultConfig.performance.cacheTtl,
      rateLimit: parseInt(process.env.RATE_LIMIT) || defaultConfig.performance.rateLimit,
      maxRetries: parseInt(process.env.MAX_RETRIES) || defaultConfig.performance.maxRetries
    }
  };
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration object to save
 */
function saveConfig(config) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Configuration saved to file");
  } catch (error) {
    console.error("Could not save config file:", error.message);
  }
}

/**
 * Get a specific configuration value
 * @param {Object} config - Configuration object
 * @param {String} path - Dot-separated path to configuration value
 * @returns {*} Configuration value
 */
function getConfigValue(config, path) {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

// Load configuration on module import
const config = loadConfig();

// Export functions and configuration
module.exports = {
  config,
  loadConfig,
  saveConfig,
  getConfigValue
};