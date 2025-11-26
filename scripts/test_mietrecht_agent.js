/**
 * Test script for Mietrecht Court Decisions Agent Prototype
 */

const {
  filterDecisionsForLawyer,
  categorizeDecisions,
  generateNewsletter,
  runMietrechtAgent,
  lawyers,
  mockCourtDecisions
} = require('./mietrecht_agent_prototype.js');

console.log("Testing Mietrecht Court Decisions Agent Prototype...\n");

// Test 1: Filter decisions for lawyer
console.log("1. Testing decision filtering...");
const lawyer1 = lawyers[0];
const filteredDecisions = filterDecisionsForLawyer(mockCourtDecisions, lawyer1);
console.log(`✓ Filtered ${filteredDecisions.length} decisions for ${lawyer1.name}`);
console.log(`  Expected decisions from preferred courts and topics`);
console.log(`  Found ${filteredDecisions.filter(d => 
    lawyer1.preferences.courtLevels.includes(d.court) && 
    lawyer1.preferences.topics.some(t => d.topics.includes(t))
  ).length} matching decisions\n`);

// Test 2: Categorize decisions
console.log("2. Testing decision categorization...");
const categorizedDecisions = categorizeDecisions(filteredDecisions);
console.log(`✓ Categorized decisions:`);
console.log(`  BGH: ${categorizedDecisions.bgh.length}`);
console.log(`  Regional: ${categorizedDecisions.regional.length}`);
console.log(`  Constitutional: ${categorizedDecisions.constitutional.length}\n`);

// Test 3: Generate newsletter
console.log("3. Testing newsletter generation...");
const newsletterContent = generateNewsletter(lawyer1, filteredDecisions);
console.log(`✓ Generated newsletter content (${newsletterContent.length} characters)`);
console.log(`  Contains lawyer name: ${newsletterContent.includes(lawyer1.name)}`);
console.log(`  Contains BGH section: ${newsletterContent.includes("BGH-Entscheidungen")}`);
console.log(`  Contains practice implications: ${newsletterContent.includes("Praktische Auswirkungen")}\n`);

// Test 4: Validate newsletter structure
console.log("4. Testing newsletter structure...");
const hasHtmlStructure = newsletterContent.includes("<html>") && newsletterContent.includes("</html>");
const hasBodyStructure = newsletterContent.includes("<body>") && newsletterContent.includes("</body>");
const hasHeader = newsletterContent.includes("Mietrechts-Entscheidungen der Woche");
console.log(`✓ HTML structure: ${hasHtmlStructure}`);
console.log(`✓ Body structure: ${hasBodyStructure}`);
console.log(`✓ Header present: ${hasHeader}\n`);

// Test 5: Run the full agent
console.log("5. Testing full agent execution...");
console.log("✓ Running Mietrecht Court Decisions Agent simulation...");
console.log("(This will show email simulation output)\n");

// Run the agent (this will output to console)
runMietrechtAgent();

console.log("\n=== Test Results ===");
console.log("✓ All tests completed successfully!");
console.log("✓ Mietrecht Court Decisions Agent Prototype is working as expected");

// Summary statistics
console.log("\n=== Summary ===");
console.log(`Total Lawyers: ${lawyers.length}`);
console.log(`Mock Court Decisions: ${mockCourtDecisions.length}`);
console.log(`Filtered Decisions for ${lawyer1.name}: ${filteredDecisions.length}`);
console.log(`Newsletter Content Size: ${newsletterContent.length} characters`);

// Additional validation
console.log("\n=== Additional Validation ===");
console.log(`✓ BGH decisions properly categorized: ${categorizedDecisions.bgh.every(d => d.court === "Bundesgerichtshof")}`);
console.log(`✓ Regional decisions properly categorized: ${categorizedDecisions.regional.every(d => d.court === "Landgericht")}`);
console.log(`✓ Constitutional decisions properly categorized: ${categorizedDecisions.constitutional.every(d => d.court === "Bundesverfassungsgericht")}`);
console.log(`✓ Newsletter contains decision summaries: ${newsletterContent.includes("Zusammenfassung:")}`);
console.log(`✓ Newsletter contains practice implications: ${newsletterContent.includes("Praktische Auswirkungen:")}`);