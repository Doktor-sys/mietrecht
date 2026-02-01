/**
 * Test script for Real API Connections
 * This script tests the real API connections for all data sources.
 */

const {
  fetchBGHDecisions,
  fetchLandgerichtDecisions,
  fetchBVerfGDecisions,
  fetchBeckOnlineData,
  fetchAllCourtDecisions
} = require('./mietrecht_data_sources.js');

const {
  searchDecisions,
  getDecisionDetails
} = require('./bgh_api_client.js');

console.log("Testing Real API Connections...\n");

async function runTests() {
  try {
    console.log("1. Testing BGH API Client...");
    const bghSearchResults = await searchDecisions({ query: "mietrecht" });
    console.log(`✓ BGH search returned ${bghSearchResults.length} results`);
    
    if (bghSearchResults.length > 0) {
      const decisionDetails = await getDecisionDetails(bghSearchResults[0].id);
      console.log(`✓ Fetched details for decision ${decisionDetails.id}`);
    }
    
    console.log("\n2. Testing Data Sources...");
    const bghDecisions = await fetchBGHDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${bghDecisions.length} BGH decisions`);
    
    const landgerichtDecisions = await fetchLandgerichtDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${landgerichtDecisions.length} Landgericht decisions`);
    
    const bverfgDecisions = await fetchBVerfGDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${bverfgDecisions.length} BVerfG decisions`);
    
    const beckOnlineData = await fetchBeckOnlineData({ query: "mietrecht" });
    console.log(`✓ Fetched ${beckOnlineData.length} Beck-Online documents`);
    
    console.log("\n3. Testing All Data Sources Together...");
    const allDecisions = await fetchAllCourtDecisions({ query: "mietrecht" });
    console.log(`✓ Fetched ${allDecisions.length} total decisions from all sources`);
    
    console.log("\n=== Test Results ===");
    console.log("✓ All real API connection tests completed successfully!");
    
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