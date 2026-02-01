/**
 * Test script for Asana Integration
 * This script tests the Asana integration functionality.
 */

const {
  createAsanaTask,
  updateAsanaTask,
  addCommentToAsanaTask,
  createTasksForDecisions
} = require('./asana_integration.js');

console.log("Testing Asana Integration...\n");

async function runTests() {
  try {
    // Test 1: Create a task
    console.log("1. Testing task creation...");
    const taskData = {
      name: "Testaufgabe für Mietrecht-Agent",
      notes: "Dies ist eine Testaufgabe, die vom Mietrecht-Agenten erstellt wurde.",
      assignee: null
    };
    
    const createdTask = await createAsanaTask(taskData);
    console.log(`✓ Created task with ID: ${createdTask.id}`);
    
    // Test 2: Update a task
    console.log("\n2. Testing task update...");
    const updatedTask = await updateAsanaTask(createdTask.id, {
      notes: "Dies ist eine aktualisierte Testaufgabe."
    });
    console.log(`✓ Updated task with ID: ${updatedTask.id}`);
    
    // Test 3: Add a comment to a task
    console.log("\n3. Testing comment addition...");
    const comment = await addCommentToAsanaTask(createdTask.id, "Dies ist ein Testkommentar.");
    console.log(`✓ Added comment with ID: ${comment.id}`);
    
    // Test 4: Create tasks for decisions
    console.log("\n4. Testing task creation for decisions...");
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
    
    const tasks = await createTasksForDecisions(mockDecisions);
    console.log(`✓ Created ${tasks.length} tasks for decisions`);
    
    console.log("\n=== Test Results ===");
    console.log("✓ All Asana integration tests completed successfully!");
    
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