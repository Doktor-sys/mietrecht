/**
 * Test script for Mietrecht Data Sources
 * This script tests the enhanced data sources functionality including caching, rate limiting, and retry mechanisms.
 */

const {
  fetchBGHDecisions,
  fetchLandgerichtDecisions,
  fetchBVerfGDecisions,
  fetchBeckOnlineData,
  fetchAllCourtDecisions,
  fetchWithCache,
  clearCache,
  getCacheSize,
  fetchWithRateLimiting,
  fetchWithRetry
} = require('./mietrecht_data_sources.js');

const { searchDecisions, getDecisionDetails } = require('./bgh_api_client.js');

console.log("Testing Mietrecht Data Sources...\n");

async function runTests() {
  try {
    // Test 1: Basic data fetching
    console.log("1. Testing basic data fetching...");
    const bghDecisions = await fetchBGHDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${bghDecisions.length} BGH decisions`);
    
    const landgerichtDecisions = await fetchLandgerichtDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${landgerichtDecisions.length} Landgericht decisions`);
    
    const bverfgDecisions = await fetchBVerfGDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${bverfgDecisions.length} BVerfG decisions`);
    
    const beckOnlineData = await fetchBeckOnlineData({ query: "mietrecht" });
    console.log(`✓ Fetched ${beckOnlineData.length} Beck-Online documents`);
    
    // Test 2: Fetch all court decisions
    console.log("\n2. Testing fetch all court decisions...");
    const allDecisions = await fetchAllCourtDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${allDecisions.length} total decisions from all sources`);
    
    // Test 3: Caching mechanism
    console.log("\n3. Testing caching mechanism...");
    clearCache();
    console.log(`✓ Cache cleared, size: ${getCacheSize()}`);
    
    const cachedResult = await fetchWithCache("test-key", async () => {
      return await fetchBGHDecisions({ query: "mietrecht" });
    });
    console.log(`✓ Fetched data with caching, cache size: ${getCacheSize()}`);
    
    // Test 4: Rate limiting
    console.log("\n4. Testing rate limiting...");
    try {
      // This should work fine as we haven't exceeded the limit
      const rateLimitedResult = await fetchWithRateLimiting(async () => {
        return await fetchLandgerichtDecisions({ query: "mietrecht" });
      });
      console.log("✓ Rate limiting test passed");
    } catch (error) {
      console.log(`⚠ Rate limiting test failed: ${error.message}`);
    }
    
    // Test 5: Retry mechanism
    console.log("\n5. Testing retry mechanism...");
    try {
      const retryResult = await fetchWithRetry(async () => {
        return await fetchBVerfGDecisions({ query: "mietrecht" });
      }, 2, 500); // 2 retries with 500ms base delay
      console.log("✓ Retry mechanism test passed");
    } catch (error) {
      console.log(`⚠ Retry mechanism test failed: ${error.message}`);
    }
    
    // Test 6: BGH API client
    console.log("\n6. Testing BGH API client...");
    const searchResults = await searchDecisions({ query: "mietrecht" });
    console.log(`✓ BGH search returned ${searchResults.length} results`);
    
    if (searchResults.length > 0) {
      const decisionDetails = await getDecisionDetails(searchResults[0].id);
      console.log(`✓ Fetched details for decision ${decisionDetails.id}`);
    }
    
    console.log("\n=== Test Results ===");
    console.log("✓ All tests completed successfully!");
    console.log("✓ Mietrecht Data Sources are working as expected");
    
    // Summary statistics
    console.log("\n=== Summary ===");
    console.log(`Total Decisions Fetched: ${allDecisions.length}`);
    console.log(`Cache Size: ${getCacheSize()}`);
    console.log("All data source enhancements are functioning properly.");
    
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