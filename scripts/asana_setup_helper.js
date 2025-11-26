/**
 * Asana Setup Helper Script
 * This script provides utilities to help with the Asana setup process
 */

// Team members list
const teamMembers = [
  // Project Management
  { name: "Max Mustermann", email: "max@jurismind.de", role: "Member", team: "Project Management" },
  { name: "Sarah Schmidt", email: "sarah@jurismind.de", role: "Member", team: "Project Management" },
  
  // Backend Development Team
  { name: "Max Mustermann", email: "max@jurismind.de", role: "Member", team: "Backend Development" },
  { name: "Sarah Schmidt", email: "sarah@jurismind.de", role: "Member", team: "Backend Development" },
  { name: "Alex Johnson", email: "alex@jurismind.de", role: "Member", team: "Backend Development" },
  
  // Frontend Development Team
  { name: "Lisa Weber", email: "lisa@jurismind.de", role: "Member", team: "Frontend Development" },
  { name: "Anna Mueller", email: "anna@jurismind.de", role: "Member", team: "Frontend Development" },
  
  // Mobile Development Team
  { name: "Tom Schmidt", email: "tom@jurismind.de", role: "Member", team: "Mobile Development" },
  
  // QA & Testing Team
  { name: "QA Team", email: "qa@jurismind.de", role: "Member", team: "QA & Testing" },
  
  // DevOps & Infrastructure Team
  { name: "DevOps Team", email: "devops@jurismind.de", role: "Member", team: "DevOps & Infrastructure" },
  
  // Legal & Product Team
  { name: "Product Team", email: "product@jurismind.de", role: "Member", team: "Legal & Product" },
  
  // Stakeholders
  { name: "Management", email: "management@jurismind.de", role: "Guest", team: "Stakeholders" }
];

// Projects to create
const projects = [
  { name: "SmartLaw Mietrecht - Backend", description: "Backend development for SmartLaw Mietrecht application", team: "Backend Development" },
  { name: "SmartLaw Mietrecht - Web App", description: "Web application development for SmartLaw Mietrecht", team: "Frontend Development" },
  { name: "SmartLaw Mietrecht - Mobile App", description: "Mobile application development for SmartLaw Mietrecht", team: "Mobile Development" },
  { name: "SmartLaw Mietrecht - Infrastructure", description: "Infrastructure and DevOps for SmartLaw Mietrecht", team: "DevOps & Infrastructure" }
];

// Portfolios to create
const portfolios = [
  { name: "Q3 2025 Release", description: "Tasks for Q3 2025 product release" },
  { name: "Technical Debt Reduction", description: "Initiatives to reduce technical debt" },
  { name: "Performance Optimization", description: "Projects focused on performance improvements" },
  { name: "Security Enhancements", description: "Security-focused initiatives and improvements" }
];

// Custom fields to create
const customFields = [
  { name: "Priority", type: "dropdown", options: ["Critical", "High", "Medium", "Low"] },
  { name: "Estimate", type: "number", unit: "days" },
  { name: "Business Value", type: "dropdown", options: ["High", "Medium", "Low"] },
  { name: "Customer Impact", type: "dropdown", options: ["High", "Medium", "Low"] },
  { name: "Technical Complexity", type: "dropdown", options: ["High", "Medium", "Low"] },
  { name: "Risk Level", type: "dropdown", options: ["High", "Medium", "Low"] },
  { name: "Status", type: "dropdown", options: ["Planned", "In Progress", "In Review", "Blocked", "Completed", "Cancelled"] }
];

// Task templates to create
const taskTemplates = [
  {
    name: "Feature Development Template",
    checklist: [
      "Requirements gathering",
      "Design review",
      "Implementation",
      "Testing",
      "Documentation",
      "Deployment"
    ]
  },
  {
    name: "Bug Fix Template",
    checklist: [
      "Reproduce issue",
      "Identify root cause",
      "Implement fix",
      "Test fix",
      "Code review",
      "Deploy fix"
    ]
  },
  {
    name: "Technical Debt Template",
    checklist: [
      "Problem identification",
      "Impact assessment",
      "Solution design",
      "Implementation",
      "Testing",
      "Review and documentation"
    ]
  }
];

/**
 * Generate team member list for invitations
 */
function generateTeamList() {
  console.log("=== Team Members for Asana Invitations ===");
  console.log("Name | Email | Role");
  console.log("---|---|---");
  
  // Remove duplicates (Max and Sarah appear in multiple teams)
  const uniqueMembers = [];
  const seenEmails = new Set();
  
  for (const member of teamMembers) {
    if (!seenEmails.has(member.email)) {
      uniqueMembers.push(member);
      seenEmails.add(member.email);
    }
  }
  
  for (const member of uniqueMembers) {
    console.log(`${member.name} | ${member.email} | ${member.role}`);
  }
  
  return uniqueMembers;
}

/**
 * Generate project list
 */
function generateProjectList() {
  console.log("\n=== Projects to Create ===");
  console.log("Project Name | Description | Team");
  console.log("---|---|---");
  
  for (const project of projects) {
    console.log(`${project.name} | ${project.description} | ${project.team}`);
  }
  
  return projects;
}

/**
 * Generate portfolio list
 */
function generatePortfolioList() {
  console.log("\n=== Portfolios to Create ===");
  console.log("Portfolio Name | Description");
  console.log("---|---");
  
  for (const portfolio of portfolios) {
    console.log(`${portfolio.name} | ${portfolio.description}`);
  }
  
  return portfolios;
}

/**
 * Generate custom fields list
 */
function generateCustomFieldsList() {
  console.log("\n=== Custom Fields to Create ===");
  console.log("Field Name | Type | Options/Unit");
  console.log("---|---|---");
  
  for (const field of customFields) {
    const options = field.options ? field.options.join(", ") : (field.unit || "N/A");
    console.log(`${field.name} | ${field.type} | ${options}`);
  }
  
  return customFields;
}

/**
 * Generate task templates list
 */
function generateTaskTemplatesList() {
  console.log("\n=== Task Templates to Create ===");
  
  for (const template of taskTemplates) {
    console.log(`\n${template.name}:`);
    for (const item of template.checklist) {
      console.log(`  - ${item}`);
    }
  }
  
  return taskTemplates;
}

/**
 * Generate setup summary
 */
function generateSetupSummary() {
  console.log("\n=== Asana Setup Summary ===");
  console.log(`Team Members: ${teamMembers.length} (unique: ${[...new Set(teamMembers.map(m => m.email))].length})`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Portfolios: ${portfolios.length}`);
  console.log(`Custom Fields: ${customFields.length}`);
  console.log(`Task Templates: ${taskTemplates.length}`);
}

/**
 * Main function
 */
function main() {
  console.log("Asana Setup Helper");
  console.log("==================");
  
  generateTeamList();
  generateProjectList();
  generatePortfolioList();
  generateCustomFieldsList();
  generateTaskTemplatesList();
  generateSetupSummary();
  
  console.log("\n=== Next Steps ===");
  console.log("1. Create Asana organization account");
  console.log("2. Configure organization settings");
  console.log("3. Set up security settings");
  console.log("4. Create projects and portfolios");
  console.log("5. Create custom fields");
  console.log("6. Set up workflow statuses");
  console.log("7. Configure notification settings");
  console.log("8. Create task templates");
  console.log("9. Invite team members");
  console.log("10. Verify access and permissions");
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
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
};