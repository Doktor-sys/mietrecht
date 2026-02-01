/**
 * Email Configuration
 * This file contains the email configuration for the Mietrecht Agent
 */

// In a production environment, these values should be stored securely
// For example, using environment variables or a secure configuration service

module.exports = {
  // Email transport configuration
  transport: {
    service: process.env.EMAIL_SERVICE || 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || 'mietrecht.agent@example.com',
      pass: process.env.EMAIL_PASS || 'sicheres-passwort-hier'
    }
  },
  
  // Default sender address
  from: process.env.EMAIL_FROM || 'mietrecht.agent@example.com',
  
  // Email templates configuration
  templates: {
    subjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || 'Mietrechts-Urteile',
    footer: process.env.EMAIL_FOOTER || '\n\n---\nDies ist eine automatisch generierte E-Mail vom Mietrecht Agent.\n'
  }
};