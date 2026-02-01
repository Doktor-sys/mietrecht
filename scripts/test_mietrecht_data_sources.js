/**
 * Test script for Mietrecht Data Sources Module
 */

const { 
  fetchBGHDecisions, 
  fetchLandgerichtDecisions, 
  fetchBVerfGDecisions, 
  fetchBeckOnlineData,
  fetchAllCourtDecisions 
} = require('./mietrecht_data_sources');

async function runTests() {
  console.log("🧪 Testing Mietrecht Data Sources Module");
  console.log("========================================");
  
  try {
    // Test 1: Fetch BGH decisions
    console.log("\n1. Testing BGH decisions fetch...");
    const bghDecisions = await fetchBGHDecisions();
    console.log(`✅ Successfully fetched ${bghDecisions.length} BGH decisions`);
    console.log(`   Sample: ${bghDecisions[0]?.caseNumber} - ${bghDecisions[0]?.summary.substring(0, 50)}...`);
    
    // Test 2: Fetch Landgericht decisions
    console.log("\n2. Testing Landgericht decisions fetch...");
    const landgerichtDecisions = await fetchLandgerichtDecisions();
    console.log(`✅ Successfully fetched ${landgerichtDecisions.length} Landgericht decisions`);
    console.log(`   Sample: ${landgerichtDecisions[0]?.caseNumber} - ${landgerichtDecisions[0]?.summary.substring(0, 50)}...`);
    
    // Test 3: Fetch BVerfG decisions
    console.log("\n3. Testing BVerfG decisions fetch...");
    const bverfgDecisions = await fetchBVerfGDecisions();
    console.log(`✅ Successfully fetched ${bverfgDecisions.length} BVerfG decisions`);
    console.log(`   Sample: ${bverfgDecisions[0]?.caseNumber} - ${bverfgDecisions[0]?.summary.substring(0, 50)}...`);
    
    // Test 4: Fetch Beck-Online data
    console.log("\n4. Testing Beck-Online data fetch...");
    const beckOnlineData = await fetchBeckOnlineData();
    console.log(`✅ Successfully fetched ${beckOnlineData.length} Beck-Online items`);
    console.log(`   Sample: ${beckOnlineData[0]?.title} - ${beckOnlineData[0]?.summary.substring(0, 50)}...`);
    
    // Test 5: Fetch all court decisions
    console.log("\n5. Testing all court decisions fetch...");
    const allDecisions = await fetchAllCourtDecisions();
    console.log(`✅ Successfully fetched ${allDecisions.length} total items from all sources`);
    
    // Display summary
    console.log("\n📋 Summary:");
    console.log(`   - BGH Decisions: ${bghDecisions.length}`);
    console.log(`   - Landgericht Decisions: ${landgerichtDecisions.length}`);
    console.log(`   - BVerfG Decisions: ${bverfgDecisions.length}`);
    console.log(`   - Beck-Online Items: ${beckOnlineData.length}`);
    console.log(`   - Total Items: ${allDecisions.length}`);
    
    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };