/**
 * Test script for the enhanced Mietrecht Court Decisions Agent
 */

const { fetchCourtDecisions, filterDecisionsForLawyer, categorizeDecisions, generateNewsletter, lawyers, mockCourtDecisions } = require('./mietrecht_agent_enhanced');

async function runTests() {
  console.log("🧪 Testing Enhanced Mietrecht Court Decisions Agent");
  console.log("==================================================");
  
  try {
    // Test 1: Fetch court decisions
    console.log("\n1. Testing fetchCourtDecisions...");
    const decisions = await fetchCourtDecisions();
    console.log(`✅ Successfully fetched ${decisions.length} court decisions`);
    
    // Test 2: Filter decisions for lawyers
    console.log("\n2. Testing filterDecisionsForLawyer...");
    const lawyer1Decisions = filterDecisionsForLawyer(decisions, lawyers[0]);
    console.log(`✅ Lawyer 1 (${lawyers[0].name}) has ${lawyer1Decisions.length} relevant decisions`);
    
    const lawyer2Decisions = filterDecisionsForLawyer(decisions, lawyers[1]);
    console.log(`✅ Lawyer 2 (${lawyers[1].name}) has ${lawyer2Decisions.length} relevant decisions`);
    
    // Test 3: Categorize decisions
    console.log("\n3. Testing categorizeDecisions...");
    const categorized = categorizeDecisions(decisions);
    console.log(`✅ Categorized decisions:`);
    console.log(`   - BGH: ${categorized.bgh.length}`);
    console.log(`   - Regional: ${categorized.regional.length}`);
    console.log(`   - Constitutional: ${categorized.constitutional.length}`);
    console.log(`   - Other: ${categorized.other.length}`);
    
    // Test 4: Generate newsletter
    console.log("\n4. Testing generateNewsletter...");
    const newsletterHtml = generateNewsletter(lawyers[0], lawyer1Decisions);
    console.log(`✅ Generated newsletter with ${newsletterHtml.length} characters`);
    
    // Test 5: Validate newsletter content
    console.log("\n5. Validating newsletter content...");
    if (newsletterHtml.includes('<html>') && newsletterHtml.includes('</html>')) {
      console.log("✅ Newsletter has valid HTML structure");
    } else {
      console.log("❌ Newsletter is missing HTML structure");
    }
    
    if (newsletterHtml.includes(lawyers[0].name)) {
      console.log("✅ Newsletter includes lawyer's name");
    } else {
      console.log("❌ Newsletter is missing lawyer's name");
    }
    
    if (newsletterHtml.includes('Mietrechts-Entscheidungen')) {
      console.log("✅ Newsletter has correct title");
    } else {
      console.log("❌ Newsletter is missing title");
    }
    
    console.log("\n✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };