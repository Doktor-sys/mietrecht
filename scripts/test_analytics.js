/**
 * Test script for analytics functionality
 */

const { runAnalyticsTests } = require('./analytics/testAnalytics.js');

async function runAllTests() {
  try {
    console.log('Starting analytics tests...\n');
    
    // Run analytics tests
    await runAnalyticsTests();
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}