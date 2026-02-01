/**
 * Enhanced Mietrecht Agent with Advanced Features
 * This agent integrates all advanced features including configuration, filtering, notifications, and reporting.
 */

const { config, loadConfig, saveConfig } = require('./config_manager.js');
const { fetchAllCourtDecisions } = require('./mietrecht_data_sources.js');
const { enhanceDecisionsWithNLP } = require('./mietrecht_agent_nlp.js');
const { filterDecisions, sortDecisions, searchDecisions } = require('./advanced_filtering.js');
const { createTasksForDecisions } = require('./asana_integration.js');
const { createIssuesForDecisions } = require('./github_integration.js');
const { sendNewsletter, sendImportantDecisionsNotification } = require('./notification_system.js');
const { generateSummaryReport, generateDetailedReport } = require('./reporting_system.js');

/**
 * Filter decisions for a specific lawyer based on their preferences
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object
 * @returns {Array} Filtered array of decisions
 */
function filterDecisionsForLawyer(decisions, lawyer) {
  console.log(`Filtering decisions for lawyer: ${lawyer.name}`);
  
  // Create filters based on lawyer preferences
  const filters = {
    court: lawyer.preferences.courtLevels,
    topics: lawyer.preferences.topics,
    location: lawyer.regions,
    importance: getImportanceThreshold(lawyer.preferences.importanceThreshold)
  };
  
  return filterDecisions(decisions, filters);
}

/**
 * Get importance thresholds based on lawyer preference
 * @param {String} threshold - Importance threshold preference
 * @returns {Array} Array of importance levels
 */
function getImportanceThreshold(threshold) {
  switch (threshold) {
    case 'high':
      return ['high'];
    case 'medium':
      return ['high', 'medium'];
    case 'low':
    default:
      return ['high', 'medium', 'low'];
  }
}

/**
 * Categorize decisions by importance level
 * @param {Array} decisions - Array of court decision objects
 * @returns {Object} Object with decisions categorized by importance
 */
function categorizeDecisions(decisions) {
  console.log(`Categorizing ${decisions.length} decisions by importance`);
  
  const categorized = {
    high: [],
    medium: [],
    low: []
  };
  
  decisions.forEach(decision => {
    const importance = decision.importance?.toLowerCase() || 'low';
    if (['high', 'medium', 'low'].includes(importance)) {
      categorized[importance].push(decision);
    } else {
      categorized.low.push(decision);
    }
  });
  
  console.log(`Categorized decisions: ${categorized.high.length} high, ${categorized.medium.length} medium, ${categorized.low.length} low`);
  return categorized;
}

/**
 * Generate a newsletter for a lawyer with relevant decisions
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object
 * @returns {String} Formatted newsletter content
 */
function generateNewsletter(decisions, lawyer) {
  console.log(`Generating newsletter for lawyer: ${lawyer.name}`);
  
  if (decisions.length === 0) {
    return `Guten Tag ${lawyer.name},

Für Ihren Suchbereich liegen momentan keine neuen Gerichtsentscheidungen vor.

Mit freundlichen Grüßen
Ihr Mietrecht Agent`;
  }
  
  let newsletter = `Guten Tag ${lawyer.name},

Hier sind die neuesten Gerichtsentscheidungen, die für Ihre Praxis relevant sind:

`;
  
  decisions.forEach((decision, index) => {
    newsletter += `${index + 1}. ${decision.court} - ${decision.caseNumber}
   Datum: ${decision.decisionDate}
   Ort: ${decision.location}
   Themen: ${decision.topics.join(', ')}
   Wichtigkeit: ${decision.importance}
   
   Zusammenfassung:
   ${decision.summary}
   
   Praktische Auswirkungen:
   ${decision.practiceImplications}
   
   Link zur Entscheidung: ${decision.url}

`;
  });
  
  newsletter += `Mit freundlichen Grüßen
Ihr Mietrecht Agent`;
  
  return newsletter;
}

/**
 * Run the Enhanced Mietrecht Agent
 * @param {Object} options - Options for the agent
 * @returns {Promise<Object>} Results of the agent execution
 */
async function runEnhancedMietrechtAgent(options = {}) {
  console.log("Starting Enhanced Mietrecht Agent with Advanced Features...");
  
  // Load current configuration
  const currentConfig = loadConfig();
  console.log("Loaded configuration");
  
  try {
    // Step 1: Fetch all court decisions
    console.log("\n--- STEP 1: FETCHING COURT DECISIONS ---");
    const rawDecisions = await fetchAllCourtDecisions({
      query: options.query || 'mietrecht',
      dateFrom: options.dateFrom,
      dateTo: options.dateTo
    });
    console.log(`✓ Fetched ${rawDecisions.length} raw court decisions`);
    
    // Step 2: Enhance decisions with NLP
    console.log("\n--- STEP 2: ENHANCING WITH NLP ANALYSIS ---");
    const enhancedDecisions = await enhanceDecisionsWithNLP(rawDecisions);
    console.log(`✓ Enhanced ${enhancedDecisions.length} decisions with NLP analysis`);
    
    // Step 3: Process decisions for each lawyer
    console.log("\n--- STEP 3: PROCESSING FOR LAWYERS ---");
    const lawyerResults = [];
    
    for (const lawyer of currentConfig.lawyers) {
      console.log(`\nProcessing for lawyer: ${lawyer.name}`);
      
      // Filter decisions for this lawyer
      const filteredDecisions = filterDecisionsForLawyer(enhancedDecisions, lawyer);
      console.log(`  ✓ Filtered ${filteredDecisions.length} relevant decisions`);
      
      // Categorize decisions by importance
      const categorizedDecisions = categorizeDecisions(filteredDecisions);
      console.log(`  ✓ Categorized decisions by importance`);
      
      // Generate newsletter
      const newsletter = generateNewsletter(categorizedDecisions.high.concat(categorizedDecisions.medium), lawyer);
      console.log(`  ✓ Generated newsletter`);
      
      // Send newsletter if email notifications are enabled
      if (currentConfig.notifications.email.enabled) {
        try {
          await sendNewsletter(lawyer, newsletter, currentConfig.notifications.email.smtp);
          console.log(`  ✓ Sent newsletter to ${lawyer.name}`);
        } catch (error) {
          console.error(`  ✗ Failed to send newsletter to ${lawyer.name}:`, error.message);
        }
      }
      
      // Send notification for high importance decisions
      if (currentConfig.notifications.email.enabled && categorizedDecisions.high.length > 0) {
        try {
          await sendImportantDecisionsNotification(categorizedDecisions.high, lawyer, currentConfig.notifications.email.smtp);
          console.log(`  ✓ Sent important decisions notification to ${lawyer.name}`);
        } catch (error) {
          console.error(`  ✗ Failed to send important decisions notification to ${lawyer.name}:`, error.message);
        }
      }
      
      lawyerResults.push({
        lawyer,
        decisions: filteredDecisions,
        categorizedDecisions,
        newsletter
      });
    }
    
    // Step 4: Integrate with Asana if enabled
    if (currentConfig.integrations.asana.enabled) {
      console.log("\n--- STEP 4: INTEGRATING WITH ASANA ---");
      try {
        const asanaTasks = await createTasksForDecisions(enhancedDecisions);
        console.log(`✓ Created ${asanaTasks.length} tasks in Asana`);
      } catch (error) {
        console.error("✗ Failed to create tasks in Asana:", error.message);
      }
    }
    
    // Step 5: Integrate with GitHub if enabled
    if (currentConfig.integrations.github.enabled) {
      console.log("\n--- STEP 5: INTEGRATING WITH GITHUB ---");
      try {
        const githubIssues = await createIssuesForDecisions(enhancedDecisions);
        console.log(`✓ Created ${githubIssues.length} issues in GitHub`);
      } catch (error) {
        console.error("✗ Failed to create issues in GitHub:", error.message);
      }
    }
    
    // Step 6: Generate reports
    console.log("\n--- STEP 6: GENERATING REPORTS ---");
    const summaryReport = generateSummaryReport(enhancedDecisions, {
      period: 'last_week',
      outputPath: './reports/summary_report.txt'
    });
    console.log("✓ Generated summary report");
    
    // Generate detailed report for the first lawyer as an example
    if (currentConfig.lawyers.length > 0) {
      const detailedReport = generateDetailedReport(enhancedDecisions, {
        lawyer: currentConfig.lawyers[0],
        includeNLP: true,
        outputPath: './reports/detailed_report.txt'
      });
      console.log("✓ Generated detailed report");
    }
    
    // Summary
    console.log("\n=== EXECUTION SUMMARY ===");
    console.log(`✓ Fetched ${rawDecisions.length} raw court decisions`);
    console.log(`✓ Enhanced ${enhancedDecisions.length} decisions with NLP`);
    console.log(`✓ Processed decisions for ${currentConfig.lawyers.length} lawyers`);
    if (currentConfig.integrations.asana.enabled) {
      console.log("✓ Asana integration completed");
    }
    if (currentConfig.integrations.github.enabled) {
      console.log("✓ GitHub integration completed");
    }
    console.log("✓ Reports generated");
    
    return {
      rawDecisions,
      enhancedDecisions,
      lawyerResults,
      summaryReport
    };
  } catch (error) {
    console.error("Error running Enhanced Mietrecht Agent:", error.message);
    throw new Error(`Failed to run Enhanced Mietrecht Agent: ${error.message}`);
  }
}

// Run the agent if this script is executed directly
if (require.main === module) {
  runEnhancedMietrechtAgent()
    .then(results => {
      console.log("\n=== AGENT EXECUTION COMPLETED ===");
    })
    .catch(error => {
      console.error("Agent execution failed:", error.message);
      process.exit(1);
    });
}

// Export functions
module.exports = {
  runEnhancedMietrechtAgent,
  filterDecisionsForLawyer,
  categorizeDecisions,
  generateNewsletter
};