# Configuration Management System

## Overview

The Mietrecht Agent uses a comprehensive configuration management system that allows for flexible configuration through multiple sources:

1. **Default Configuration** - Built-in default values
2. **Configuration File** - JSON file (`scripts/config.json`)
3. **Environment Variables** - System environment variables for secure configuration

## Configuration Hierarchy

The configuration system follows this hierarchy (from lowest to highest priority):

1. Default Configuration
2. Configuration File (`config.json`)
3. Environment Variables

Values from higher priority sources override values from lower priority sources.

## Configuration Structure

### Data Sources Configuration

```json
{
  "dataSources": {
    "bgh": {
      "enabled": true,
      "baseUrl": "https://juris.bundesgerichtshof.de",
      "maxResults": 50
    },
    "landgerichte": {
      "enabled": true,
      "baseUrl": "https://www.landesrecht.de",
      "maxResults": 50
    },
    "bverfg": {
      "enabled": true,
      "baseUrl": "https://www.bundesverfassungsgericht.de",
      "maxResults": 50
    },
    "beckOnline": {
      "enabled": false,
      "baseUrl": "https://beck-online.beck.de",
      "maxResults": 50
    }
  }
}
```

### NLP Configuration

```json
{
  "nlp": {
    "enableSummarization": true,
    "enableTopicExtraction": true,
    "enableEntityExtraction": true,
    "enableImportanceClassification": true,
    "enablePracticeImplications": true
  }
}
```

### Integrations Configuration

```json
{
  "integrations": {
    "asana": {
      "enabled": false,
      "projectId": "",
      "workspaceId": ""
    },
    "github": {
      "enabled": false,
      "owner": "",
      "repo": ""
    }
  }
}
```

### Notifications Configuration

```json
{
  "notifications": {
    "email": {
      "enabled": false,
      "smtp": {
        "host": "smtp.example.com",
        "port": 587,
        "secure": false,
        "user": "",
        "pass": ""
      }
    }
  }
}
```

### Performance Configuration

```json
{
  "performance": {
    "cacheEnabled": true,
    "cacheTtl": 30,
    "rateLimit": 10,
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

### Lawyers Configuration

```json
{
  "lawyers": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "email": "max.mustermann@lawfirm.de",
      "lawFirm": "Mustermann & Partner",
      "practiceAreas": ["Mietrecht", "Wohnungsrecht"],
      "regions": ["Berlin", "Brandenburg"],
      "preferences": {
        "courtLevels": ["Bundesgerichtshof", "Landgericht"],
        "topics": ["Mietminderung", "Kündigung", "Nebenkosten"],
        "frequency": "weekly",
        "importanceThreshold": "medium"
      }
    }
  ]
}
```

## Environment Variables

The following environment variables can be used to override configuration values:

### Data Sources
- `BGH_BASE_URL` - Base URL for BGH API
- `BGH_MAX_RESULTS` - Maximum results for BGH queries
- `LANDGERICHTE_BASE_URL` - Base URL for Landgerichte API
- `LANDGERICHTE_MAX_RESULTS` - Maximum results for Landgerichte queries
- `BVERFG_BASE_URL` - Base URL for BVerfG API
- `BVERFG_MAX_RESULTS` - Maximum results for BVerfG queries
- `BECK_ONLINE_ENABLED` - Enable BeckOnline integration (true/false)
- `BECK_ONLINE_BASE_URL` - Base URL for BeckOnline API
- `BECK_ONLINE_MAX_RESULTS` - Maximum results for BeckOnline queries

### Integrations
- `ASANA_ENABLED` - Enable Asana integration (true/false)
- `ASANA_PROJECT_ID` - Asana project ID
- `ASANA_WORKSPACE_ID` - Asana workspace ID
- `GITHUB_ENABLED` - Enable GitHub integration (true/false)
- `GITHUB_OWNER` - GitHub repository owner
- `GITHUB_REPO` - GitHub repository name

### Notifications
- `EMAIL_NOTIFICATIONS_ENABLED` - Enable email notifications (true/false)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Use secure connection (true/false)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### Performance
- `CACHE_TTL` - Cache time-to-live in minutes
- `RATE_LIMIT` - API rate limit (requests per minute)
- `MAX_RETRIES` - Maximum retry attempts for failed requests

### Email Configuration
- `EMAIL_SERVICE` - Email service provider (gmail, outlook, etc.)
- `EMAIL_USER` - Email account username
- `EMAIL_PASS` - Email account password
- `EMAIL_FROM` - Default sender email address
- `EMAIL_SUBJECT_PREFIX` - Email subject prefix
- `EMAIL_FOOTER` - Email footer text

## Using Configuration in Code

To access configuration values in your code, use the configuration manager:

```javascript
const { config, getConfigValue } = require('./config_manager.js');

// Access configuration directly
const bghMaxResults = config.dataSources.bgh.maxResults;

// Or use the getConfigValue function for nested properties
const bghMaxResults = getConfigValue(config, 'dataSources.bgh.maxResults');
const smtpHost = getConfigValue(config, 'notifications.email.smtp.host');
```

## Saving Configuration

To save configuration changes programmatically:

```javascript
const { config, saveConfig } = require('./config_manager.js');

// Modify configuration
const newConfig = {
  ...config,
  dataSources: {
    ...config.dataSources,
    bgh: {
      ...config.dataSources.bgh,
      maxResults: 25
    }
  }
};

// Save configuration to file
saveConfig(newConfig);
```

## Best Practices

1. **Security**: Never store sensitive information (passwords, API keys) in configuration files. Use environment variables instead.

2. **Environment-specific Configuration**: Use different environment variables for development, testing, and production environments.

3. **Validation**: Always validate configuration values before using them in your application.

4. **Documentation**: Keep this documentation up-to-date when adding new configuration options.

5. **Testing**: Test your application with different configuration values to ensure it behaves correctly.