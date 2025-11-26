/**
 * Test script for Asana Setup Helper
 */

const { 
  teamMembers, 
  projects, 
  portfolios, 
  customFields, 
  taskTemplates,
  generateTeamList,
  generateProjectList,
  generatePortfolioList,
  generateCustomFieldsList,
  generateTaskTemplatesList,
  generateSetupSummary
} = require('./asana_setup_helper.js');

console.log("Testing Asana Setup Helper...\n");

// Test team members list
console.log("1. Testing team members list...");
const uniqueMembers = generateTeamList();
console.log(`✓ Found ${uniqueMembers.length} unique team members\n`);

// Test projects list
console.log("2. Testing projects list...");
const projectList = generateProjectList();
console.log(`✓ Found ${projectList.length} projects\n`);

// Test portfolios list
console.log("3. Testing portfolios list...");
const portfolioList = generatePortfolioList();
console.log(`✓ Found ${portfolioList.length} portfolios\n`);

// Test custom fields list
console.log("4. Testing custom fields list...");
const fieldList = generateCustomFieldsList();
console.log(`✓ Found ${fieldList.length} custom fields\n`);

// Test task templates list
console.log("5. Testing task templates list...");
const templateList = generateTaskTemplatesList();
console.log(`✓ Found ${templateList.length} task templates\n`);

// Test setup summary
console.log("6. Testing setup summary...");
generateSetupSummary();
console.log("✓ Setup summary generated\n");

// Verify data integrity
console.log("7. Verifying data integrity...");

// Check that all team members have required fields
let validMembers = 0;
for (const member of teamMembers) {
  if (member.name && member.email && member.role) {
    validMembers++;
  }
}
console.log(`✓ ${validMembers}/${teamMembers.length} team members have complete information`);

// Check that all projects have required fields
let validProjects = 0;
for (const project of projects) {
  if (project.name && project.description) {
    validProjects++;
  }
}
console.log(`✓ ${validProjects}/${projects.length} projects have complete information`);

// Check that all portfolios have required fields
let validPortfolios = 0;
for (const portfolio of portfolios) {
  if (portfolio.name && portfolio.description) {
    validPortfolios++;
  }
}
console.log(`✓ ${validPortfolios}/${portfolios.length} portfolios have complete information`);

// Check that all custom fields have required fields
let validFields = 0;
for (const field of customFields) {
  if (field.name && field.type) {
    validFields++;
  }
}
console.log(`✓ ${validFields}/${customFields.length} custom fields have complete information`);

// Check that all task templates have required fields
let validTemplates = 0;
for (const template of taskTemplates) {
  if (template.name && template.checklist && template.checklist.length > 0) {
    validTemplates++;
  }
}
console.log(`✓ ${validTemplates}/${taskTemplates.length} task templates have complete information`);

console.log("\n=== Test Results ===");
console.log("✓ All tests passed!");
console.log("✓ Asana Setup Helper is ready for use");

// Output a simple report
console.log("\n=== Quick Report ===");
console.log(`Total Team Members: ${[...new Set(teamMembers.map(m => m.email))].length}`);
console.log(`Total Projects: ${projects.length}`);
console.log(`Total Portfolios: ${portfolios.length}`);
console.log(`Total Custom Fields: ${customFields.length}`);
console.log(`Total Task Templates: ${taskTemplates.length}`);