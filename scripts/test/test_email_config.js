/**
 * Test script for Email Configuration
 * This script tests the email configuration functionality
 */

const emailConfig = require('../config/email.config.js');
const { config, getConfigValue } = require('../config_manager.js');

console.log("=== Email Configuration Test ===");

// Test 1: Display email configuration
console.log("\n1. Email Configuration from email.config.js:");
console.log("- Transport Service:", emailConfig.transport.service);
console.log("- Transport Auth User:", emailConfig.transport.auth.user);
console.log("- From Address:", emailConfig.from);
console.log("- Subject Prefix:", emailConfig.templates.subjectPrefix);
console.log("- Footer:", emailConfig.templates.footer);

// Test 2: Display email configuration from main config
console.log("\n2. Email Configuration from config_manager.js:");
const smtpConfig = getConfigValue(config, 'notifications.email.smtp');
console.log("- SMTP Host:", smtpConfig.host);
console.log("- SMTP Port:", smtpConfig.port);
console.log("- SMTP Secure:", smtpConfig.secure);
console.log("- SMTP User:", smtpConfig.user);
console.log("- Email Enabled:", getConfigValue(config, 'notifications.email.enabled'));

console.log("\n=== Email Configuration Test Complete ===");