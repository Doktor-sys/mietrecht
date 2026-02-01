/**
 * Retry Mechanism Test Script
 * This script tests the retry mechanism optimizations implemented in the Mietrecht Agent.
 */

// Import required modules
const { fetchWithRetry } = require('../mietrecht_data_sources.js');

/**
 * Test function that simulates an API call with potential failures
 * @param {String} data - Data to return
 * @param {Object} failurePattern - Pattern of failures
 * @param {Number} callCount - Current call count (internal use)
 * @returns {Promise<String>} Simulated API response
 */
let callCounts = {};

async function simulateApiCall(data, failurePattern = {}, callCountKey = 'default') {
  // Initialize call count for this key if not exists
  if (!callCounts[callCountKey]) {
    callCounts[callCountKey] = 0;
  }
  
  const currentCall = ++callCounts[callCountKey];
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Check if this call should fail based on pattern
  if (failurePattern[currentCall]) {
    throw new Error(failurePattern[currentCall]);
  }
  
  return `API Response: ${data} - Call ${currentCall} - ${new Date().toISOString()}`;
}

/**
 * Reset call counts
 */
function resetCallCounts() {
  callCounts = {};
}

/**
 * Test basic retry functionality
 */
async function testBasicRetry() {
  console.log('Testing basic retry functionality...');
  resetCallCounts();
  
  // Pattern: fail first 2 calls, succeed on 3rd
  const failurePattern = {
    1: 'ECONNRESET',
    2: 'ETIMEDOUT'
  };
  
  try {
    const result = await fetchWithRetry(
      () => simulateApiCall('Basic Retry Test', failurePattern, 'basic'),
      { maxRetries: 10 }
    );
    console.log(`  Success: ${result}`);
  } catch (error) {
    console.log(`  Failed after retries: ${error.message}`);
  }
  
  console.log('Basic retry test completed.\n');
}

/**
 * Test retry limits
 */
async function testRetryLimits() {
  console.log('Testing retry limits...');
  resetCallCounts();
  
  // Pattern: fail all calls
  const failurePattern = {
    1: 'ECONNRESET',
    2: 'ETIMEDOUT',
    3: 'ENOTFOUND',
    4: 'ECONNREFUSED'
  };
  
  try {
    const result = await fetchWithRetry(
      () => simulateApiCall('Retry Limit Test', failurePattern, 'limit'),
      { maxRetries: 3 }
    );
    console.log(`  Unexpected success: ${result}`);
  } catch (error) {
    console.log(`  Failed as expected after 3 retries: ${error.message}`);
  }
  
  console.log('Retry limits test completed.\n');
}

/**
 * Test non-retryable errors
 */
async function testNonRetryableErrors() {
  console.log('Testing non-retryable errors...');
  resetCallCounts();
  
  // Pattern: fail with non-retryable error
  const failurePattern = {
    1: 'Invalid API key'
  };
  
  try {
    const result = await fetchWithRetry(
      () => simulateApiCall('Non-retryable Test', failurePattern, 'nonretry'),
      { 
        maxRetries: 3,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
      }
    );
    console.log(`  Unexpected success: ${result}`);
  } catch (error) {
    console.log(`  Failed immediately (non-retryable): ${error.message}`);
  }
  
  console.log('Non-retryable errors test completed.\n');
}

/**
 * Test exponential backoff
 */
async function testExponentialBackoff() {
  console.log('Testing exponential backoff...');
  resetCallCounts();
  
  // Pattern: fail first 4 calls
  const failurePattern = {
    1: 'ECONNRESET',
    2: 'ETIMEDOUT',
    3: 'ENOTFOUND',
    4: 'ECONNREFUSED'
  };
  
  const startTime = Date.now();
  
  try {
    const result = await fetchWithRetry(
      () => simulateApiCall('Backoff Test', failurePattern, 'backoff'),
      { 
        maxRetries: 5,
        baseDelay: 100 // Start with 100ms delay
      }
    );
    console.log(`  Success: ${result}`);
  } catch (error) {
    console.log(`  Failed after retries: ${error.message}`);
  }
  
  const endTime = Date.now();
  console.log(`  Total time for retries: ${endTime - startTime}ms`);
  
  console.log('Exponential backoff test completed.\n');
}

/**
 * Test jitter in retry delays
 */
async function testRetryJitter() {
  console.log('Testing retry jitter...');
  resetCallCounts();
  
  // Pattern: fail first 3 calls
  const failurePattern = {
    1: 'ECONNRESET',
    2: 'ETIMEDOUT',
    3: 'ENOTFOUND'
  };
  
  // Run multiple tests to check for jitter
  const times = [];
  for (let i = 0; i < 8; i++) {
    const startTime = Date.now();
    try {
      await fetchWithRetry(
        () => simulateApiCall(`Jitter Test ${i}`, failurePattern, `jitter-${i}`),
        { 
          maxRetries: 5,
          baseDelay: 50
        }
      );
    } catch (error) {
      // Ignore errors for this test
    }
    const endTime = Date.now();
    times.push(endTime - startTime);
  }
  
  console.log(`  Retry times: ${times.join('ms, ')}ms`);
  console.log(`  Average time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`);
  
  // Check if there's variance (indicating jitter)
  const variance = times.reduce((acc, time) => acc + Math.pow(time - (times.reduce((a, b) => a + b, 0) / times.length), 2), 0) / times.length;
  console.log(`  Variance: ${variance.toFixed(2)} (higher values indicate more jitter)`);
  
  console.log('Retry jitter test completed.\n');
}

/**
 * Run all retry mechanism tests
 */
async function runAllRetryTests() {
  console.log('Running all retry mechanism optimization tests...\n');
  
  try {
    await testBasicRetry();
    await testRetryLimits();
    await testNonRetryableErrors();
    await testExponentialBackoff();
    await testRetryJitter();
    
    console.log('All retry mechanism optimization tests completed successfully.');
  } catch (error) {
    console.error('Error running retry tests:', error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllRetryTests()
    .then(() => {
      console.log('Retry mechanism optimization tests finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running retry mechanism optimization tests:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  testBasicRetry,
  testRetryLimits,
  testNonRetryableErrors,
  testExponentialBackoff,
  testRetryJitter,
  runAllRetryTests
};