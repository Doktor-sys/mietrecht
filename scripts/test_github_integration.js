/**
 * Test script for GitHub Integration
 * This script tests the GitHub integration functionality.
 */

const {
  createGitHubIssue,
  createIssuesForDecisions,
  addCommentToGitHubIssue,
  updateGitHubIssue
} = require('./github_integration.js');

console.log("Testing GitHub Integration...\n");

async function runTests() {
  try {
    // Test 1: Create an issue
    console.log("1. Testing issue creation...");
    const issueData = {
      title: "Testissue für Mietrecht-Agent",
      body: "Dies ist ein Testissue, das vom Mietrecht-Agenten erstellt wurde.",
      labels: ["test", "mietrecht"]
    };
    
    const createdIssue = await createGitHubIssue(issueData);
    console.log(`✓ Created issue with number: ${createdIssue.number}`);
    
    // Test 2: Update an issue
    console.log("\n2. Testing issue update...");
    const updatedIssue = await updateGitHubIssue(createdIssue.number, {
      body: "Dies ist ein aktualisiertes Testissue."
    });
    console.log(`✓ Updated issue with number: ${updatedIssue.number}`);
    
    // Test 3: Add a comment to an issue
    console.log("\n3. Testing comment addition...");
    const comment = await addCommentToGitHubIssue(createdIssue.number, "Dies ist ein Testkommentar.");
    console.log(`✓ Added comment with ID: ${comment.id}`);
    
    // Test 4: Create issues for decisions
    console.log("\n4. Testing issue creation for decisions...");
    const mockDecisions = [
      {
        id: 'decision-1',
        court: "Bundesgerichtshof",
        location: "Karlsruhe",
        decisionDate: "2025-11-15",
        caseNumber: "VIII ZR 121/24",
        topics: ["Mietminderung", "Schimmelbefall"],
        summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern.",
        practiceImplications: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall.",
        importance: "high",
        url: "https://example.com/decision-1"
      }
    ];
    
    const issues = await createIssuesForDecisions(mockDecisions);
    console.log(`✓ Created ${issues.length} issues for decisions`);
    
    console.log("\n=== Test Results ===");
    console.log("✓ All GitHub integration tests completed successfully!");
    
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