/**
 * Test Execution Script
 * This script provides a convenient way to run different types of tests.
 */

const { runUnitTests } = require('./unit.test.js');
const { runIntegrationTests } = require('./integration.test.js');
const { runE2ETests } = require('./e2e.test.js');
const { generateCoverageReport } = require('./coverage.test.js');

/**
 * Run specific type of tests
 * @param {string} testType - Type of tests to run (unit, integration, e2e, coverage)
 */
async function runTests(testType) {
  switch (testType) {
    case 'unit':
      return await runUnitTests();
    case 'integration':
      return await runIntegrationTests();
    case 'e2e':
      return await runE2ETests();
    case 'coverage':
      return await generateCoverageReport();
    default:
      console.error('Invalid test type. Please specify unit, integration, e2e, or coverage.');
      return { success: false, error: 'Invalid test type' };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Running all tests...\n');
  
  const results = [];
  
  // Run unit tests
  console.log('1. Running unit tests...');
  results.push(await runUnitTests());
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Run integration tests
  console.log('2. Running integration tests...');
  results.push(await runIntegrationTests());
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Run end-to-end tests
  console.log('3. Running end-to-end tests...');
  results.push(await runE2ETests());
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Generate coverage report
  console.log('4. Generating coverage report...');
  results.push(await generateCoverageReport());
  
  // Summarize results
  console.log('\n' + '='.repeat(50));
  console.log('TEST EXECUTION SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`Unit Tests: ${results[0].success ? 'PASSED' : 'FAILED'}`);
  console.log(`Integration Tests: ${results[1].success ? 'PASSED' : 'FAILED'}`);
  console.log(`End-to-End Tests: ${results[2].success ? 'PASSED' : 'FAILED'}`);
  console.log(`Coverage Report: ${results[3].success ? 'GENERATED' : 'FAILED'}`);
  
  const allTestsPassed = results.every(result => result.success);
  console.log('\nOverall Result:', allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  
  return allTestsPassed;
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests if no arguments provided
    runAllTests().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Run specific test type
    const testType = args[0];
    runTests(testType).then(result => {
      process.exit(result.success ? 0 : 1);
    });
  }
}

module.exports = {
  runTests,
  runAllTests
};