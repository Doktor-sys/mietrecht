/**
 * Test script for Mietrecht Agent with NJW Integration
 */

const { starteErweitertenMietrechtAgent } = require('./mietrecht_agent_real_data.js');

async function runTest() {
  console.log("🧪 Testing Mietrecht Agent with NJW Integration");
  console.log("=============================================");
  
  try {
    // Run the enhanced Mietrecht agent
    console.log("\n🚀 Starting enhanced Mietrecht agent with NJW integration...");
    await starteErweitertenMietrechtAgent();
    
    console.log("\n🎉 Mietrecht Agent with NJW Integration test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runTest();
}

module.exports = { runTest };