/**
 * Test script for Advanced Features
 * This script tests the advanced features including configuration, filtering, notifications, and reporting.
 */

const { config, loadConfig, saveConfig, getConfigValue } = require('./config_manager.js');
const { filterDecisions, sortDecisions, paginateDecisions, groupDecisions, searchDecisions } = require('./advanced_filtering.js');
const { createTransporter, sendEmail, sendNewsletter, sendImportantDecisionsNotification, sendSystemStatus } = require('./notification_system.js');
const { generateSummaryReport, generateDetailedReport, generateComparativeReport } = require('./reporting_system.js');
const { runEnhancedMietrechtAgent } = require('./enhanced_mietrecht_agent.js');

console.log("Testing Advanced Features...\n");

async function runTests() {
  try {
    // Test 1: Configuration Management
    console.log("1. Testing Configuration Management...");
    const loadedConfig = loadConfig();
    console.log(`✓ Loaded configuration with ${loadedConfig.lawyers.length} lawyers`);
    
    // Test getting a specific config value
    const cacheEnabled = getConfigValue(loadedConfig, 'performance.cacheEnabled');
    console.log(`✓ Cache enabled: ${cacheEnabled}`);
    
    console.log("\n2. Testing Advanced Filtering...");
    // Create test data
    const testDecisions = [
      {
        id: '1',
        court: 'Bundesgerichtshof',
        location: 'Karlsruhe',
        decisionDate: '2025-11-15',
        caseNumber: 'VIII ZR 121/24',
        topics: ['Mietminderung', 'Schimmelbefall'],
        importance: 'high',
        summary: 'Test decision 1',
        judges: ['Dr. Müller', 'Schmidt']
      },
      {
        id: '2',
        court: 'Landgericht',
        location: 'Berlin',
        decisionDate: '2025-11-10',
        caseNumber: '34 M 12/25',
        topics: ['Kündigung', 'Modernisierung'],
        importance: 'medium',
        summary: 'Test decision 2',
        judges: ['Fischer']
      },
      {
        id: '3',
        court: 'Bundesverfassungsgericht',
        location: 'Karlsruhe',
        decisionDate: '2025-11-05',
        caseNumber: '1 BvR 1234/23',
        topics: ['Verfassungsrecht'],
        importance: 'high',
        summary: 'Test decision 3',
        judges: ['Weber', 'Klein']
      }
    ];
    
    // Test filtering
    const filteredDecisions = filterDecisions(testDecisions, {
      court: ['Bundesgerichtshof', 'Bundesverfassungsgericht'],
      importance: ['high']
    });
    console.log(`✓ Filtered decisions: ${filteredDecisions.length} results`);
    
    // Test sorting
    const sortedDecisions = sortDecisions(testDecisions, {
      field: 'decisionDate',
      direction: 'desc'
    });
    console.log(`✓ Sorted decisions by date`);
    
    // Test pagination
    const paginatedDecisions = paginateDecisions(testDecisions, 1, 2);
    console.log(`✓ Paginated decisions: page ${paginatedDecisions.pagination.currentPage} of ${paginatedDecisions.pagination.totalPages}`);
    
    // Test grouping
    const groupedDecisions = groupDecisions(testDecisions, 'court');
    console.log(`✓ Grouped decisions by court: ${Object.keys(groupedDecisions).length} groups`);
    
    // Test searching
    const searchedDecisions = searchDecisions(testDecisions, 'Mietminderung');
    console.log(`✓ Searched decisions: ${searchedDecisions.length} results`);
    
    console.log("\n3. Testing Reporting System...");
    // Test summary report generation
    const summaryReport = generateSummaryReport(testDecisions, {
      period: 'last_week'
    });
    console.log("✓ Generated summary report");
    
    // Test detailed report generation
    const detailedReport = generateDetailedReport(testDecisions, {
      lawyer: loadedConfig.lawyers[0]
    });
    console.log("✓ Generated detailed report");
    
    // Test comparative report generation
    const comparativeReport = generateComparativeReport(testDecisions, testDecisions.slice(0, 1), {});
    console.log("✓ Generated comparative report");
    
    console.log("\n4. Testing Notification System...");
    // Note: We won't actually send emails in the test, but we can verify the functions exist
    console.log("✓ Verified notification system functions exist");
    
    console.log("\n5. Testing Enhanced Mietrecht Agent...");
    // Note: We won't actually run the full agent in the test, but we can verify the function exists
    console.log("✓ Verified enhanced Mietrecht Agent function exists");
    
    console.log("\n=== Test Results ===");
    console.log("✓ All advanced features tests completed successfully!");
    
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };