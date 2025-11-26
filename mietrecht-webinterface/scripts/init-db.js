/**
 * Database initialization script for Mietrecht Webinterface
 * This script creates tables and inserts sample data for development
 */

const fs = require('fs');
const path = require('path');
const db = require('../database/connection');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read and execute the initial schema migration
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', '01_initial_schema.sql'),
      'utf8'
    );
    
    // Split the SQL file into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        await db.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('Database schema created successfully');
    
    // Insert sample lawyers
    console.log('Inserting sample lawyers...');
    const lawyerQuery = `
      INSERT INTO lawyers (name, email, password_hash, law_firm) VALUES
      ('Max Mustermann', 'max.mustermann@lawfirm.de', '$2b$10$examplehash1', 'Mustermann & Partner'),
      ('Anna Schmidt', 'anna.schmidt@lawfirm.de', '$2b$10$examplehash2', 'Schmidt Rechtsanwälte')
      ON CONFLICT (email) DO NOTHING
    `;
    await db.query(lawyerQuery);
    
    // Insert sample lawyer preferences
    console.log('Inserting sample lawyer preferences...');
    const preferenceQuery = `
      INSERT INTO lawyer_preferences (lawyer_id, court_levels, topics, frequency, regions) VALUES
      (1, ARRAY['Bundesgerichtshof', 'Landgericht'], ARRAY['Mietminderung', 'Kündigung', 'Nebenkosten'], 'weekly', ARRAY['Berlin', 'Brandenburg']),
      (2, ARRAY['Bundesgerichtshof', 'Bundesverfassungsgericht'], ARRAY['Mietpreisbremse', 'Verfassungsrecht'], 'weekly', ARRAY['Hamburg', 'Schleswig-Holstein'])
      ON CONFLICT DO NOTHING
    `;
    await db.query(preferenceQuery);
    
    // Insert sample court decisions
    console.log('Inserting sample court decisions...');
    const decisionQuery = `
      INSERT INTO court_decisions (case_number, court, location, date, summary, content, importance, topics) VALUES
      ('VIII ZR 121/24', 'Bundesgerichtshof', 'Karlsruhe', '2025-11-15', 'Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.', 'Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.', 'high', ARRAY['Mietminderung', 'Schimmelbefall']),
      ('34 M 12/25', 'Landgericht', 'Berlin', '2025-11-10', 'Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.', 'Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.', 'medium', ARRAY['Kündigung', 'Modernisierung'])
      ON CONFLICT DO NOTHING
    `;
    await db.query(decisionQuery);
    
    console.log('Sample data inserted successfully');
    console.log('Database initialization completed!');
    
    // Close the database connection
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;