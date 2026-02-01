/**
 * Enhanced NLP Processor for Mietrecht Agent
 * This module integrates both the existing NLP functions and the new advanced NLP capabilities.
 */

// Import existing NLP functions
const {
  summarizeDecision: basicSummarizeDecision,
  extractTopics: basicExtractTopics,
  extractEntities: basicExtractEntities,
  classifyImportance: basicClassifyImportance,
  generatePracticeImplications: basicGeneratePracticeImplications,
  compareDecisions: basicCompareDecisions
} = require('./nlp_processor.js');

// Import advanced NLP functions
const {
  advancedSummarizeDecision,
  advancedExtractTopics,
  advancedExtractEntities,
  analyzeSentiment,
  calculateSemanticSimilarity
} = require('./advancedNLPProcessor.js');

// Import entity extractor
const { extractNamedEntities } = require('./entityExtractor.js');

// Import sentiment analyzer
const { analyzeSentiment: advancedAnalyzeSentiment } = require('./sentimentAnalyzer.js');

// Import semantic analyzer
const {
  extractKeyPhrases,
  performTopicModeling,
  calculateCoherence
} = require('./semanticAnalyzer.js');

// Import document summarizer
const {
  extractiveSummarize,
  hierarchicalSummarize
} = require('./documentSummarizer.js');

/**
 * Enhanced decision summarization using both basic and advanced techniques
 * @param {String} text - Full text of the court decision
 * @param {String} method - Summarization method ('basic', 'advanced', 'extractive', 'hierarchical')
 * @returns {String} Summary of the decision
 */
function summarizeDecision(text, method = 'advanced') {
  switch (method) {
    case 'basic':
      return basicSummarizeDecision(text);
    case 'extractive':
      return extractiveSummarize(text);
    case 'hierarchical':
      const hierarchicalResult = hierarchicalSummarize(text);
      return hierarchicalResult.executiveSummary;
    case 'advanced':
    default:
      return advancedSummarizeDecision(text);
  }
}

/**
 * Enhanced topic extraction using both basic and advanced techniques
 * @param {String} text - Full text of the court decision
 * @param {String} method - Extraction method ('basic', 'advanced', 'topicModeling')
 * @returns {Array} Array of key topics
 */
function extractTopics(text, method = 'advanced') {
  switch (method) {
    case 'basic':
      return basicExtractTopics(text);
    case 'topicModeling':
      return performTopicModeling(text).map(topic => topic.name);
    case 'advanced':
    default:
      return advancedExtractTopics(text).map(topic => topic.topic);
  }
}

/**
 * Enhanced entity extraction using both basic and advanced techniques
 * @param {String} text - Full text of the court decision
 * @param {String} method - Extraction method ('basic', 'advanced', 'namedEntities')
 * @returns {Object} Object containing arrays of entities
 */
function extractEntities(text, method = 'advanced') {
  switch (method) {
    case 'basic':
      return basicExtractEntities(text);
    case 'namedEntities':
      return extractNamedEntities(text);
    case 'advanced':
    default:
      const advancedEntities = advancedExtractEntities(text);
      return {
        persons: advancedEntities.persons.map(p => p.entity),
        organizations: advancedEntities.organizations.map(o => o.entity),
        locations: advancedEntities.locations.map(l => l.entity),
        legalTerms: advancedEntities.legalTerms.map(l => l.entity),
        // Convert basic format for compatibility
        persons_basic: advancedEntities.persons.map(p => p.entity),
        organizations_basic: advancedEntities.organizations.map(o => o.entity),
        locations_basic: advancedEntities.locations.map(l => l.entity)
      };
  }
}

/**
 * Enhanced importance classification using both basic and advanced techniques
 * @param {Object} decision - Court decision object
 * @returns {String} Importance level (high, medium, low)
 */
function classifyImportance(decision) {
  // For now, use the existing basic implementation
  // In the future, this could be enhanced with ML models
  return basicClassifyImportance(decision);
}

/**
 * Enhanced practice implications generation using both basic and advanced techniques
 * @param {String} text - Full text of the court decision
 * @returns {String} Practice implications
 */
function generatePracticeImplications(text) {
  // For now, use the existing basic implementation
  // In the future, this could be enhanced with advanced NLP
  return basicGeneratePracticeImplications(text);
}

/**
 * Enhanced decision comparison using both basic and advanced techniques
 * @param {Object} decision1 - First court decision
 * @param {Object} decision2 - Second court decision
 * @param {String} method - Comparison method ('basic', 'semantic')
 * @returns {Number} Similarity score (0-1)
 */
function compareDecisions(decision1, decision2, method = 'semantic') {
  switch (method) {
    case 'basic':
      return basicCompareDecisions(decision1, decision2);
    case 'semantic':
    default:
      // Use semantic similarity for enhanced comparison
      const text1 = decision1.fullText || "";
      const text2 = decision2.fullText || "";
      return calculateSemanticSimilarity(text1, text2);
  }
}

/**
 * Analyze sentiment of a court decision
 * @param {String} text - Full text of the court decision
 * @param {String} method - Analysis method ('basic', 'advanced')
 * @returns {Object} Sentiment analysis results
 */
function analyzeSentimentEnhanced(text, method = 'advanced') {
  switch (method) {
    case 'basic':
      // Basic sentiment analysis could be implemented here
      return {
        sentiment: "neutral",
        confidence: 0,
        polarity: 0
      };
    case 'advanced':
    default:
      return advancedAnalyzeSentiment(text);
  }
}

/**
 * Extract key phrases from a court decision
 * @param {String} text - Full text of the court decision
 * @returns {Array} Array of key phrases
 */
function extractKeyPhrasesFromText(text) {
  return extractKeyPhrases(text);
}

/**
 * Calculate document coherence
 * @param {String} text - Full text of the court decision
 * @returns {Number} Coherence score (0-1)
 */
function calculateDocumentCoherence(text) {
  return calculateCoherence(text);
}

/**
 * Perform comprehensive NLP analysis on a court decision
 * @param {Object} decision - Court decision object
 * @returns {Object} Comprehensive NLP analysis results
 */
function comprehensiveNLPAnalysis(decision) {
  const text = decision.fullText || "";
  
  return {
    // Basic analysis
    summary: summarizeDecision(text),
    topics: extractTopics(text),
    entities: extractEntities(text),
    importance: classifyImportance(decision),
    practiceImplications: generatePracticeImplications(text),
    
    // Advanced analysis
    advancedSummary: summarizeDecision(text, 'hierarchical'),
    sentiment: analyzeSentimentEnhanced(text),
    keyPhrases: extractKeyPhrasesFromText(text),
    coherence: calculateDocumentCoherence(text),
    
    // Metadata
    analysisTimestamp: new Date().toISOString(),
    decisionId: decision.id
  };
}

// Export all functions
module.exports = {
  // Enhanced functions
  summarizeDecision,
  extractTopics,
  extractEntities,
  classifyImportance,
  generatePracticeImplications,
  compareDecisions,
  analyzeSentimentEnhanced,
  extractKeyPhrasesFromText,
  calculateDocumentCoherence,
  comprehensiveNLPAnalysis,
  
  // Backward compatibility
  basicSummarizeDecision,
  basicExtractTopics,
  basicExtractEntities,
  basicClassifyImportance,
  basicGeneratePracticeImplications,
  basicCompareDecisions
};