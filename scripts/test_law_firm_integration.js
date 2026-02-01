/**
 * Test script for Law Firm Management System Integration
 * This script tests the integration with law firm management systems.
 */

const { 
  fetchLawyersFromLawFirmSystem, 
  syncLawyersFromLawFirmSystem,
  sendDecisionToLawFirmSystem,
  fetchCaseFromLawFirmSystem,
  updateCaseStatusInLawFirmSystem
} = require('./law_firm_integration.js');

async function testLawFirmIntegration() {
  console.log('=== Testing Law Firm Management System Integration ===\n');
  
  try {
    // Test 1: Fetch lawyers from law firm system
    console.log('Test 1: Fetching lawyers from law firm system...');
    const lawyers = await fetchLawyersFromLawFirmSystem();
    console.log('✓ Successfully fetched lawyers:', JSON.stringify(lawyers, null, 2));
    
    // Test 2: Sync lawyers
    console.log('\nTest 2: Syncing lawyers from law firm system...');
    const syncResult = await syncLawyersFromLawFirmSystem();
    console.log('✓ Lawyer synchronization result:', JSON.stringify(syncResult, null, 2));
    
    // Test 3: Send decision to law firm system
    console.log('\nTest 3: Sending decision to law firm system...');
    const mockDecision = {
      case_number: 'ABC-123/2025',
      court: 'AG Berlin',
      location: 'Berlin',
      decision_date: '2025-12-01',
      topics: ['Mietrecht', 'Kündigung'],
      summary: 'Wichtige Entscheidung zum Mietrecht',
      practice_implications: 'Auswirkungen auf die Praxis',
      importance: 'high',
      url: 'https://example.com/decision/ABC-123/2025'
    };
    
    const mockLawyers = [
      {
        id: 1,
        email: 'max.mustermann@lawfirm.de',
        name: 'Max Mustermann'
      }
    ];
    
    const sendResult = await sendDecisionToLawFirmSystem(mockDecision, mockLawyers);
    console.log('✓ Decision sent result:', JSON.stringify(sendResult, null, 2));
    
    // Test 4: Fetch case from law firm system
    console.log('\nTest 4: Fetching case from law firm system...');
    const caseResult = await fetchCaseFromLawFirmSystem('lf-case-12345');
    console.log('✓ Case fetch result:', JSON.stringify(caseResult, null, 2));
    
    // Test 5: Update case status
    console.log('\nTest 5: Updating case status in law firm system...');
    const statusUpdate = {
      status: 'reviewed',
      notes: 'Case reviewed by legal team'
    };
    
    const updateResult = await updateCaseStatusInLawFirmSystem('lf-case-12345', statusUpdate);
    console.log('✓ Case update result:', JSON.stringify(updateResult, null, 2));
    
    console.log('\n=== All Law Firm Integration Tests Passed ===');
  } catch (error) {
    console.error('❌ Law Firm Integration Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testLawFirmIntegration();
}

module.exports = { testLawFirmIntegration };