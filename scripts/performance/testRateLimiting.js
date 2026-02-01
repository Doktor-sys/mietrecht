/**
 * Rate Limiting Test Script
 * This script tests the rate limiting optimizations implemented in the Mietrecht Agent.
 */

// Import required modules
const { fetchWithRateLimiting, fetchWithRetry } = require('../mietrecht_data_sources.js');

/**
 * Test function that simulates an API call
 * @param {String} data - Data to return
 * @param {Boolean} shouldFail - Whether the call should fail
 * @returns {Promise<String>} Simulated API response
 */
async function simulateApiCall(data, shouldFail = false) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (shouldFail) {
    throw new Error('ECONNRESET');
  }
  
  return `API Response: ${data} - ${new Date().toISOString()}`;
}

/**
 * Test basic rate limiting functionality
 */
async function testBasicRateLimiting() {
  console.log('Testing basic rate limiting functionality...');
  
  // Make several quick calls to test rate limiting
  const promises = [];
  for (let i = 1; i <= 15; i++) {
    promises.push(
      fetchWithRateLimiting(() => simulateApiCall(`Test Data ${i}`))
        .then(result => ({ success: true, result, index: i }))
        .catch(error => ({ success: false, error: error.message, index: i }))
    );
  }
  
  // Wait for all calls to complete
  const results = await Promise.all(promises);
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`  Successful requests: ${successful.length}`);
  console.log(`  Failed requests (rate limited): ${failed.length}`);
  
  // Print first few results
  console.log('  First 5 results:');
  successful.slice(0, 5).forEach(r => {
    console.log(`    ${r.index}: ${r.result}`);
  });
  
  // Print rate limit errors
  if (failed.length > 0) {
    console.log('  Rate limit errors:');
    failed.slice(0, 3).forEach(r => {
      console.log(`    ${r.index}: ${r.error}`);
    });
  }
  
  console.log('Basic rate limiting test completed.\n');
}

/**
 * Test adaptive rate limiting
 */
async function testAdaptiveRateLimiting() {
  console.log('Testing adaptive rate limiting...');
  
  // First make successful calls to increase rate limit
  console.log('Making successful calls to increase rate limit...');
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await fetchWithRateLimiting(() => simulateApiCall(`Success Data ${i}`));
      console.log(`  Success ${i}: ${result.substring(0, 50)}...`);
    } catch (error) {
      console.log(`  Error ${i}: ${error.message}`);
    }
  }
  
  // Then make some failing calls to decrease rate limit
  console.log('Making failing calls to decrease rate limit...');
  for (let i = 1; i <= 5; i++) {
    try {
      await fetchWithRateLimiting(() => simulateApiCall(`Fail Data ${i}`, true));
    } catch (error) {
      console.log(`  Expected failure ${i}: ${error.message}`);
    }
  }
  
  console.log('Adaptive rate limiting test completed.\n');
}

/**
 * Test rate limiting status reporting
 */
async function testRateLimitingStatus() {
  console.log('Testing rate limiting status reporting...');
  
  // Get initial status
  const { rateLimiter } = require('../mietrecht_data_sources.js');
  const initialStatus = rateLimiter.getStatus();
  console.log(`  Initial status: ${JSON.stringify(initialStatus)}`);
  
  // Make a few calls
  for (let i = 1; i <= 3; i++) {
    try {
      await fetchWithRateLimiting(() => simulateApiCall(`Status Test ${i}`));
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  // Get status after calls
  const afterStatus = rateLimiter.getStatus();
  console.log(`  Status after calls: ${JSON.stringify(afterStatus)}`);
  
  console.log('Rate limiting status reporting test completed.\n');
}

/**
 * Run all rate limiting tests
 */
async function runAllRateLimitingTests() {
  console.log('Running all rate limiting optimization tests...\n');
  
  try {
    await testBasicRateLimiting();
    await testAdaptiveRateLimiting();
    await testRateLimitingStatus();
    
    console.log('All rate limiting optimization tests completed successfully.');
  } catch (error) {
    console.error('Error running rate limiting tests:', error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllRateLimitingTests()
    .then(() => {
      console.log('Rate limiting optimization tests finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running rate limiting optimization tests:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  testBasicRateLimiting,
  testAdaptiveRateLimiting,
  testRateLimitingStatus,
  runAllRateLimitingTests
};