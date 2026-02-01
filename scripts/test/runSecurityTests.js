/**
 * Security Test Runner
 * This script runs the security tests for the Mietrecht Agent.
 */

const { exec } = require('child_process');

// Run security tests
console.log('Running security tests...');

exec('npx jest --config=scripts/test/jest.config.js scripts/test/security.test.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running security tests: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('Security tests completed.');
});