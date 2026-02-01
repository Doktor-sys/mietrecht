/**
 * Enhanced Mietrecht Agent with Integration Capabilities
 * This agent combines all functionality: data fetching, NLP analysis, and integrations with Asana and GitHub.
 */

const {
  fetchAllCourtDecisions
} = require('./mietrecht_data_sources.js');

const {
  summarizeDecision,
  extractTopics,
  extractEntities,
  classifyImportance,
  generatePracticeImplications,
  compareDecisions
} = require('./nlp_processor.js');

const {
  createTasksForDecisions
} = require('./asana_integration.js');

const {
  createIssuesForDecisions
} = require('./github_integration.js');

// Mock data for lawyers (same as in previous agents)
const lawyers = [
  {
    id: 1,
    name: "Max Mustermann",
    email: "max.mustermann@lawfirm.de",
    lawFirm: "Mustermann & Partner",
    practiceAreas: ["Mietrecht", "Wohnungsrecht"],
    regions: ["Berlin", "Brandenburg"],
    preferences: {
      courtLevels: ["Bundesgerichtshof", "Landgericht"],
      topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
      frequency: "weekly"
    }
  },
  {
    id: 2,
    name: "Anna Schmidt",
    email: "anna.schmidt@lawfirm.de",
    lawFirm: "Schmidt & Kollegen",
    practiceAreas: ["Mietrecht", "Baurecht"],
    regions: ["Hamburg", "Schleswig-Holstein"],
    preferences: {
      courtLevels: ["Bundesgerichtshof", "Oberlandesgericht"],
      topics: ["Modernisierung", "Mietpreisbremse", "Zwangsvollstreckung"],
      frequency: "daily"
    }
  }
];

/**
 * Enhance court decisions with NLP analysis
 * @param {Array} decisions - Array of court decision objects
 * @returns {Promise<Array>} Array of enhanced decision objects
 */
async function enhanceDecisionsWithNLP(decisions) {
  console.log(`Enhancing ${decisions.length} decisions with NLP analysis`);
  
  const enhancedDecisions = [];
  
  for (const decision of decisions) {
    try {
      // Apply various NLP analyses to the decision
      const summary = summarizeDecision(decision.fullText);
      const topics = extractTopics(decision.fullText);
      const entities = extractEntities(decision.fullText);
      const importance = classifyImportance(decision.fullText);
      const practiceImplications = generatePracticeImplications(decision.fullText);
      
      // Create enhanced decision object
      const enhancedDecision = {
        ...decision,
        summary: summary || decision.summary, // Use NLP summary if available, otherwise keep original
        topics: topics.length > 0 ? [...new Set([...decision.topics, ...topics])] : decision.topics, // Merge topics
        entities,
        importance: importance || decision.importance, // Use NLP importance if available, otherwise keep original
        practiceImplications: practiceImplications || decision.practiceImplications // Use NLP implications if available
      };
      
      enhancedDecisions.push(enhancedDecision);
    } catch (error) {
      console.error(`Error enhancing decision ${decision.id}:`, error.message);
      // If NLP enhancement fails, keep the original decision
      enhancedDecisions.push(decision);
    }
  }
  
  console.log(`Successfully enhanced ${enhancedDecisions.length} decisions with NLP`);
  return enhancedDecisions;
}

/**
 * Filter decisions for a specific lawyer based on their preferences
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object
 * @returns {Array} Filtered array of decisions
 */
function filterDecisionsForLawyer(decisions, lawyer) {
  console.log(`Filtering decisions for lawyer: ${lawyer.name}`);
  
  return decisions.filter(decision => {
    // Filter by court level preference
    const courtMatch = lawyer.preferences.courtLevels.some(level => 
      decision.court.toLowerCase().includes(level.toLowerCase())
    );
    
    // Filter by topic preference
    const topicMatch = lawyer.preferences.topics.some(topic => 
      decision.topics.some(decisionTopic => 
        decisionTopic.toLowerCase().includes(topic.toLowerCase())
      )
    );
    
    // Filter by region (if applicable)
    const regionMatch = lawyer.regions.some(region => 
      decision.location.toLowerCase().includes(region.toLowerCase())
    );
    
    // A decision matches if it satisfies at least two of the three criteria
    const matchCount = (courtMatch ? 1 : 0) + (topicMatch ? 1 : 0) + (regionMatch ? 1 : 0);
    return matchCount >= 2;
  });
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
 * Run the enhanced Mietrecht Agent with integration capabilities
 * @param {Object} options - Options for the agent
 * @returns {Promise<Object>} Results of the agent execution
 */
async function runEnhancedMietrechtAgent(options = {}) {
  console.log("Starting Enhanced Mietrecht Agent with Integration Capabilities...");
  
  try {
    // Step 1: Fetch all court decisions
    console.log("\n--- STEP 1: FETCHING COURT DECISIONS ---");
    const rawDecisions = await fetchAllCourtDecisions(options);
    console.log(`✓ Fetched ${rawDecisions.length} raw court decisions`);
    
    // Step 2: Enhance decisions with NLP
    console.log("\n--- STEP 2: ENHANCING WITH NLP ANALYSIS ---");
    const enhancedDecisions = await enhanceDecisionsWithNLP(rawDecisions);
    console.log(`✓ Enhanced ${enhancedDecisions.length} decisions with NLP analysis`);
    
    // Step 3: Process decisions for each lawyer
    console.log("\n--- STEP 3: PROCESSING FOR LAWYERS ---");
    const lawyerResults = [];
    
    for (const lawyer of lawyers) {
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
      
      lawyerResults.push({
        lawyer,
        decisions: filteredDecisions,
        categorizedDecisions,
        newsletter
      });
    }
    
    // Step 4: Integrate with Asana
    console.log("\n--- STEP 4: INTEGRATING WITH ASANA ---");
    const asanaTasks = await createTasksForDecisions(enhancedDecisions);
    console.log(`✓ Created ${asanaTasks.length} tasks in Asana`);
    
    // Step 5: Integrate with GitHub
    console.log("\n--- STEP 5: INTEGRATING WITH GITHUB ---");
    const githubIssues = await createIssuesForDecisions(enhancedDecisions);
    console.log(`✓ Created ${githubIssues.length} issues in GitHub`);
    
    // Summary
    console.log("\n=== EXECUTION SUMMARY ===");
    console.log(`✓ Fetched ${rawDecisions.length} raw court decisions`);
    console.log(`✓ Enhanced ${enhancedDecisions.length} decisions with NLP`);
    console.log(`✓ Processed decisions for ${lawyers.length} lawyers`);
    console.log(`✓ Created ${asanaTasks.length} tasks in Asana`);
    console.log(`✓ Created ${githubIssues.length} issues in GitHub`);
    
    return {
      rawDecisions,
      enhancedDecisions,
      lawyerResults,
      asanaTasks,
      githubIssues
    };
  } catch (error) {
    console.error("Error running Enhanced Mietrecht Agent:", error.message);
    throw new Error(`Failed to run Enhanced Mietrecht Agent: ${error.message}`);
  }
}

// Export functions
module.exports = {
  enhanceDecisionsWithNLP,
  filterDecisionsForLawyer,
  categorizeDecisions,
  generateNewsletter,
  runEnhancedMietrechtAgent,
  lawyers
};