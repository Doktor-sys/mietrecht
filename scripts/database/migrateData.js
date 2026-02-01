/**
 * Data Migration Script
 * This script migrates existing data to the database.
 */

const fs = require('fs').promises;
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database/connection.js');
const { setConfigValue } = require('./database/dao/configDao.js');
const { createLawyer } = require('./database/dao/lawyerDao.js');
const { createCourtDecision } = require('./database/dao/courtDecisionDao.js');

/**
 * Migrate configuration from config.json to database
 */
async function migrateConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configFile = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configFile);
    
    // Migrate BGH configuration
    if (config.bgh) {
      await setConfigValue('bgh_baseUrl', config.bgh.baseUrl);
      await setConfigValue('bgh_searchEndpoint', config.bgh.searchEndpoint);
      await setConfigValue('bgh_userAgent', config.bgh.userAgent);
    }
    
    // Migrate email configuration
    if (config.email) {
      await setConfigValue('email_service', config.email.service);
      await setConfigValue('email_user', config.email.user);
      await setConfigValue('email_pass', config.email.pass);
    }
    
    // Migrate notification configuration
    if (config.notification) {
      await setConfigValue('notification_enabled', config.notification.enabled.toString());
      await setConfigValue('notification_method', config.notification.method);
    }
    
    // Migrate processing configuration
    if (config.processing) {
      await setConfigValue('processing_autoSummarize', config.processing.autoSummarize.toString());
      await setConfigValue('processing_extractTopics', config.processing.extractTopics.toString());
    }
    
    console.log('Configuration migrated successfully');
  } catch (error) {
    console.error('Error migrating configuration:', error.message);
  }
}

/**
 * Migrate lawyers from lawyers.json to database
 */
async function migrateLawyers() {
  try {
    const lawyersPath = path.join(__dirname, 'lawyers.json');
    const lawyersFile = await fs.readFile(lawyersPath, 'utf8');
    const lawyers = JSON.parse(lawyersFile);
    
    for (const lawyer of lawyers) {
      await createLawyer(lawyer);
    }
    
    console.log(`${lawyers.length} lawyers migrated successfully`);
  } catch (error) {
    console.error('Error migrating lawyers:', error.message);
  }
}

/**
 * Migrate sample court decisions to database
 */
async function migrateSampleDecisions() {
  try {
    // Sample decisions for migration
    const sampleDecisions = [
      {
        decision_id: 'BGH-VIII-ZR-161-17',
        court: 'Bundesgerichtshof',
        location: 'Karlsruhe',
        decision_date: '2017-12-13',
        case_number: 'VIII ZR 161/17',
        topics: ['Mietrecht', 'Modernisierung', 'Mieterhöhung'],
        summary: 'Der Bundesgerichtshof entschied über die Zulässigkeit einer Mieterhöhung nach Modernisierungsmaßnahmen.',
        full_text: 'Volltext der Entscheidung...',
        url: 'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Gericht=bgh&Art=en&Datum=2017-12-13&Seite=1&Sort=1&SucheNach=&Aktenzeichen=VIII%20ZR%20161%2F17',
        judges: ['Präsident Dr. Kratz', 'Dr. Röhlinger', 'Dr. Siems', 'Dr. Wiegand', 'Dr. Seibt'],
        practice_implications: 'Die Entscheidung klärt die Voraussetzungen für zulässige Mieterhöhungen nach Modernisierungsmaßnahmen.',
        importance: 'high',
        source: 'bgh',
        processed: true
      },
      {
        decision_id: 'BGH-VIII-ZR-180-18',
        court: 'Bundesgerichtshof',
        location: 'Karlsruhe',
        decision_date: '2019-04-24',
        case_number: 'VIII ZR 180/18',
        topics: ['Mietrecht', 'Kündigung', 'Eigenbedarf'],
        summary: 'Der Bundesgerichtshof stellte klar, wann eine Kündigung wegen Eigenbedarfs wirksam ist.',
        full_text: 'Volltext der Entscheidung...',
        url: 'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Gericht=bgh&Art=en&Datum=2019-04-24&Seite=1&Sort=1&SucheNach=&Aktenzeichen=VIII%20ZR%20180%2F18',
        judges: ['Präsident Dr. Kratz', 'Dr. Siems', 'Dr. Wiegand', 'Dr. Seibt', 'Dr. Langenfeld'],
        practice_implications: 'Die Entscheidung konkretisiert die Anforderungen an eine wirksame Eigenbedarfskündigung.',
        importance: 'high',
        source: 'bgh',
        processed: true
      }
    ];
    
    for (const decision of sampleDecisions) {
      await createCourtDecision(decision);
    }
    
    console.log(`${sampleDecisions.length} sample decisions migrated successfully`);
  } catch (error) {
    console.error('Error migrating sample decisions:', error.message);
  }
}

/**
 * Main migration function
 */
async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Initialize database
    await initializeDatabase();
    
    // Migrate data
    await migrateConfig();
    await migrateLawyers();
    await migrateSampleDecisions();
    
    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Data migration failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };