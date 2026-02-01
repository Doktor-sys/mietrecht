/**
 * Case Analyzer for Mietrecht Agent
 * This module analyzes case-specific factors for personalized recommendations.
 */

const { advancedExtractTopics } = require('../nlp/advancedNLPProcessor.js');
const { extractNamedEntities } = require('../nlp/entityExtractor.js');
const { performTopicModeling } = require('../nlp/semanticAnalyzer.js');

/**
 * Analyze case-specific factors
 * @param {Object} caseData - Case data including documents and context
 * @returns {Object} Case analysis results
 */
function analyzeCase(caseData) {
  if (!caseData) {
    return createDefaultAnalysis();
  }
  
  // Analyze documents
  const documentAnalysis = analyzeCaseDocuments(caseData.documents || []);
  
  // Extract case factors
  const caseFactors = extractCaseFactors(caseData, documentAnalysis);
  
  // Assess case complexity
  const complexity = assessComplexity(caseData, documentAnalysis);
  
  // Identify key parties
  const parties = identifyParties(caseData, documentAnalysis);
  
  // Determine legal domain
  const legalDomain = determineLegalDomain(documentAnalysis);
  
  // Estimate case value
  const estimatedValue = estimateCaseValue(caseData, documentAnalysis);
  
  return {
    id: caseData.id || null,
    documentAnalysis,
    caseFactors,
    complexity,
    parties,
    legalDomain,
    estimatedValue,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create default case analysis
 * @returns {Object} Default case analysis
 */
function createDefaultAnalysis() {
  return {
    id: null,
    documentAnalysis: {
      topics: [],
      entities: {},
      keyIssues: []
    },
    caseFactors: {},
    complexity: {
      score: 0.5,
      level: "medium",
      factors: []
    },
    parties: {
      plaintiff: null,
      defendant: null,
      otherParties: []
    },
    legalDomain: "mietrecht",
    estimatedValue: 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyze case documents
 * @param {Array} documents - Array of case documents
 * @returns {Object} Document analysis results
 */
function analyzeCaseDocuments(documents) {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return {
      topics: [],
      entities: {},
      keyIssues: []
    };
  }
  
  // Combine all document texts for analysis
  const combinedText = documents.map(doc => doc.content || "").join(" ");
  
  // Extract topics
  const topics = advancedExtractTopics(combinedText);
  
  // Extract entities
  const entities = extractNamedEntities(combinedText);
  
  // Perform topic modeling
  const topicModeling = performTopicModeling(combinedText);
  
  // Identify key issues
  const keyIssues = identifyKeyIssues(topics, topicModeling);
  
  return {
    topics,
    entities,
    topicModeling,
    keyIssues
  };
}

/**
 * Identify key issues from topics and topic modeling
 * @param {Array} topics - Extracted topics
 * @param {Array} topicModeling - Topic modeling results
 * @returns {Array} Key issues
 */
function identifyKeyIssues(topics, topicModeling) {
  // Combine topics from both sources
  const allTopics = [
    ...(topics || []).map(t => ({ name: t.topic, weight: t.weight })),
    ...(topicModeling || [])
  ];
  
  // Sort by weight and take top issues
  return allTopics
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(topic => topic.name);
}

/**
 * Extract case factors
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Object} Case factors
 */
function extractCaseFactors(caseData, documentAnalysis) {
  return {
    caseType: caseData.type || "unknown",
    jurisdiction: caseData.jurisdiction || "unknown",
    filingDate: caseData.filingDate || null,
    deadline: caseData.deadline || null,
    keyIssues: documentAnalysis.keyIssues || [],
    legalReferences: extractLegalReferences(documentAnalysis),
    proceduralStage: caseData.proceduralStage || "initial",
    urgency: assessUrgency(caseData, documentAnalysis)
  };
}

/**
 * Extract legal references from document analysis
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Array} Legal references
 */
function extractLegalReferences(documentAnalysis) {
  const entities = documentAnalysis.entities || {};
  const legalReferences = entities.legalReferences || [];
  
  return legalReferences.map(ref => ref.reference);
}

/**
 * Assess case urgency
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {String} Urgency level
 */
function assessUrgency(caseData, documentAnalysis) {
  // Check for explicit deadline
  if (caseData.deadline) {
    const deadline = new Date(caseData.deadline);
    const daysUntilDeadline = (deadline - new Date()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline < 7) {
      return "high";
    } else if (daysUntilDeadline < 30) {
      return "medium";
    }
  }
  
  // Check for urgent keywords in documents
  const combinedText = (documentAnalysis.entities || {}).legalReferences
    ?.map(ref => ref.context || "")
    .join(" ")
    .toLowerCase() || "";
  
  if (combinedText.includes("dringend") || combinedText.includes("sofort")) {
    return "high";
  }
  
  return "low";
}

/**
 * Assess case complexity
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Object} Complexity assessment
 */
function assessComplexity(caseData, documentAnalysis) {
  let score = 0.5; // Baseline complexity
  const factors = [];
  
  // Factor 1: Number of key issues
  const keyIssuesCount = (documentAnalysis.keyIssues || []).length;
  if (keyIssuesCount > 5) {
    score += 0.2;
    factors.push("Multiple key issues");
  } else if (keyIssuesCount > 3) {
    score += 0.1;
    factors.push("Several key issues");
  }
  
  // Factor 2: Number of parties
  const partiesCount = Object.keys(caseData.parties || {}).length;
  if (partiesCount > 3) {
    score += 0.15;
    factors.push("Multiple parties involved");
  }
  
  // Factor 3: Legal domain complexity
  const legalDomain = determineLegalDomain(documentAnalysis);
  if (legalDomain === "complex") {
    score += 0.1;
    factors.push("Complex legal domain");
  }
  
  // Factor 4: Procedural stage
  if (caseData.proceduralStage === "appeal") {
    score += 0.15;
    factors.push("Appeal stage");
  } else if (caseData.proceduralStage === "trial") {
    score += 0.1;
    factors.push("Trial stage");
  }
  
  // Determine complexity level
  let level = "medium";
  if (score > 0.7) {
    level = "high";
  } else if (score < 0.3) {
    level = "low";
  }
  
  return {
    score: Math.min(score, 1.0), // Cap at 1.0
    level,
    factors
  };
}

/**
 * Identify parties in the case
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Object} Parties information
 */
function identifyParties(caseData, documentAnalysis) {
  // Start with explicitly defined parties
  const parties = {
    plaintiff: caseData.plaintiff || null,
    defendant: caseData.defendant || null,
    otherParties: caseData.otherParties || []
  };
  
  // Extract parties from document analysis if not explicitly defined
  if (!parties.plaintiff || !parties.defendant) {
    const entities = documentAnalysis.entities || {};
    const persons = entities.persons || [];
    const organizations = entities.organizations || [];
    
    // If we don't have explicit parties, use the first few entities
    if (!parties.plaintiff && persons.length > 0) {
      parties.plaintiff = persons[0].name;
    }
    
    if (!parties.defendant && persons.length > 1) {
      parties.defendant = persons[1].name;
    }
    
    // Add organizations as other parties
    parties.otherParties = [
      ...parties.otherParties,
      ...organizations.map(org => org.name)
    ];
  }
  
  return parties;
}

/**
 * Determine legal domain
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {String} Legal domain
 */
function determineLegalDomain(documentAnalysis) {
  const keyIssues = documentAnalysis.keyIssues || [];
  
  // Check for complex legal domains
  const complexDomains = [
    "Verfassungsrecht",
    "Europarecht",
    "Steuerrecht",
    "Wettbewerbsrecht"
  ];
  
  const hasComplexDomain = keyIssues.some(issue => 
    complexDomains.some(domain => issue.includes(domain))
  );
  
  if (hasComplexDomain) {
    return "complex";
  }
  
  // Check for standard mietrecht issues
  const standardIssues = [
    "Mietminderung",
    "Kündigung",
    "Nebenkosten",
    "Modernisierung"
  ];
  
  const hasStandardIssues = keyIssues.some(issue => 
    standardIssues.some(stdIssue => issue.includes(stdIssue))
  );
  
  if (hasStandardIssues) {
    return "mietrecht";
  }
  
  return "other";
}

/**
 * Estimate case value
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Number} Estimated case value
 */
function estimateCaseValue(caseData, documentAnalysis) {
  // If explicitly set, use that
  if (caseData.estimatedValue) {
    return caseData.estimatedValue;
  }
  
  // Otherwise, try to estimate from document content
  const keyIssues = documentAnalysis.keyIssues || [];
  const combinedText = (documentAnalysis.entities || {}).legalReferences
    ?.map(ref => ref.context || "")
    .join(" ") || "";
  
  // Simple heuristics for value estimation
  let estimatedValue = 0;
  
  // Check for monetary amounts in document context
  const amountMatches = combinedText.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:€|\bEuro\b)/gi);
  if (amountMatches) {
    // Take the highest amount mentioned
    const amounts = amountMatches.map(match => {
      // Remove currency symbols and convert to number
      return parseFloat(match.replace(/[^\d,]/g, '').replace(',', '.'));
    });
    
    estimatedValue = Math.max(...amounts);
  }
  
  // Adjust based on key issues
  if (keyIssues.includes("Kündigung")) {
    estimatedValue += 5000; // Average potential rent damages
  }
  
  if (keyIssues.includes("Modernisierung")) {
    estimatedValue += 3000; // Average modernization costs
  }
  
  return Math.round(estimatedValue);
}

// Export functions
module.exports = {
  analyzeCase,
  createDefaultAnalysis
};