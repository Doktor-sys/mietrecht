/**
 * Test script for Configuration Manager
 * This script tests the configuration management functionality
 */

const { config, getConfigValue, saveConfig } = require('../config_manager.js');

console.log("=== Configuration Manager Test ===");

// Test 1: Display current configuration
console.log("\n1. Current Configuration:");
console.log("- Data Sources:");
console.log("  - BGH:", config.dataSources.bgh);
console.log("  - Landgerichte:", config.dataSources.landgerichte);
console.log("  - BVerfG:", config.dataSources.bverfg);
console.log("  - BeckOnline:", config.dataSources.beckOnline);

console.log("- NLP Configuration:", config.nlp);
console.log("- Integrations:", config.integrations);
console.log("- Notifications:", config.notifications);
console.log("- Performance:", config.performance);

// Test 2: Test getConfigValue function
console.log("\n2. Testing getConfigValue function:");
console.log("  - BGH max results:", getConfigValue(config, 'dataSources.bgh.maxResults'));
console.log("  - Email notifications enabled:", getConfigValue(config, 'notifications.email.enabled'));
console.log("  - SMTP host:", getConfigValue(config, 'notifications.email.smtp.host'));
console.log("  - Non-existent value:", getConfigValue(config, 'non.existent.value'));

// Test 3: Test saving configuration
console.log("\n3. Testing configuration save:");
const testConfig = {
  ...config,
  dataSources: {
    ...config.dataSources,
    bgh: {
      ...config.dataSources.bgh,
      maxResults: 25
    }
  },
  notifications: {
    ...config.notifications,
    email: {
      ...config.notifications.email,
      enabled: true
    }
  }
};

console.log("  - Saving modified configuration...");
saveConfig(testConfig);

// Test 4: Verify configuration was saved
console.log("\n4. Verifying saved configuration:");
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config.json');

if (fs.existsSync(configPath)) {
  const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log("  - BGH max results in saved config:", savedConfig.dataSources.bgh.maxResults);
  console.log("  - Email notifications enabled in saved config:", savedConfig.notifications.email.enabled);
} else {
  console.log("  - Config file not found");
}

console.log("\n=== Configuration Manager Test Complete ===");