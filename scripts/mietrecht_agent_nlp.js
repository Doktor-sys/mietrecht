/**
 * Mietrecht Agent with NLP Capabilities
 * This agent extends the basic functionality with natural language processing capabilities.
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

// Mock data for lawyers (same as in the original agent)
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
    lawFirm: "Schmidt Rechtsanwälte",
    practiceAreas: ["Mietrecht", "Verwaltungsrecht"],
    regions: ["Hamburg", "Schleswig-Holstein"],
    preferences: {
      courtLevels: ["Bundesgerichtshof", "Bundesverfassungsgericht"],
      topics: ["Mietpreisbremse", "Verfassungsrecht"],
      frequency: "weekly"
    }
  }
];

/**
 * Enhance court decisions with NLP analysis
 * @param {Array} decisions - Array of court decision objects
 * @returns {Array} Enhanced decisions with NLP analysis
 */
function enhanceDecisionsWithNLP(decisions) {
  return decisions.map(decision => {
    // Generate automatic summary if not already present
    const summary = decision.summary || summarizeDecision(decision.fullText);
    
    // Extract topics if not already present
    const topics = decision.topics && decision.topics.length > 0 
      ? decision.topics 
      : extractTopics(decision.fullText);
    
    // Extract entities
    const entities = extractEntities(decision.fullText);
    
    // Classify importance if not already present
    const importance = decision.importance || classifyImportance(decision);
    
    // Generate practice implications if not already present
    const practiceImplications = decision.practiceImplications || 
      generatePracticeImplications(decision.fullText);
    
    // Return enhanced decision
    return {
      ...decision,
      summary,
      topics,
      entities,
      importance,
      practiceImplications
    };
  });
}

/**
 * Filter court decisions based on lawyer preferences
 * @param {Array} decisions - Array of enhanced court decision objects
 * @param {Object} lawyer - Lawyer object with preferences
 * @returns {Array} Filtered decisions
 */
function filterDecisionsForLawyer(decisions, lawyer) {
  return decisions.filter(decision => {
    // Filter by court level preference
    const courtLevelMatch = lawyer.preferences.courtLevels.includes(decision.court);
    
    // Filter by topic preference
    const topicMatch = lawyer.preferences.topics.some(topic => 
      decision.topics.includes(topic)
    );
    
    // Filter by importance (lawyers might want high importance decisions)
    const importanceMatch = decision.importance !== "low";
    
    return courtLevelMatch && topicMatch && importanceMatch;
  });
}

/**
 * Categorize decisions by court type
 * @param {Array} decisions - Array of court decision objects
 * @returns {Object} Categorized decisions
 */
function categorizeDecisions(decisions) {
  const categorized = {
    bgh: [],
    regional: [],
    constitutional: [],
    other: []
  };
  
  decisions.forEach(decision => {
    if (decision.court === "Bundesgerichtshof") {
      categorized.bgh.push(decision);
    } else if (decision.court === "Landgericht") {
      categorized.regional.push(decision);
    } else if (decision.court === "Bundesverfassungsgericht") {
      categorized.constitutional.push(decision);
    } else {
      categorized.other.push(decision);
    }
  });
  
  return categorized;
}

/**
 * Generate HTML newsletter content for a lawyer
 * @param {Object} lawyer - Lawyer object
 * @param {Array} decisions - Filtered decisions for the lawyer
 * @returns {String} HTML email content
 */
function generateNewsletter(lawyer, decisions) {
  const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const currentWeek = getWeekNumber(new Date());
  
  const categorizedDecisions = categorizeDecisions(decisions);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mietrechts-Entscheidungen</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 25px 0; padding: 15px; border-left: 4px solid #3498db; background-color: #f8f9fa; border-radius: 0 5px 5px 0; }
        .decision { 
            border: 1px solid #ddd; 
            margin: 15px 0; 
            padding: 15px; 
            border-radius: 5px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .topic-tag { 
            display: inline-block; 
            background-color: #3498db; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 0.8em; 
            margin-right: 5px;
            margin-bottom: 5px;
        }
        .court-name { color: #2c3e50; font-weight: bold; }
        .date { color: #7f8c8d; }
        .case-number { color: #95a5a6; font-size: 0.9em; }
        .importance-high { border-left-color: #e74c3c; }
        .importance-medium { border-left-color: #f39c12; }
        .importance-low { border-left-color: #2ecc71; }
        .footer { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #eee; 
            font-size: 0.9em; 
            color: #777;
            text-align: center;
        }
        .practice-implications { 
            background-color: #fff8e1; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            border-radius: 0 5px 5px 0;
            margin: 15px 0;
        }
        .entities { 
            background-color: #e8f4f8; 
            border-left: 4px solid #3498db; 
            padding: 15px; 
            border-radius: 0 5px 5px 0;
            margin: 15px 0;
            font-size: 0.9em;
        }
        h1, h2, h3 { color: #2c3e50; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mietrechts-Entscheidungen der Woche</h1>
        <p>Kalenderwoche ${currentWeek}, ${currentDate}</p>
        <p>Guten Tag ${lawyer.name},</p>
        <p>hier sind die relevanten Mietrechts-Entscheidungen für Ihre Praxis:</p>
    </div>
  `;
  
  // BGH Decisions Section
  if (categorizedDecisions.bgh.length > 0) {
    html += `
    <div class="section">
        <h2>📌 Neue BGH-Entscheidungen (${categorizedDecisions.bgh.length})</h2>
    `;
    
    categorizedDecisions.bgh.forEach(decision => {
      const importanceClass = `importance-${decision.importance}`;
      html += `
        <div class="decision ${importanceClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons.join(', ')}` : ''}
                ${decision.entities.organizations.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations.join(', ')}` : ''}
                ${decision.entities.locations.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations.join(', ')}` : ''}
            </div>
            
            <p><a href="${decision.url}" target="_blank">Vollständigen Entscheidungstext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Regional Court Decisions Section
  if (categorizedDecisions.regional.length > 0) {
    html += `
    <div class="section">
        <h2>🏛️ Wichtige Landgerichts-Entscheidungen (${categorizedDecisions.regional.length})</h2>
    `;
    
    categorizedDecisions.regional.forEach(decision => {
      const importanceClass = `importance-${decision.importance}`;
      html += `
        <div class="decision ${importanceClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons.join(', ')}` : ''}
                ${decision.entities.organizations.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations.join(', ')}` : ''}
                ${decision.entities.locations.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations.join(', ')}` : ''}
            </div>
            
            <p><a href="${decision.url}" target="_blank">Vollständigen Entscheidungstext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Constitutional Court Decisions Section
  if (categorizedDecisions.constitutional.length > 0) {
    html += `
    <div class="section">
        <h2>⚖️ Bundesverfassungsgericht (${categorizedDecisions.constitutional.length})</h2>
    `;
    
    categorizedDecisions.constitutional.forEach(decision => {
      const importanceClass = `importance-${decision.importance}`;
      html += `
        <div class="decision ${importanceClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons.join(', ')}` : ''}
                ${decision.entities.organizations.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations.join(', ')}` : ''}
                ${decision.entities.locations.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations.join(', ')}` : ''}
            </div>
            
            <p><a href="${decision.url}" target="_blank">Vollständigen Entscheidungstext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Practice Implications Summary
  const allImplications = decisions.map(d => d.practiceImplications).join(' ');
  if (allImplications) {
    html += `
    <div class="practice-implications">
        <h2>💼 Praktische Auswirkungen für Ihre Kanzlei</h2>
        <p>${generatePracticeSummary(decisions)}</p>
    </div>
    `;
  }
  
  html += `
    <div class="footer">
        <p>Dieser Newsletter wird Ihnen vom SmartLaw Mietrecht Agent gesendet.</p>
        <p><a href="https://jurismind.de/preferences">Einstellungen ändern</a> | <a href="https://jurismind.de/unsubscribe">Abmelden</a></p>
        <p><small>Diese E-Mail wurde automatisch generiert. Antworten Sie nicht auf diese Nachricht.</small></p>
    </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Format date for display
 * @param {String} dateStr - Date string in YYYY-MM-DD format
 * @returns {String} Formatted date string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get week number for a date
 * @param {Date} date - Date object
 * @returns {Number} Week number
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Generate practice summary from decisions
 * @param {Array} decisions - Array of decision objects
 * @returns {String} Practice summary
 */
function generatePracticeSummary(decisions) {
  // In a real implementation, this would use NLP to extract key points
  // For this prototype, we'll create a simple summary
  
  const topics = [...new Set(decisions.flatMap(d => d.topics))];
  const implications = decisions.map(d => d.practiceImplications);
  
  return `Diese Woche gab es wichtige Entscheidungen zu den Themen: ${topics.join(', ')}. ` +
         `Die wichtigsten Änderungen betreffen: ${implications.slice(0, 2).join(' ')}. ` +
         "Überprüfen Sie die einzelnen Entscheidungen für detaillierte Informationen.";
}

/**
 * Simulate sending an email
 * @param {Object} lawyer - Lawyer object
 * @param {String} subject - Email subject
 * @param {String} content - Email content
 */
function sendEmail(lawyer, subject, content) {
  console.log(`\n=== EMAIL SIMULATION ===`);
  console.log(`To: ${lawyer.name} <${lawyer.email}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Content preview: ${content.substring(0, 200)}...`);
  console.log(`=== END EMAIL SIMULATION ===\n`);
  
  // In a real implementation, this would use an email service like:
  // await transporter.sendMail({ to: lawyer.email, subject, html: content });
}

/**
 * Main function to run the Mietrecht Agent with NLP capabilities
 */
async function runMietrechtAgentWithNLP() {
  console.log("Starting Mietrecht Agent with NLP capabilities...");
  console.log(`Date: ${new Date().toLocaleString('de-DE')}`);
  
  try {
    // Fetch all court decisions
    console.log("Fetching court decisions...");
    const rawDecisions = await fetchAllCourtDecisions({
      query: "mietrecht",
      dateFrom: "2025-01-01"
    });
    
    console.log(`Fetched ${rawDecisions.length} raw decisions`);
    
    // Enhance decisions with NLP analysis
    console.log("Enhancing decisions with NLP analysis...");
    const enhancedDecisions = enhanceDecisionsWithNLP(rawDecisions);
    
    console.log(`Enhanced ${enhancedDecisions.length} decisions with NLP`);
    
    // Process each lawyer
    for (const lawyer of lawyers) {
      console.log(`\nProcessing updates for ${lawyer.name}...`);
      
      // Filter decisions for this lawyer
      const filteredDecisions = filterDecisionsForLawyer(enhancedDecisions, lawyer);
      
      console.log(`  Found ${filteredDecisions.length} relevant court decisions`);
      
      // Generate newsletter content
      const newsletterContent = generateNewsletter(lawyer, filteredDecisions);
      const emailSubject = `Mietrechts-Entscheidungen - Kalenderwoche ${getWeekNumber(new Date())}`;
      
      // Send email (simulated)
      sendEmail(lawyer, emailSubject, newsletterContent);
      
      // Log the activity
      console.log(`  Newsletter sent to ${lawyer.email}`);
    }
    
    console.log("\nMietrecht Agent with NLP capabilities completed successfully.");
  } catch (error) {
    console.error("Error running Mietrecht Agent with NLP:", error.message);
    throw error;
  }
}

/**
 * Scheduler function to run the agent weekly
 */
function scheduleWeeklyAgent() {
  console.log("Mietrecht Agent with NLP Scheduler started.");
  console.log("Next run: Every Monday at 8:00 AM");
  
  // For demonstration, we'll run it immediately
  runMietrechtAgentWithNLP();
  
  // In a real implementation, this would use a scheduler like:
  // cron.schedule('0 8 * * 1', runMietrechtAgentWithNLP); // Every Monday at 8:00 AM
}

// Run the scheduler if this script is executed directly
if (require.main === module) {
  scheduleWeeklyAgent();
}

// Export functions for testing
module.exports = {
  enhanceDecisionsWithNLP,
  filterDecisionsForLawyer,
  categorizeDecisions,
  generateNewsletter,
  sendEmail,
  runMietrechtAgentWithNLP,
  scheduleWeeklyAgent,
  lawyers
};