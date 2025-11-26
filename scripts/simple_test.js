// Simple test to verify JavaScript files
console.log("JavaScript test running...");

// Test importing the Asana setup helper
try {
  const helper = require('./asana_setup_helper.js');
  console.log("✓ asana_setup_helper.js imported successfully");
  
  // Test the helper functions
  const teamList = helper.generateTeamList();
  console.log(`✓ Team list generated with ${teamList.length} unique members`);
  
  const projects = helper.generateProjectList();
  console.log(`✓ Project list generated with ${projects.length} projects`);
  
  console.log("All tests passed!");
} catch (error) {
  console.error("Error testing JavaScript files:", error.message);
}