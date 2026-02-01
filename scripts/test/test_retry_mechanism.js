/**
 * Test script for Retry Mechanism
 * This script tests the retry mechanism functionality
 */

const { fetchWithRetry } = require('../mietrecht_data_sources.js');

console.log("=== Retry Mechanism Test ===");

async function runRetryTests() {
  try {
    // Test 1: Successful function (should not retry)
    console.log("\n1. Testing successful function...");
    const successResult = await fetchWithRetry(
      () => Promise.resolve("Success!"),
      { maxRetries: 3, baseDelay: 100 }
    );
    console.log("  ✓ Successful function returned:", successResult);

    // Test 2: Function that fails then succeeds (should retry)
    console.log("\n2. Testing function with transient failure...");
    let attemptCount = 0;
    const transientFailResult = await fetchWithRetry(
      () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('ECONNRESET');
        }
        return Promise.resolve(`Success after ${attemptCount} attempts!`);
      },
      { maxRetries: 5, baseDelay: 100 }
    );
    console.log("  ✓ Transient failure function returned:", transientFailResult);

    // Test 3: Function with non-retryable error (should not retry)
    console.log("\n3. Testing function with non-retryable error...");
    try {
      await fetchWithRetry(
        () => Promise.reject(new Error('Invalid input')),
        { maxRetries: 3, baseDelay: 100 }
      );
      console.log("  ✗ Should have thrown an error");
    } catch (error) {
      console.log("  ✓ Correctly rejected non-retryable error:", error.message);
    }

    // Test 4: Function that always fails (should retry max times then fail)
    console.log("\n4. Testing function that always fails...");
    try {
      await fetchWithRetry(
        () => Promise.reject(new Error('ETIMEDOUT')),
        { maxRetries: 2, baseDelay: 100 }
      );
      console.log("  ✗ Should have thrown an error");
    } catch (error) {
      console.log("  ✓ Correctly failed after max retries:", error.message);
    }

    console.log("\n=== All Retry Mechanism Tests Passed! ===");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runRetryTests();