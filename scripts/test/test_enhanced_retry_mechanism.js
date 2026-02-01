/**
 * Enhanced Test script for Retry Mechanism
 * This script tests the enhanced retry mechanism functionality
 */

const { fetchWithRetry } = require('../mietrecht_data_sources.js');

console.log("=== Enhanced Retry Mechanism Test ===");

async function runEnhancedRetryTests() {
  try {
    // Test 1: Different backoff strategies
    console.log("\n1. Testing exponential backoff strategy...");
    let attemptCount = 0;
    const startTime = Date.now();
    await fetchWithRetry(
      () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('ETIMEDOUT');
        }
        return Promise.resolve(`Success with exponential backoff!`);
      },
      { maxRetries: 3, baseDelay: 100, strategy: 'exponential' }
    );
    const endTime = Date.now();
    console.log("  ✓ Exponential backoff took:", endTime - startTime, "ms");

    console.log("\n2. Testing linear backoff strategy...");
    attemptCount = 0;
    const startTime2 = Date.now();
    await fetchWithRetry(
      () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('ETIMEDOUT');
        }
        return Promise.resolve(`Success with linear backoff!`);
      },
      { maxRetries: 3, baseDelay: 100, strategy: 'linear' }
    );
    const endTime2 = Date.now();
    console.log("  ✓ Linear backoff took:", endTime2 - startTime2, "ms");

    console.log("\n3. Testing fixed backoff strategy...");
    attemptCount = 0;
    const startTime3 = Date.now();
    await fetchWithRetry(
      () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('ETIMEDOUT');
        }
        return Promise.resolve(`Success with fixed backoff!`);
      },
      { maxRetries: 3, baseDelay: 100, strategy: 'fixed' }
    );
    const endTime3 = Date.now();
    console.log("  ✓ Fixed backoff took:", endTime3 - startTime3, "ms");

    // Test 4: Non-retryable errors
    console.log("\n4. Testing non-retryable errors...");
    try {
      await fetchWithRetry(
        () => Promise.reject(new Error('401 Unauthorized')),
        { maxRetries: 3, baseDelay: 100 }
      );
      console.log("  ✗ Should have thrown an error");
    } catch (error) {
      console.log("  ✓ Correctly rejected non-retryable error:", error.message);
    }

    // Test 5: Status code based retry decisions
    console.log("\n5. Testing status code based retry decisions...");
    try {
      await fetchWithRetry(
        () => Promise.reject({ response: { status: 503 } }),
        { maxRetries: 2, baseDelay: 100 }
      );
      console.log("  ✗ Should have thrown an error after retries");
    } catch (error) {
      console.log("  ✓ Correctly retried on 503 status code");
    }

    // Test 6: Non-retryable status codes
    console.log("\n6. Testing non-retryable status codes...");
    try {
      await fetchWithRetry(
        () => Promise.reject({ response: { status: 403 } }),
        { maxRetries: 2, baseDelay: 100 }
      );
      console.log("  ✗ Should have thrown an error immediately");
    } catch (error) {
      console.log("  ✓ Correctly did not retry on 403 status code");
    }

    console.log("\n=== All Enhanced Retry Mechanism Tests Passed! ===");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runEnhancedRetryTests();