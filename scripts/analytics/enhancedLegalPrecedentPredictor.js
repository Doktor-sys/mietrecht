/**
 * Enhanced Legal Precedent Predictor Module
 * This module extends the existing predictive modeling capabilities with advanced ML techniques.
 */

// Import existing functions
const {
  calculateDecisionSimilarity: basicCalculateDecisionSimilarity,
  predictDecisionImportance: basicPredictDecisionImportance,
  predictPracticeImplications: basicPredictPracticeImplications,
  findSimilarDecisions: basicFindSimilarDecisions,
  generatePredictiveAnalysis: basicGeneratePredictiveAnalysis,
  getTopicTrendPredictions: basicGetTopicTrendPredictions,
  performPredictiveAnalysis: basicPerformPredictiveAnalysis
} = require('./legalPrecedentPredictor.js');

// Import database functions
const { getAllCourtDecisions, getRecentCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { recordMetric } = require('../database/dao/dashboardMetricsDao.js');

// Import enhanced NLP processor
const {
  summarizeDecision,
  extractTopics,
  extractEntities,
  analyzeSentimentEnhanced,
  extractKeyPhrasesFromText,
  comprehensiveNLPAnalysis
} = require('../nlp/enhancedNLPProcessor.js');

// Import strategy recommender
const { generateStrategyRecommendations } = require('../ml/strategyRecommender.js');

// Import case analyzer
const { analyzeCase } = require('../ml/caseAnalyzer.js');

// Import recommendation engine
const { generateRecommendations: generateMLRecommendations } = require('../ml/recommendationEngine.js');

/**
 * Enhanced calculation of similarity between two decisions using advanced techniques
 * @param {Object} decision1 - First court decision
 * @param {Object} decision2 - Second court decision
 * @param {String} method - Similarity method ('basic', 'semantic', 'comprehensive')
 * @returns {number} Enhanced similarity score between 0 and 1
 */
function calculateEnhancedDecisionSimilarity(decision1, decision2, method = 'comprehensive') {
  switch (method) {
    case 'basic':
      return basicCalculateDecisionSimilarity(decision1, decision2);
    case 'semantic':
      // Use semantic similarity based on full text
      const text1 = decision1.fullText || "";
      const text2 = decision2.fullText || "";
      // This would be implemented with actual semantic similarity functions
      return semanticTextSimilarity(text1, text2);
    case 'comprehensive':
    default:
      // Comprehensive similarity considering multiple factors
      return calculateComprehensiveSimilarity(decision1, decision2);
  }
}

/**
 * Calculate semantic similarity between two texts
 * @param {String} text1 - First text
 * @param {String} text2 - Second text
 * @returns {number} Semantic similarity score
 */
function semanticTextSimilarity(text1, text2) {
  // In a real implementation, this would use word embeddings or other semantic techniques
  // For now, we'll use a placeholder implementation
  
  if (!text1 || !text2) return 0;
  
  // Simple approach: combine basic similarity with NLP analysis
  const basicSimilarity = basicCalculateDecisionSimilarity(
    { topics: extractTopics(text1), court: "court1" },
    { topics: extractTopics(text2), court: "court2" }
  );
  
  // Extract key phrases for additional similarity measure
  const phrases1 = extractKeyPhrasesFromText(text1);
  const phrases2 = extractKeyPhrasesFromText(text2);
  
  // Calculate phrase similarity
  const commonPhrases = phrases1.filter(p1 => 
    phrases2.some(p2 => p1.phrase === p2.phrase)
  ).length;
  
  const phraseSimilarity = (phrases1.length > 0 && phrases2.length > 0) ? 
    commonPhrases / Math.max(phrases1.length, phrases2.length) : 0;
  
  // Combine similarities (weighted average)
  return 0.7 * basicSimilarity + 0.3 * phraseSimilarity;
}

/**
 * Calculate comprehensive similarity considering multiple factors
 * @param {Object} decision1 - First court decision
 * @param {Object} decision2 - Second court decision
 * @returns {number} Comprehensive similarity score
 */
function calculateComprehensiveSimilarity(decision1, decision2) {
  // Topic similarity (weight: 0.3)
  const topicSimilarity = basicCalculateDecisionSimilarity(decision1, decision2);
  
  // Court similarity (weight: 0.2)
  let courtSimilarity = 0;
  if (decision1.court === decision2.court) {
    courtSimilarity = 1;
  } else if (decision1.court && decision2.court) {
    // Simplified court level matching
    const isHigherCourt1 = decision1.court.includes('Bundes') || decision1.court.includes('Oberlandesgericht');
    const isHigherCourt2 = decision2.court.includes('Bundes') || decision2.court.includes('Oberlandesgericht');
    if (isHigherCourt1 === isHigherCourt2) {
      courtSimilarity = 0.5;
    }
  }
  
  // Text similarity (weight: 0.3)
  const text1 = decision1.fullText || "";
  const text2 = decision2.fullText || "";
  const textSimilarity = semanticTextSimilarity(text1, text2);
  
  // Entity similarity (weight: 0.2)
  let entitySimilarity = 0;
  if (text1 && text2) {
    const entities1 = extractEntities(text1);
    const entities2 = extractEntities(text2);
    
    // Calculate similarity based on common entities
    const persons1 = new Set(entities1.persons || []);
    const persons2 = new Set(entities2.persons || []);
    const commonPersons = [...persons1].filter(person => persons2.has(person)).length;
    const personSimilarity = (persons1.size > 0 && persons2.size > 0) ? 
      commonPersons / Math.max(persons1.size, persons2.size) : 0;
    
    const orgs1 = new Set(entities1.organizations || []);
    const orgs2 = new Set(entities2.organizations || []);
    const commonOrgs = [...orgs1].filter(org => orgs2.has(org)).length;
    const orgSimilarity = (orgs1.size > 0 && orgs2.size > 0) ? 
      commonOrgs / Math.max(orgs1.size, orgs2.size) : 0;
    
    entitySimilarity = 0.5 * personSimilarity + 0.5 * orgSimilarity;
  }
  
  // Weighted combination
  return 0.3 * topicSimilarity + 0.2 * courtSimilarity + 0.3 * textSimilarity + 0.2 * entitySimilarity;
}

/**
 * Enhanced prediction of decision importance using ML techniques
 * @param {Object} newDecision - New court decision to predict importance for
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Enhanced prediction results
 */
function predictEnhancedDecisionImportance(newDecision, similarDecisions) {
  // Get basic prediction
  const basicPrediction = basicPredictDecisionImportance(newDecision, similarDecisions);
  
  // Enhance with additional factors
  const text = newDecision.fullText || "";
  
  // Analyze sentiment as an additional factor
  const sentiment = analyzeSentimentEnhanced(text);
  
  // Extract key phrases to identify important concepts
  const keyPhrases = extractKeyPhrasesFromText(text);
  
  // Check for high-importance indicators in key phrases
  const highImportanceIndicators = [
    "Verfassungsrecht", "Grundgesetz", "Europarecht", 
    "europäische richtlinie", "verfassungswidrig"
  ];
  
  const hasHighImportanceIndicator = keyPhrases.some(phrase => 
    highImportanceIndicators.some(indicator => 
      phrase.phrase.toLowerCase().includes(indicator.toLowerCase())
    )
  );
  
  // Adjust confidence based on additional factors
  let enhancedConfidence = basicPrediction.confidence;
  
  if (hasHighImportanceIndicator) {
    // Increase confidence for high-importance indicators
    enhancedConfidence = Math.min(1, enhancedConfidence + 0.1);
  }
  
  if (sentiment.polarity > 0.5) {
    // Positive sentiment might indicate important precedent
    enhancedConfidence = Math.min(1, enhancedConfidence + 0.05);
  }
  
  return {
    ...basicPrediction,
    enhancedConfidence,
    sentimentFactor: sentiment,
    keyPhrases: keyPhrases.slice(0, 5), // Top 5 key phrases
    hasHighImportanceIndicator
  };
}

/**
 * Enhanced prediction of practice implications using advanced NLP
 * @param {Object} newDecision - New court decision
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Enhanced practice implications prediction
 */
function predictEnhancedPracticeImplications(newDecision, similarDecisions) {
  // Get basic prediction
  const basicPrediction = basicPredictPracticeImplications(newDecision, similarDecisions);
  
  // Enhance with sentiment analysis
  const text = newDecision.fullText || "";
  const sentiment = analyzeSentimentEnhanced(text);
  
  // Extract key phrases for more detailed implications
  const keyPhrases = extractKeyPhrasesFromText(text);
  
  return {
    ...basicPrediction,
    sentimentAnalysis: sentiment,
    keyPhrases: keyPhrases.slice(0, 5), // Top 5 key phrases
    enhancedImplications: generateEnhancedImplications(newDecision, similarDecisions)
  };
}

/**
 * Generate enhanced practice implications based on comprehensive analysis
 * @param {Object} newDecision - New court decision
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Array} Enhanced practice implications
 */
function generateEnhancedImplications(newDecision, similarDecisions) {
  if (similarDecisions.length === 0) {
    return [];
  }
  
  // Analyze the new decision
  const text = newDecision.fullText || "";
  const nlpAnalysis = comprehensiveNLPAnalysis(newDecision);
  
  // Extract implications from similar decisions with higher precision
  const implicationScores = {};
  
  similarDecisions.forEach(decision => {
    if (decision.practice_implications) {
      // Split implications by common separators
      const implications = decision.practice_implications
        .split(/[.;!?]+/)
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0);
      
      implications.forEach(implication => {
        // Score implications based on relevance to new decision
        const score = scoreImplicationRelevance(implication, nlpAnalysis);
        
        if (!implicationScores[implication]) {
          implicationScores[implication] = { score: 0, count: 0 };
        }
        
        implicationScores[implication].score += score;
        implicationScores[implication].count += 1;
      });
    }
  });
  
  // Calculate average scores and filter high-scoring implications
  const enhancedImplications = Object.entries(implicationScores)
    .map(([implication, data]) => ({
      implication,
      averageScore: data.score / data.count,
      frequency: data.count / similarDecisions.length
    }))
    .filter(item => item.averageScore > 0.5 && item.frequency > 0.2) // Thresholds for relevance
    .sort((a, b) => b.averageScore - a.averageScore) // Sort by score
    .slice(0, 5) // Top 5 implications
    .map(item => item.implication);
  
  return enhancedImplications;
}

/**
 * Score relevance of an implication to a decision based on NLP analysis
 * @param {String} implication - Practice implication
 * @param {Object} nlpAnalysis - NLP analysis of the decision
 * @returns {Number} Relevance score (0-1)
 */
function scoreImplicationRelevance(implication, nlpAnalysis) {
  // Simple scoring based on overlap with decision topics and key phrases
  const implicationLower = implication.toLowerCase();
  
  // Score based on topic matches
  let topicScore = 0;
  if (nlpAnalysis.topics) {
    topicScore = nlpAnalysis.topics.filter(topic => 
      implicationLower.includes(topic.toLowerCase())
    ).length / nlpAnalysis.topics.length;
  }
  
  // Score based on key phrase matches
  let phraseScore = 0;
  if (nlpAnalysis.keyPhrases) {
    phraseScore = nlpAnalysis.keyPhrases.filter(phraseObj => 
      implicationLower.includes(phraseObj.phrase.toLowerCase())
    ).length / Math.max(nlpAnalysis.keyPhrases.length, 1);
  }
  
  // Combined score (weighted average)
  return 0.6 * topicScore + 0.4 * phraseScore;
}

/**
 * Enhanced finding of similar decisions using advanced techniques
 * @param {Object} targetDecision - Decision to find similar ones for
 * @param {Array} allDecisions - Array of all decisions to compare against
 * @param {number} limit - Maximum number of similar decisions to return
 * @param {String} method - Similarity method ('basic', 'enhanced')
 * @returns {Array} Array of similar decisions with similarity scores
 */
function findEnhancedSimilarDecisions(targetDecision, allDecisions, limit = 10, method = 'enhanced') {
  switch (method) {
    case 'basic':
      return basicFindSimilarDecisions(targetDecision, allDecisions, limit);
    case 'enhanced':
    default:
      // Calculate similarity scores for all decisions
      const similarities = allDecisions
        .filter(decision => decision.id !== targetDecision.id) // Exclude the target decision itself
        .map(decision => ({
          decision,
          similarity: calculateEnhancedDecisionSimilarity(targetDecision, decision)
        }))
        .filter(item => item.similarity > 0.1) // Only consider decisions with some similarity
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
        .slice(0, limit); // Take top N
      
      return similarities;
  }
}

/**
 * Generate enhanced predictive analysis report for a decision
 * @param {Object} decision - Court decision to analyze
 * @returns {Promise<Object>} Enhanced predictive analysis report
 */
async function generateEnhancedPredictiveAnalysis(decision) {
  try {
    // Get all decisions for comparison
    const allDecisions = await getAllCourtDecisions({ limit: 1000 });
    
    // Find similar decisions using enhanced techniques
    const similarDecisions = findEnhancedSimilarDecisions(decision, allDecisions, 20);
    const similarDecisionObjects = similarDecisions.map(item => item.decision);
    
    // Predict importance using enhanced techniques
    const importancePrediction = predictEnhancedDecisionImportance(decision, similarDecisionObjects);
    
    // Predict practice implications using enhanced techniques
    const implicationsPrediction = predictEnhancedPracticeImplications(decision, similarDecisionObjects);
    
    // Calculate average similarity
    const avgSimilarity = similarDecisions.length > 0 
      ? similarDecisions.reduce((sum, item) => sum + item.similarity, 0) / similarDecisions.length
      : 0;
    
    // Perform comprehensive NLP analysis
    const nlpAnalysis = comprehensiveNLPAnalysis(decision);
    
    // Generate strategy recommendations
    const strategyRecommendations = generateStrategyRecommendations(
      { id: decision.id, documents: [{ content: decision.fullText }] },
      { riskTolerance: "medium" },
      { expertise: ["mietrecht"] }
    );
    
    // Record metrics
    await recordMetric('enhanced_prediction_confidence', (importancePrediction.enhancedConfidence + implicationsPrediction.confidence) / 2);
    await recordMetric('enhanced_similar_decisions_found', similarDecisions.length);
    
    return {
      decisionId: decision.id,
      decisionInfo: {
        court: decision.court,
        topics: decision.topics,
        decisionDate: decision.decision_date
      },
      similarityAnalysis: {
        similarDecisions: similarDecisions.length,
        averageSimilarity: avgSimilarity,
        topSimilarDecisions: similarDecisions.slice(0, 5).map(item => ({
          decisionId: item.decision.id,
          court: item.decision.court,
          topics: item.decision.topics,
          similarity: item.similarity
        }))
      },
      importancePrediction,
      implicationsPrediction,
      nlpAnalysis,
      strategyRecommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating enhanced predictive analysis:', error);
    throw error;
  }
}

/**
 * Get enhanced topic trend predictions
 * @returns {Promise<Object>} Enhanced topic trend predictions
 */
async function getEnhancedTopicTrendPredictions() {
  try {
    // Get basic trend predictions
    const basicTrends = await basicGetTopicTrendPredictions();
    
    // Enhance with additional analysis
    // For example, we could analyze sentiment trends or other factors
    
    return {
      ...basicTrends,
      enhancedAnalysis: {
        // Additional enhanced trend analysis could go here
        analysisMethod: "enhanced",
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting enhanced topic trend predictions:', error);
    throw error;
  }
}

/**
 * Perform comprehensive enhanced predictive analysis
 * @returns {Promise<Object>} Comprehensive enhanced predictive analysis
 */
async function performEnhancedPredictiveAnalysis() {
  try {
    console.log('Performing enhanced predictive analysis...');
    
    // Get enhanced topic trend predictions
    const topicTrends = await getEnhancedTopicTrendPredictions();
    
    console.log('Enhanced predictive analysis completed');
    
    return {
      topicTrends,
      analysisType: "enhanced",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing enhanced predictive analysis:', error);
    throw error;
  }
}

// Export enhanced functions
module.exports = {
  calculateEnhancedDecisionSimilarity,
  predictEnhancedDecisionImportance,
  predictEnhancedPracticeImplications,
  findEnhancedSimilarDecisions,
  generateEnhancedPredictiveAnalysis,
  getEnhancedTopicTrendPredictions,
  performEnhancedPredictiveAnalysis,
  
  // Backward compatibility
  basicCalculateDecisionSimilarity: calculateDecisionSimilarity,
  basicPredictDecisionImportance: predictDecisionImportance,
  basicPredictPracticeImplications: predictPracticeImplications,
  basicFindSimilarDecisions: findSimilarDecisions,
  basicGeneratePredictiveAnalysis: generatePredictiveAnalysis,
  basicGetTopicTrendPredictions: getTopicTrendPredictions,
  basicPerformPredictiveAnalysis: performPredictiveAnalysis
};