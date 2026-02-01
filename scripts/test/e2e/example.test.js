/**
 * End-to-End Test Example
 * This script demonstrates a complete end-to-end test of the Mietrecht Agent system.
 */

const { initializeDatabase, closeDatabase } = require('../database/connection.js');
const { createCourtDecision, getAllCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { createLawyer, getAllLawyers } = require('../database/dao/lawyerDao.js');
const { performComprehensiveAnalysis } = require('../analytics/decisionAnalyzer.js');
const { NotificationManager } = require('../notifications/notificationManager.js');

/**
 * Run end-to-end test
 */
async function runE2ETest() {
  try {
    console.log('Starting end-to-end test...\n');
    
    // Step 1: Initialize database
    console.log('1. Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized\n');
    
    // Step 2: Create test data
    console.log('2. Creating test data...');
    
    // Create a test lawyer
    const lawyerId = await createLawyer({
      name: 'E2E Test Lawyer',
      email: 'e2e-test@example.com',
      law_firm: 'Test Law Firm',
      practice_areas: ['Mietrecht', 'Wohnungsrecht'],
      regions: ['Berlin', 'Brandenburg']
    });
    console.log(`✓ Created lawyer with ID: ${lawyerId}`);
    
    // Create a test court decision
    const decisionId = await createCourtDecision({
      decision_id: 'E2E-TEST-DECISION-001',
      court: 'Bundesgerichtshof',
      location: 'Karlsruhe',
      decision_date: '2025-12-01',
      case_number: 'VIII ZR 999/25',
      topics: ['Mietrecht', 'Kündigung', 'Modernisierung'],
      summary: 'Dies ist eine Testentscheidung für den End-to-End-Test.',
      full_text: 'Vollständiger Text der Testentscheidung...',
      url: 'https://example.com/decision/E2E-TEST-DECISION-001',
      judges: ['Test Richter 1', 'Test Richter 2'],
      practice_implications: 'Diese Entscheidung hat wichtige Auswirkungen auf die Mietrechtspraxis.',
      importance: 'high',
      source: 'bgh',
      processed: false
    });
    console.log(`✓ Created court decision with ID: ${decisionId}\n`);
    
    // Step 3: Verify data creation
    console.log('3. Verifying data creation...');
    const lawyers = await getAllLawyers();
    const decisions = await getAllCourtDecisions();
    
    console.log(`✓ Found ${lawyers.length} lawyers in database`);
    console.log(`✓ Found ${decisions.length} court decisions in database\n`);
    
    // Step 4: Run analysis
    console.log('4. Running comprehensive analysis...');
    const analysisResult = await performComprehensiveAnalysis();
    console.log('✓ Analysis completed successfully');
    console.log(`  - Analyzed ${analysisResult.impact.totalDecisions} decisions`);
    console.log(`  - Found ${analysisResult.trends.topTopics.length} top topics\n`);
    
    // Step 5: Send notifications
    console.log('5. Sending notifications...');
    const notificationManager = new NotificationManager({
      email: {
        enabled: true,
        service: 'gmail',
        user: 'test@example.com',
        pass: 'test-password'
      },
      sms: { enabled: false },
      push: { enabled: false },
      adminRecipients: ['admin@example.com']
    });
    
    // Get the created lawyer
    const testLawyer = lawyers.find(l => l.id === lawyerId);
    
    // Send notification about the new decision
    const notificationResults = await notificationManager.sendNotification(
      ['stub'],
      testLawyer.email,
      'Neue Gerichtsentscheidung gefunden',
      '<p>Eine neue Gerichtsentscheidung wurde dem System hinzugefügt.</p>'
    );
    
    console.log('✓ Notifications sent successfully');
    console.log(`  - ${notificationResults.length} notification channels used\n`);
    
    // Step 6: Clean up
    console.log('6. Cleaning up...');
    await closeDatabase();
    console.log('✓ Database connection closed\n');
    
    console.log('='.repeat(50));
    console.log('END-TO-END TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    
    return true;
  } catch (error) {
    console.error('End-to-end test failed:', error);
    
    // Try to close database connection even if test failed
    try {
      await closeDatabase();
    } catch (closeError) {
      console.error('Error closing database:', closeError);
    }
    
    return false;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runE2ETest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runE2ETest };