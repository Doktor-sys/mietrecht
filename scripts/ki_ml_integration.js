/**
 * KI/ML Integration Module for SmartLaw Mietrecht
 * This module provides a unified interface for all advanced AI/ML capabilities.
 */

// Import enhanced modules
const { comprehensiveNLPAnalysis } = require('./nlp/enhancedNLPProcessor.js');
const { generateEnhancedPredictiveAnalysis } = require('./analytics/enhancedLegalPrecedentPredictor.js');
const { generateRecommendations } = require('./ml/recommendationEngine.js');
const { createClientProfile } = require('./ml/clientProfiler.js');
const { analyzeCase } = require('./ml/caseAnalyzer.js');
// Import new enhanced modules
const { assessEnhancedCaseRisk } = require('./ml/advancedRiskAssessment.js');
const { generateEnhancedStrategyRecommendations } = require('./ml/enhancedStrategyRecommendations.js');
const { summarizeLegalDocument, compareLegalDocuments } = require('./nlp/documentSummarizer.js');

/**
 * Perform comprehensive AI analysis on a court decision
 * @param {Object} decision - Court decision object
 * @returns {Promise<Object>} Comprehensive AI analysis results
 */
async function analyzeCourtDecision(decision) {
  try {
    // Perform NLP analysis
    const nlpAnalysis = comprehensiveNLPAnalysis(decision);
    
    // Perform predictive analysis
    const predictiveAnalysis = await generateEnhancedPredictiveAnalysis(decision);
    
    // Combine results
    return {
      decisionId: decision.id,
      nlpAnalysis,
      predictiveAnalysis,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in comprehensive AI analysis:', error);
    throw error;
  }
}

/**
 * Generate personalized legal recommendations for a case
 * @param {Object} caseData - Case data including documents and context
 * @param {Object} clientData - Client data including history and preferences
 * @param {Object} lawyerData - Lawyer data including expertise and experience
 * @returns {Promise<Object>} Personalized legal recommendations
 */
async function generatePersonalizedRecommendations(caseData, clientData, lawyerData) {
  try {
    // Create client profile
    const clientProfile = createClientProfile(clientData);
    
    // Analyze case
    const caseAnalysis = analyzeCase(caseData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(caseData, clientData, lawyerData);
    
    // Combine results
    return {
      caseId: caseData.id,
      clientId: clientData.id,
      lawyerId: lawyerData.id,
      clientProfile,
      caseAnalysis,
      recommendations,
      generationTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    throw error;
  }
}

/**
 * Analyze multiple court decisions for trend detection
 * @param {Array} decisions - Array of court decisions
 * @returns {Promise<Object>} Trend analysis results
 */
async function analyzeTrends(decisions) {
  try {
    // Extract topics from all decisions
    const allTopics = [];
    const topicFrequency = {};
    
    decisions.forEach(decision => {
      const text = decision.fullText || "";
      const nlpAnalysis = comprehensiveNLPAnalysis(decision);
      
      // Collect topics
      if (nlpAnalysis.topics) {
        nlpAnalysis.topics.forEach(topic => {
          allTopics.push(topic);
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        });
      }
    });
    
    // Identify hot topics (most frequent)
    const hotTopics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, frequency]) => ({ topic, frequency }));
    
    // Analyze sentiment trends
    const sentimentAnalysis = analyzeSentimentTrends(decisions);
    
    return {
      totalDecisions: decisions.length,
      hotTopics,
      sentimentTrends: sentimentAnalysis,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in trend analysis:', error);
    throw error;
  }
}

/**
 * Analyze sentiment trends across multiple decisions
 * @param {Array} decisions - Array of court decisions
 * @returns {Object} Sentiment trend analysis
 */
function analyzeSentimentTrends(decisions) {
  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };
  
  decisions.forEach(decision => {
    const text = decision.fullText || "";
    // In a real implementation, we would import the sentiment analyzer
    // For now, we'll use a placeholder
    const sentiment = "neutral"; // Placeholder
    sentimentCounts[sentiment]++;
  });
  
  const total = decisions.length;
  return {
    positive: total > 0 ? sentimentCounts.positive / total : 0,
    negative: total > 0 ? sentimentCounts.negative / total : 0,
    neutral: total > 0 ? sentimentCounts.neutral / total : 0,
    totalDecisions: total
  };
}

/**
 * Risk assessment for a legal case
 * @param {Object} caseData - Case data
 * @param {Object} clientData - Client data
 * @returns {Promise<Object>} Risk assessment results
 */
async function assessCaseRisk(caseData, clientData) {
  try {
    // Analyze case
    const caseAnalysis = analyzeCase(caseData);
    
    // Create client profile
    const clientProfile = createClientProfile(clientData);
    
    // Calculate risk score (simplified implementation)
    const riskScore = calculateRiskScore(caseAnalysis, clientProfile);
    
    // Determine risk level
    let riskLevel = "medium";
    if (riskScore > 0.7) {
      riskLevel = "high";
    } else if (riskScore < 0.3) {
      riskLevel = "low";
    }
    
    return {
      caseId: caseData.id,
      clientId: clientData.id,
      riskScore,
      riskLevel,
      caseAnalysis,
      clientProfile,
      assessmentTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in risk assessment:', error);
    throw error;
  }
}

/**
 * Calculate risk score based on case analysis and client profile
 * @param {Object} caseAnalysis - Case analysis results
 * @param {Object} clientProfile - Client profile
 * @returns {Number} Risk score (0-1)
 */
function calculateRiskScore(caseAnalysis, clientProfile) {
  // Start with baseline risk
  let riskScore = 0.5;
  
  // Adjust based on case complexity
  if (caseAnalysis.complexity) {
    riskScore += (caseAnalysis.complexity.score - 0.5) * 0.3;
  }
  
  // Adjust based on client risk tolerance
  const riskTolerance = clientProfile.riskTolerance || "medium";
  if (riskTolerance === "low") {
    riskScore += 0.2;
  } else if (riskTolerance === "high") {
    riskScore -= 0.2;
  }
  
  // Adjust based on case strength
  if (caseAnalysis.estimatedValue) {
    // Higher value cases might be riskier
    riskScore += Math.min(caseAnalysis.estimatedValue / 100000, 0.2);
  }
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, riskScore));
}

/**
 * Document intelligence analysis
 * @param {Array} documents - Array of legal documents
 * @returns {Promise<Object>} Document intelligence results
 */
async function analyzeDocuments(documents) {
  try {
    const documentAnalyses = [];
    
    // Analyze each document
    for (const document of documents) {
      const analysis = comprehensiveNLPAnalysis({
        id: document.id,
        fullText: document.content
      });
      
      documentAnalyses.push({
        documentId: document.id,
        analysis
      });
    }
    
    // Identify common themes across documents
    const commonThemes = identifyCommonThemes(documentAnalyses);
    
    return {
      documentCount: documents.length,
      documentAnalyses,
      commonThemes,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in document analysis:', error);
    throw error;
  }
}

/**
 * Identify common themes across multiple document analyses
 * @param {Array} documentAnalyses - Array of document analyses
 * @returns {Array} Common themes
 */
function identifyCommonThemes(documentAnalyses) {
  const themeFrequency = {};
  
  documentAnalyses.forEach(docAnalysis => {
    const topics = docAnalysis.analysis.topics || [];
    topics.forEach(topic => {
      themeFrequency[topic] = (themeFrequency[topic] || 0) + 1;
    });
  });
  
  // Return themes that appear in more than 30% of documents
  const threshold = documentAnalyses.length * 0.3;
  return Object.entries(themeFrequency)
    .filter(([theme, frequency]) => frequency >= threshold)
    .map(([theme, frequency]) => ({
      theme,
      frequency,
      percentage: (frequency / documentAnalyses.length) * 100
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// Export all functions including new ones
module.exports = {
  analyzeCourtDecision,
  generatePersonalizedRecommendations,
  analyzeTrends,
  assessCaseRisk,
  analyzeDocuments,
  // New enhanced functions
  assessEnhancedCaseRisk,
  generateEnhancedStrategyRecommendations,
  summarizeLegalDocument,
  compareLegalDocuments
};