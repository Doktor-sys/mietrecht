/**
 * Enhanced Mietrecht Agent with Advanced KI/ML Capabilities
 * This agent extends the basic functionality with advanced AI/ML capabilities.
 */

const {
  fetchAllCourtDecisions
} = require('./mietrecht_data_sources.js');

// Import enhanced NLP processor
const {
  summarizeDecision,
  extractTopics,
  extractEntities,
  classifyImportance,
  generatePracticeImplications,
  compareDecisions,
  analyzeSentimentEnhanced,
  comprehensiveNLPAnalysis
} = require('./nlp/enhancedNLPProcessor.js');

// Import enhanced legal precedent predictor
const {
  generateEnhancedPredictiveAnalysis,
  findEnhancedSimilarDecisions,
  predictEnhancedDecisionImportance,
  predictEnhancedPracticeImplications
} = require('./analytics/enhancedLegalPrecedentPredictor.js');

// Import recommendation engine
const { generateRecommendations } = require('./ml/recommendationEngine.js');

// Import client profiler
const { createClientProfile } = require('./ml/clientProfiler.js');

// Import case analyzer
const { analyzeCase } = require('./ml/caseAnalyzer.js');

// Mock data for lawyers (extended from original agent)
const lawyers = [
  {
    id: 1,
    name: "Max Mustermann",
    email: "max.mustermann@lawfirm.de",
    lawFirm: "Mustermann & Partner",
    practiceAreas: ["Mietrecht", "Wohnungsrecht"],
    regions: ["Berlin", "Brandenburg"],
    expertise: ["Mietminderung", "Kündigung", "Nebenkosten"],
    preferences: {
      courtLevels: ["Bundesgerichtshof", "Landgericht"],
      topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
      frequency: "weekly",
      communication: "email",
      detailLevel: "high",
      involvement: "high",
      riskTolerance: "medium"
    }
  },
  {
    id: 2,
    name: "Anna Schmidt",
    email: "anna.schmidt@lawfirm.de",
    lawFirm: "Schmidt Rechtsanwälte",
    practiceAreas: ["Mietrecht", "Verwaltungsrecht"],
    regions: ["Hamburg", "Schleswig-Holstein"],
    expertise: ["Mietpreisbremse", "Verfassungsrecht"],
    preferences: {
      courtLevels: ["Bundesgerichtshof", "Bundesverfassungsgericht"],
      topics: ["Mietpreisbremse", "Verfassungsrecht"],
      frequency: "weekly",
      communication: "email",
      detailLevel: "medium",
      involvement: "medium",
      riskTolerance: "low"
    }
  }
];

/**
 * Enhance court decisions with advanced NLP and ML analysis
 * @param {Array} decisions - Array of court decision objects
 * @returns {Array} Enhanced decisions with advanced analysis
 */
function enhanceDecisionsWithAdvancedNLP(decisions) {
  return decisions.map(decision => {
    // Perform comprehensive NLP analysis
    const nlpAnalysis = comprehensiveNLPAnalysis(decision);
    
    // Generate automatic summary if not already present
    const summary = decision.summary || nlpAnalysis.summary;
    
    // Extract topics if not already present
    const topics = decision.topics && decision.topics.length > 0 
      ? decision.topics 
      : nlpAnalysis.topics;
    
    // Extract entities
    const entities = nlpAnalysis.entities;
    
    // Classify importance if not already present
    const importance = decision.importance || nlpAnalysis.importance;
    
    // Generate practice implications if not already present
    const practiceImplications = decision.practiceImplications || 
      nlpAnalysis.practiceImplications;
    
    // Analyze sentiment
    const sentiment = nlpAnalysis.sentiment;
    
    // Extract key phrases
    const keyPhrases = nlpAnalysis.keyPhrases;
    
    // Calculate document coherence
    const coherence = nlpAnalysis.coherence;
    
    // Return enhanced decision
    return {
      ...decision,
      summary,
      topics,
      entities,
      importance,
      practiceImplications,
      sentiment,
      keyPhrases,
      coherence,
      nlpAnalysisTimestamp: nlpAnalysis.analysisTimestamp
    };
  });
}

/**
 * Filter court decisions based on lawyer preferences with enhanced criteria
 * @param {Array} decisions - Array of enhanced court decision objects
 * @param {Object} lawyer - Lawyer object with preferences
 * @returns {Array} Filtered decisions
 */
function filterDecisionsForLawyerEnhanced(decisions, lawyer) {
  return decisions.filter(decision => {
    // Filter by court level preference
    const courtLevelMatch = lawyer.preferences.courtLevels.includes(decision.court);
    
    // Filter by topic preference
    const topicMatch = lawyer.preferences.topics.some(topic => 
      decision.topics.includes(topic)
    );
    
    // Filter by importance (lawyers might want high importance decisions)
    const importanceMatch = decision.importance !== "low";
    
    // Filter by sentiment (some lawyers might prefer positive/negative decisions)
    const sentimentMatch = filterBySentiment(decision, lawyer);
    
    // Filter by coherence (more coherent decisions might be preferred)
    const coherenceMatch = decision.coherence > 0.3; // Minimum coherence threshold
    
    return courtLevelMatch && topicMatch && importanceMatch && sentimentMatch && coherenceMatch;
  });
}

/**
 * Filter decisions based on lawyer's sentiment preferences
 * @param {Object} decision - Court decision object
 * @param {Object} lawyer - Lawyer object
 * @returns {Boolean} Whether decision matches sentiment preferences
 */
function filterBySentiment(decision, lawyer) {
  // If lawyer has no sentiment preference, accept all
  if (!lawyer.preferences.sentiment || lawyer.preferences.sentiment === "any") {
    return true;
  }
  
  // Check if decision sentiment matches lawyer preference
  const decisionSentiment = decision.sentiment?.overall || "neutral";
  return decisionSentiment === lawyer.preferences.sentiment;
}

/**
 * Categorize decisions by court type (extended version)
 * @param {Array} decisions - Array of court decision objects
 * @returns {Object} Categorized decisions
 */
function categorizeDecisionsEnhanced(decisions) {
  const categorized = {
    bgh: [],
    constitutional: [],
    regional: [],
    local: [],
    other: []
  };
  
  decisions.forEach(decision => {
    if (decision.court === "Bundesgerichtshof") {
      categorized.bgh.push(decision);
    } else if (decision.court === "Bundesverfassungsgericht") {
      categorized.constitutional.push(decision);
    } else if (decision.court === "Landgericht") {
      categorized.regional.push(decision);
    } else if (decision.court === "Amtsgericht") {
      categorized.local.push(decision);
    } else {
      categorized.other.push(decision);
    }
  });
  
  return categorized;
}

/**
 * Generate enhanced HTML newsletter content for a lawyer
 * @param {Object} lawyer - Lawyer object
 * @param {Array} decisions - Filtered decisions for the lawyer
 * @returns {String} HTML email content
 */
function generateEnhancedNewsletter(lawyer, decisions) {
  const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const currentWeek = getWeekNumber(new Date());
  
  const categorizedDecisions = categorizeDecisionsEnhanced(decisions);
  
  // Generate personalized strategy recommendations
  const recommendations = generateRecommendations(
    { id: "newsletter_" + currentWeek, documents: decisions.map(d => ({ content: d.fullText })) },
    { id: lawyer.id, preferences: lawyer.preferences, history: [] },
    { id: "lawyer_" + lawyer.id, expertise: lawyer.expertise }
  );
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Erweiterte Mietrechts-Entscheidungen</title>
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
        .sentiment-positive { border-left-color: #2ecc71; }
        .sentiment-negative { border-left-color: #e74c3c; }
        .sentiment-neutral { border-left-color: #3498db; }
        .key-phrases { 
            background-color: #f0f8ff; 
            border-left: 4px solid #6495ed; 
            padding: 15px; 
            border-radius: 0 5px 5px 0;
            margin: 15px 0;
            font-size: 0.9em;
        }
        .recommendations { 
            background-color: #f5f5f5; 
            border-left: 4px solid #808080; 
            padding: 15px; 
            border-radius: 0 5px 5px 0;
            margin: 15px 0;
        }
        h1, h2, h3 { color: #2c3e50; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Erweiterte Mietrechts-Entscheidungen</h1>
        <p>Kalenderwoche ${currentWeek}, ${currentDate}</p>
        <p>Guten Tag ${lawyer.name},</p>
        <p>hier sind die relevanten Mietrechts-Entscheidungen für Ihre Praxis mit erweiterten Analysen:</p>
    </div>
  `;
  
  // Add strategy recommendations section
  if (recommendations.recommendations && recommendations.recommendations.length > 0) {
    html += `
    <div class="recommendations">
        <h2>🤖 Personalisierte Strategieempfehlungen</h2>
        <p><strong>Empfohlene Vorgehensweise:</strong> ${recommendations.overallStrategy}</p>
        <p><strong>Fallstärke:</strong> ${recommendations.caseStrength?.assessment || 'N/A'} (${Math.round((recommendations.caseStrength?.score || 0) * 100)}%)</p>
        <p><strong>Konfidenz:</strong> ${Math.round((recommendations.confidence || 0) * 100)}%</p>
        
        <h3>Detailierte Empfehlungen:</h3>
        <ul>
    `;
    
    recommendations.recommendations.slice(0, 5).forEach(rec => {
      html += `<li><strong>${rec.title}:</strong> ${rec.description}</li>`;
    });
    
    html += `
        </ul>
    </div>
    `;
  }
  
  // BGH Decisions Section
  if (categorizedDecisions.bgh.length > 0) {
    html += `
    <div class="section">
        <h2>📌 Neue BGH-Entscheidungen (${categorizedDecisions.bgh.length})</h2>
    `;
    
    categorizedDecisions.bgh.forEach(decision => {
      const importanceClass = `importance-${decision.importance}`;
      const sentimentClass = `sentiment-${decision.sentiment?.overall || 'neutral'}`;
      html += `
        <div class="decision ${importanceClass} ${sentimentClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Sentiment section -->
            <div class="entities">
                <strong>Sentiment-Analyse:</strong>
                Stimmung: ${decision.sentiment?.overall || 'N/A'} | 
                Polarität: ${decision.sentiment?.polarity?.toFixed(2) || 'N/A'} | 
                Konfidenz: ${Math.round((decision.sentiment?.confidence || 0) * 100)}%
            </div>
            
            <!-- Key phrases section -->
            ${decision.keyPhrases && decision.keyPhrases.length > 0 ? `
            <div class="key-phrases">
                <strong>Schlüsselbegriffe:</strong>
                ${decision.keyPhrases.map(phrase => 
                  `<span class="topic-tag">${phrase.phrase}</span>`
                ).join(' ')}
            </div>
            ` : ''}
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons_basic && decision.entities.persons_basic.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons_basic.join(', ')}` : ''}
                ${decision.entities.organizations_basic && decision.entities.organizations_basic.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations_basic.join(', ')}` : ''}
                ${decision.entities.locations_basic && decision.entities.locations_basic.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations_basic.join(', ')}` : ''}
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
      const sentimentClass = `sentiment-${decision.sentiment?.overall || 'neutral'}`;
      html += `
        <div class="decision ${importanceClass} ${sentimentClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Sentiment section -->
            <div class="entities">
                <strong>Sentiment-Analyse:</strong>
                Stimmung: ${decision.sentiment?.overall || 'N/A'} | 
                Polarität: ${decision.sentiment?.polarity?.toFixed(2) || 'N/A'} | 
                Konfidenz: ${Math.round((decision.sentiment?.confidence || 0) * 100)}%
            </div>
            
            <!-- Key phrases section -->
            ${decision.keyPhrases && decision.keyPhrases.length > 0 ? `
            <div class="key-phrases">
                <strong>Schlüsselbegriffe:</strong>
                ${decision.keyPhrases.map(phrase => 
                  `<span class="topic-tag">${phrase.phrase}</span>`
                ).join(' ')}
            </div>
            ` : ''}
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons_basic && decision.entities.persons_basic.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons_basic.join(', ')}` : ''}
                ${decision.entities.organizations_basic && decision.entities.organizations_basic.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations_basic.join(', ')}` : ''}
                ${decision.entities.locations_basic && decision.entities.locations_basic.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations_basic.join(', ')}` : ''}
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
      const sentimentClass = `sentiment-${decision.sentiment?.overall || 'neutral'}`;
      html += `
        <div class="decision ${importanceClass} ${sentimentClass}">
            <div class="court-name">${decision.court}, ${decision.location}</div>
            <div class="date">${formatDate(decision.decisionDate)} | <span class="case-number">${decision.caseNumber}</span></div>
            <h3>${decision.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${decision.summary}</p>
            <p><strong>Praktische Auswirkungen:</strong> ${decision.practiceImplications}</p>
            
            <!-- Sentiment section -->
            <div class="entities">
                <strong>Sentiment-Analyse:</strong>
                Stimmung: ${decision.sentiment?.overall || 'N/A'} | 
                Polarität: ${decision.sentiment?.polarity?.toFixed(2) || 'N/A'} | 
                Konfidenz: ${Math.round((decision.sentiment?.confidence || 0) * 100)}%
            </div>
            
            <!-- Key phrases section -->
            ${decision.keyPhrases && decision.keyPhrases.length > 0 ? `
            <div class="key-phrases">
                <strong>Schlüsselbegriffe:</strong>
                ${decision.keyPhrases.map(phrase => 
                  `<span class="topic-tag">${phrase.phrase}</span>`
                ).join(' ')}
            </div>
            ` : ''}
            
            <!-- Entities section -->
            <div class="entities">
                <strong>Beteiligte Personen/Organisationen:</strong>
                ${decision.entities.persons_basic && decision.entities.persons_basic.length > 0 ? 
                  `<br/>Personen: ${decision.entities.persons_basic.join(', ')}` : ''}
                ${decision.entities.organizations_basic && decision.entities.organizations_basic.length > 0 ? 
                  `<br/>Organisationen: ${decision.entities.organizations_basic.join(', ')}` : ''}
                ${decision.entities.locations_basic && decision.entities.locations_basic.length > 0 ? 
                  `<br/>Orte: ${decision.entities.locations_basic.join(', ')}` : ''}
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
        <p>Dieser Newsletter wird Ihnen vom erweiterten SmartLaw Mietrecht Agent gesendet.</p>
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
 * Main function to run the Enhanced Mietrecht Agent
 */
async function runEnhancedMietrechtAgent() {
  console.log("Starting Enhanced Mietrecht Agent with advanced KI/ML capabilities...");
  console.log(`Date: ${new Date().toLocaleString('de-DE')}`);
  
  try {
    // Fetch all court decisions
    console.log("Fetching court decisions...");
    const rawDecisions = await fetchAllCourtDecisions({
      query: "mietrecht",
      dateFrom: "2025-01-01"
    });
    
    console.log(`Fetched ${rawDecisions.length} raw decisions`);
    
    // Enhance decisions with advanced NLP analysis
    console.log("Enhancing decisions with advanced NLP analysis...");
    const enhancedDecisions = enhanceDecisionsWithAdvancedNLP(rawDecisions);
    
    console.log(`Enhanced ${enhancedDecisions.length} decisions with advanced NLP`);
    
    // Process each lawyer
    for (const lawyer of lawyers) {
      console.log(`\nProcessing updates for ${lawyer.name}...`);
      
      // Filter decisions for this lawyer
      const filteredDecisions = filterDecisionsForLawyerEnhanced(enhancedDecisions, lawyer);
      
      console.log(`  Found ${filteredDecisions.length} relevant court decisions`);
      
      // Generate newsletter content
      const newsletterContent = generateEnhancedNewsletter(lawyer, filteredDecisions);
      const emailSubject = `Erweiterte Mietrechts-Entscheidungen - Kalenderwoche ${getWeekNumber(new Date())}`;
      
      // Send email (simulated)
      sendEmail(lawyer, emailSubject, newsletterContent);
      
      // Log the activity
      console.log(`  Newsletter sent to ${lawyer.email}`);
    }
    
    console.log("\nEnhanced Mietrecht Agent completed successfully.");
  } catch (error) {
    console.error("Error running Enhanced Mietrecht Agent:", error.message);
    throw error;
  }
}

/**
 * Scheduler function to run the agent weekly
 */
function scheduleWeeklyAgent() {
  console.log("Enhanced Mietrecht Agent Scheduler started.");
  console.log("Next run: Every Monday at 8:00 AM");
  
  // For demonstration, we'll run it immediately
  runEnhancedMietrechtAgent();
  
  // In a real implementation, this would use a scheduler like:
  // cron.schedule('0 8 * * 1', runEnhancedMietrechtAgent); // Every Monday at 8:00 AM
}

// Run the scheduler if this script is executed directly
if (require.main === module) {
  scheduleWeeklyAgent();
}

// Export functions for testing
module.exports = {
  enhanceDecisionsWithAdvancedNLP,
  filterDecisionsForLawyerEnhanced,
  categorizeDecisionsEnhanced,
  generateEnhancedNewsletter,
  sendEmail,
  runEnhancedMietrechtAgent,
  scheduleWeeklyAgent,
  lawyers
};