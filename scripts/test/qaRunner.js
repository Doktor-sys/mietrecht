/**
 * Quality Assurance Test Runner
 * This script runs all tests and generates reports.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * Run unit tests
 */
async function runUnitTests() {
  try {
    console.log('Running unit tests...');
    const { stdout, stderr } = await execAsync('npm run test:unit', { cwd: path.join(__dirname, '../..') });
    
    console.log('Unit tests output:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Unit tests stderr:', stderr);
    }
    
    return { success: true, output: stdout };
  } catch (error) {
    console.error('Unit tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  try {
    console.log('Running integration tests...');
    const { stdout, stderr } = await execAsync('npm run test:integration', { cwd: path.join(__dirname, '../..') });
    
    console.log('Integration tests output:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Integration tests stderr:', stderr);
    }
    
    return { success: true, output: stdout };
  } catch (error) {
    console.error('Integration tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run end-to-end tests
 */
async function runE2ETests() {
  try {
    console.log('Running end-to-end tests...');
    const { stdout, stderr } = await execAsync('npm run test:e2e', { cwd: path.join(__dirname, '../..') });
    
    console.log('End-to-end tests output:');
    console.log(stdout);
    
    if (stderr) {
      console.error('End-to-end tests stderr:', stderr);
    }
    
    return { success: true, output: stdout };
  } catch (error) {
    console.error('End-to-end tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate test coverage report
 */
async function generateCoverageReport() {
  try {
    console.log('Generating test coverage report...');
    const { stdout, stderr } = await execAsync('npm run test:coverage', { cwd: path.join(__dirname, '../..') });
    
    console.log('Coverage report output:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Coverage report stderr:', stderr);
    }
    
    return { success: true, output: stdout };
  } catch (error) {
    console.error('Coverage report generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all quality assurance tests
 */
async function runAllTests() {
  try {
    console.log('Starting quality assurance test suite...\n');
    
    // Run unit tests
    const unitTestResult = await runUnitTests();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Run integration tests
    const integrationTestResult = await runIntegrationTests();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Run end-to-end tests
    const e2eTestResult = await runE2ETests();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Generate coverage report
    const coverageResult = await generateCoverageReport();
    
    // Summarize results
    console.log('\n' + '='.repeat(50));
    console.log('QUALITY ASSURANCE TEST SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`Unit Tests: ${unitTestResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Integration Tests: ${integrationTestResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`End-to-End Tests: ${e2eTestResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Coverage Report: ${coverageResult.success ? 'GENERATED' : 'FAILED'}`);
    
    const allTestsPassed = unitTestResult.success && 
                          integrationTestResult.success && 
                          e2eTestResult.success && 
                          coverageResult.success;
    
    console.log('\nOverall Result:', allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
    
    // Save test results to file
    const testResults = {
      timestamp: new Date().toISOString(),
      unitTests: unitTestResult,
      integrationTests: integrationTestResult,
      e2eTests: e2eTestResult,
      coverage: coverageResult,
      overallResult: allTestsPassed ? 'PASSED' : 'FAILED'
    };
    
    const resultsPath = path.join(__dirname, 'test_results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${resultsPath}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('Quality assurance test suite failed:', error);
    return false;
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  generateCoverageReport,
  runAllTests
};