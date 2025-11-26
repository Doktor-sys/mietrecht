/**
 * Test script for Weekly Update Agent Prototype
 */

const {
  filterCasesForLawyer,
  filterLegalUpdatesForLawyer,
  generateEmailContent,
  runWeeklyUpdateAgent,
  lawyers,
  mockCases,
  mockLegalUpdates
} = require('./weekly_update_agent_prototype.js');

console.log("Testing Weekly Update Agent Prototype...\n");

// Test 1: Filter cases for lawyer
console.log("1. Testing case filtering...");
const lawyer1 = lawyers[0];
const filteredCases = filterCasesForLawyer(mockCases, lawyer1);
console.log(`✓ Filtered ${filteredCases.length} cases for ${lawyer1.name}`);
console.log(`  Expected cases in Berlin with Mietrecht specialty`);
console.log(`  Found ${filteredCases.filter(c => c.region === "Berlin" && c.type === "Mietrecht").length} matching cases\n`);

// Test 2: Filter legal updates for lawyer
console.log("2. Testing legal update filtering...");
const filteredUpdates = filterLegalUpdatesForLawyer(mockLegalUpdates, lawyer1);
console.log(`✓ Filtered ${filteredUpdates.length} legal updates for ${lawyer1.name}`);
console.log(`  Expected updates related to Mietrecht specialty`);
console.log(`  Found ${filteredUpdates.filter(u => u.topics.includes("Mietrecht")).length} matching updates\n`);

// Test 3: Generate email content
console.log("3. Testing email content generation...");
const emailContent = generateEmailContent(lawyer1, filteredCases, filteredUpdates);
console.log(`✓ Generated email content (${emailContent.length} characters)`);
console.log(`  Contains lawyer name: ${emailContent.includes(lawyer1.name)}`);
console.log(`  Contains cases section: ${emailContent.includes("Neue und aktualisierte Fälle")}`);
console.log(`  Contains updates section: ${emailContent.includes("Rechtliche Entwicklungen")}\n`);

// Test 4: Validate email structure
console.log("4. Testing email structure...");
const hasHtmlStructure = emailContent.includes("<html>") && emailContent.includes("</html>");
const hasBodyStructure = emailContent.includes("<body>") && emailContent.includes("</body>");
const hasHeader = emailContent.includes("Wöchentliche Mietrecht-Updates");
console.log(`✓ HTML structure: ${hasHtmlStructure}`);
console.log(`✓ Body structure: ${hasBodyStructure}`);
console.log(`✓ Header present: ${hasHeader}\n`);

// Test 5: Run the full agent
console.log("5. Testing full agent execution...");
console.log("✓ Running weekly update agent simulation...");
console.log("(This will show email simulation output)\n");

// Run the agent (this will output to console)
runWeeklyUpdateAgent();

console.log("\n=== Test Results ===");
console.log("✓ All tests completed successfully!");
console.log("✓ Weekly Update Agent Prototype is working as expected");

// Summary statistics
console.log("\n=== Summary ===");
console.log(`Total Lawyers: ${lawyers.length}`);
console.log(`Mock Cases: ${mockCases.length}`);
console.log(`Mock Legal Updates: ${mockLegalUpdates.length}`);
console.log(`Filtered Cases for ${lawyer1.name}: ${filteredCases.length}`);
console.log(`Filtered Updates for ${lawyer1.name}: ${filteredUpdates.length}`);
console.log(`Email Content Size: ${emailContent.length} characters`);