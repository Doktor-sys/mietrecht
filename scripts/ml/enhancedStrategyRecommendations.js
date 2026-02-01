/**
 * Enhanced Strategy Recommendations Module for SmartLaw Mietrecht
 * This module provides advanced personalized legal strategy recommendations using machine learning.
 */

const { advancedExtractTopics, advancedExtractEntities } = require('../nlp/advancedNLPProcessor.js');
const { extractNamedEntities } = require('../nlp/entityExtractor.js');
const { analyzeSentiment } = require('../nlp/sentimentAnalyzer.js');
const { performTopicModeling } = require('../nlp/semanticAnalyzer.js');

/**
 * Generate enhanced personalized legal strategy recommendations
 * @param {Object} caseData - Case data including documents, client info, etc.
 * @param {Object} clientProfile - Client profile with preferences and history
 * @param {Object} lawyerProfile - Lawyer profile with expertise and experience
 * @param {Object} riskAssessment - Risk assessment results
 * @param {Object} historicalData - Historical case data for comparison
 * @returns {Object} Enhanced strategy recommendations
 */
function generateEnhancedStrategyRecommendations(caseData, clientProfile, lawyerProfile, riskAssessment, historicalData) {
  // Validate inputs
  if (!caseData || !clientProfile || !lawyerProfile) {
    return {
      strategy: "Keine Empfehlungen verfügbar.",
      confidence: 0,
      recommendations: []
    };
  }
  
  // Analyze case documents
  const documentAnalysis = analyzeCaseDocuments(caseData.documents);
  
  // Assess case strength
  const caseStrength = assessCaseStrength(documentAnalysis, caseData);
  
  // Determine client risk tolerance
  const riskTolerance = clientProfile.riskTolerance || "medium";
  
  // Analyze historical patterns
  const historicalPatterns = analyzeHistoricalPatterns(historicalData, caseData.type);
  
  // Generate recommendations based on all analyses
  const recommendations = generateEnhancedRecommendations(
    caseData, 
    clientProfile, 
    lawyerProfile, 
    documentAnalysis, 
    caseStrength,
    riskTolerance,
    riskAssessment,
    historicalPatterns
  );
  
  // Calculate confidence score
  const confidence = calculateEnhancedConfidence(caseData, documentAnalysis, riskAssessment, historicalPatterns);
  
  return {
    strategy: deriveOverallStrategy(recommendations),
    confidence,
    caseStrength,
    recommendations,
    documentAnalysis,
    generationTimestamp: new Date().toISOString()
  };
}

/**
 * Analyze case documents using advanced NLP
 * @param {Array} documents - Array of case documents
 * @returns {Object} Document analysis results
 */
function analyzeCaseDocuments(documents) {
  if (!documents || !Array.isArray(documents)) {
    return {
      topics: [],
      entities: {},
      sentiment: {},
      keyIssues: []
    };
  }
  
  // Combine all document texts for analysis
  const combinedText = documents.map(doc => doc.content || "").join(" ");
  
  // Extract topics
  const topics = advancedExtractTopics(combinedText);
  
  // Extract entities
  const entities = extractNamedEntities(combinedText);
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(combinedText);
  
  // Perform topic modeling
  const topicModeling = performTopicModeling(combinedText);
  
  // Identify key issues
  const keyIssues = identifyKeyIssues(topics, topicModeling);
  
  return {
    topics,
    entities,
    sentiment,
    topicModeling,
    keyIssues
  };
}

/**
 * Assess case strength based on document analysis
 * @param {Object} documentAnalysis - Results from document analysis
 * @param {Object} caseData - Case data
 * @returns {Object} Case strength assessment
 */
function assessCaseStrength(documentAnalysis, caseData) {
  // Simple strength assessment based on sentiment and key issues
  const sentimentScore = documentAnalysis.sentiment.polarity || 0;
  const keyIssueCount = documentAnalysis.keyIssues.length || 0;
  
  // Adjust for case type
  let strength = 0.5; // Neutral baseline
  
  // Positive sentiment increases strength
  strength += sentimentScore * 0.2;
  
  // More key issues might indicate complexity (could be positive or negative)
  strength -= Math.min(keyIssueCount * 0.05, 0.3);
  
  // Adjust for document quality
  if (documentAnalysis.topics && documentAnalysis.topics.length > 5) {
    strength += 0.1;
  }
  
  // Determine strength level
  let assessment = "medium";
  if (strength > 0.7) {
    assessment = "strong";
  } else if (strength < 0.3) {
    assessment = "weak";
  }
  
  return {
    score: strength,
    assessment,
    confidence: documentAnalysis.sentiment.confidence || 0.5
  };
}

/**
 * Identify key issues from topics and topic modeling
 * @param {Array} topics - Extracted topics
 * @param {Object} topicModeling - Topic modeling results
 * @returns {Array} Key issues
 */
function identifyKeyIssues(topics, topicModeling) {
  const allTopics = [];
  
  // Add extracted topics
  if (topics && Array.isArray(topics)) {
    topics.forEach(topic => {
      allTopics.push({
        name: topic,
        weight: 0.5 // Default weight
      });
    });
  }
  
  // Add modeled topics with weights
  if (topicModeling && topicModeling.topics && Array.isArray(topicModeling.topics)) {
    topicModeling.topics.forEach(topic => {
      // Check if topic already exists
      const existingTopic = allTopics.find(t => t.name === topic.label);
      if (existingTopic) {
        existingTopic.weight = Math.max(existingTopic.weight, topic.score);
      } else {
        allTopics.push({
          name: topic.label,
          weight: topic.score
        });
      }
    });
  }
  
  // Sort by weight and take top issues
  return allTopics
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(topic => topic.name);
}

/**
 * Analyze historical patterns for strategy recommendations
 * @param {Object} historicalData - Historical case data
 * @param {String} caseType - Type of case
 * @returns {Object} Historical patterns analysis
 */
function analyzeHistoricalPatterns(historicalData, caseType) {
  if (!historicalData || !Array.isArray(historicalData.cases)) {
    return {
      successStrategies: [],
      commonChallenges: [],
      averageDuration: 90,
      trendingStrategies: []
    };
  }
  
  // Filter for relevant case type
  const relevantCases = historicalData.cases.filter(c => c.type === caseType);
  
  if (relevantCases.length === 0) {
    return {
      successStrategies: [],
      commonChallenges: [],
      averageDuration: 90,
      trendingStrategies: []
    };
  }
  
  // Identify successful strategies
  const successfulCases = relevantCases.filter(c => c.outcome === 'successful');
  
  const strategyCounts = {};
  successfulCases.forEach(c => {
    if (c.strategies && Array.isArray(c.strategies)) {
      c.strategies.forEach(strategy => {
        strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
      });
    }
  });
  
  const successStrategies = Object.entries(strategyCounts)
    .filter(([_, count]) => count > successfulCases.length * 0.2) // Strategies in >20% of successful cases
    .map(([strategy, _]) => strategy);
  
  // Identify common challenges
  const challengeCounts = {};
  relevantCases.forEach(c => {
    if (c.challenges && Array.isArray(c.challenges)) {
      c.challenges.forEach(challenge => {
        challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
      });
    }
  });
  
  const commonChallenges = Object.entries(challengeCounts)
    .filter(([_, count]) => count > relevantCases.length * 0.15) // Challenges in >15% of cases
    .map(([challenge, _]) => challenge);
  
  // Calculate average duration
  const totalDuration = relevantCases.reduce((sum, c) => sum + (c.duration || 0), 0);
  const averageDuration = totalDuration / relevantCases.length;
  
  // Identify trending strategies (strategies increasing in recent cases)
  const recentCases = relevantCases.slice(-Math.min(50, Math.floor(relevantCases.length * 0.3)));
  const olderCases = relevantCases.slice(0, -recentCases.length);
  
  const recentStrategyCounts = {};
  const olderStrategyCounts = {};
  
  recentCases.forEach(c => {
    if (c.strategies && Array.isArray(c.strategies)) {
      c.strategies.forEach(strategy => {
        recentStrategyCounts[strategy] = (recentStrategyCounts[strategy] || 0) + 1;
      });
    }
  });
  
  olderCases.forEach(c => {
    if (c.strategies && Array.isArray(c.strategies)) {
      c.strategies.forEach(strategy => {
        olderStrategyCounts[strategy] = (olderStrategyCounts[strategy] || 0) + 1;
      });
    }
  });
  
  const trendingStrategies = Object.keys(recentStrategyCounts).filter(strategy => {
    const recentRatio = (recentStrategyCounts[strategy] || 0) / recentCases.length;
    const olderRatio = (olderStrategyCounts[strategy] || 0) / olderCases.length;
    return recentRatio > olderRatio * 1.5; // 50% increase in frequency
  });
  
  return {
    successStrategies,
    commonChallenges,
    averageDuration,
    trendingStrategies,
    totalCases: relevantCases.length
  };
}

/**
 * Generate enhanced specific recommendations
 * @param {Object} caseData - Case data
 * @param {Object} clientProfile - Client profile
 * @param {Object} lawyerProfile - Lawyer profile
 * @param {Object} documentAnalysis - Document analysis results
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @param {Object} riskAssessment - Risk assessment results
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {Array} Enhanced recommendations
 */
function generateEnhancedRecommendations(caseData, clientProfile, lawyerProfile, documentAnalysis, caseStrength, riskTolerance, riskAssessment, historicalPatterns) {
  const recommendations = [];
  
  // Recommendation 1: Overall approach
  recommendations.push({
    id: "approach",
    title: "Empfohlene Vorgehensweise",
    description: determineEnhancedApproach(caseStrength, riskTolerance, riskAssessment),
    priority: "high",
    confidence: 0.9
  });
  
  // Recommendation 2: Document strategy
  recommendations.push({
    id: "documents",
    title: "Dokumentenstrategie",
    description: determineEnhancedDocumentStrategy(documentAnalysis, historicalPatterns),
    priority: "high",
    confidence: 0.85
  });
  
  // Recommendation 3: Timeline
  recommendations.push({
    id: "timeline",
    title: "Zeitlicher Ablauf",
    description: determineEnhancedTimeline(caseStrength, riskTolerance, historicalPatterns),
    priority: "medium",
    confidence: 0.8
  });
  
  // Recommendation 4: Evidence collection
  recommendations.push({
    id: "evidence",
    title: "Beweissicherung",
    description: determineEnhancedEvidenceStrategy(documentAnalysis, historicalPatterns),
    priority: "high",
    confidence: 0.9
  });
  
  // Recommendation 5: Settlement potential
  recommendations.push({
    id: "settlement",
    title: "Außergerichtliche Beilegung",
    description: determineEnhancedSettlementPotential(caseStrength, riskTolerance, riskAssessment),
    priority: "medium",
    confidence: 0.85
  });
  
  // Recommendation 6: Risk mitigation
  recommendations.push({
    id: "risk_mitigation",
    title: "Risikominderung",
    description: determineRiskMitigationStrategy(riskAssessment),
    priority: "high",
    confidence: riskAssessment.confidence || 0.7
  });
  
  // Recommendation 7: Historical insights
  if (historicalPatterns.trendingStrategies && historicalPatterns.trendingStrategies.length > 0) {
    recommendations.push({
      id: "historical_insights",
      title: "Historische Erkenntnisse",
      description: `Aktuelle Trends in erfolgreichen Strategien: ${historicalPatterns.trendingStrategies.join(", ")}`,
      priority: "medium",
      confidence: 0.8
    });
  }
  
  return recommendations;
}

/**
 * Determine enhanced overall approach recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @param {Object} riskAssessment - Risk assessment results
 * @returns {String} Enhanced approach recommendation
 */
function determineEnhancedApproach(caseStrength, riskTolerance, riskAssessment) {
  let baseApproach = "";
  
  if (caseStrength.assessment === "strong") {
    if (riskTolerance === "low") {
      baseApproach = "Stärke des Falls nutzen, aber risikobewusst vorgehen. Außergerichtliche Lösung anstreben, aber Prozessvorbereitung nicht vernachlässigen.";
    } else {
      baseApproach = "Starke Position ausnutzen. Möglichst rasche und entschiedene Durchsetzung der Interessen.";
    }
  } else if (caseStrength.assessment === "weak") {
    if (riskTolerance === "low") {
      baseApproach = "Vorsichtige Vorgehensweise. Fokus auf Risikominderung und Schadensbegrenzung.";
    } else {
      baseApproach = "Schwache Position erfordert kreative Ansätze. Alternative Lösungswege prüfen.";
    }
  } else {
    baseApproach = "Ausgewogene Vorgehensweise. Sorgfältige Abwägung aller Optionen.";
  }
  
  // Adjust based on risk assessment
  if (riskAssessment.riskLevel === "high") {
    baseApproach += " Aufgrund des erhöhten Risikos besondere Vorsicht walten lassen und alle Maßnahmen zur Risikominderung umsetzen.";
  } else if (riskAssessment.riskLevel === "low") {
    baseApproach += " Das geringe Risiko erlaubt eine etwas aggressivere Vorgehensweise, wobei die identifizierten Risikominderungsstrategien beachtet werden sollten.";
  }
  
  return baseApproach;
}

/**
 * Determine enhanced document strategy recommendation
 * @param {Object} documentAnalysis - Document analysis results
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {String} Enhanced document strategy recommendation
 */
function determineEnhancedDocumentStrategy(documentAnalysis, historicalPatterns) {
  const topics = documentAnalysis.topics || [];
  const entities = documentAnalysis.entities || {};
  const persons = entities.persons || [];
  const organizations = entities.organizations || [];
  
  let strategy = "Umfassende Dokumentenstrategie entwickeln. ";
  
  if (topics.length > 3) {
    strategy += "Die Vielzahl an Themen erfordert eine strukturierte Organisation der Unterlagen. ";
  }
  
  if (persons.length > 3 || organizations.length > 2) {
    strategy += "Vielfältige Beteiligte erfordern umfassende Beweissicherung. Zeugenbefragung, Schriftstücke und digitale Kommunikation sichern. ";
  }
  
  // Reference historical patterns
  if (historicalPatterns.commonChallenges && historicalPatterns.commonChallenges.length > 0) {
    strategy += `Typische Herausforderungen in ähnlichen Fällen: ${historicalPatterns.commonChallenges.slice(0, 3).join(", ")}. `;
  }
  
  if (historicalPatterns.successStrategies && historicalPatterns.successStrategies.length > 0) {
    strategy += `Erfolgreiche Strategien in vergleichbaren Fällen: ${historicalPatterns.successStrategies.slice(0, 3).join(", ")}. `;
  }
  
  return strategy.trim();
}

/**
 * Determine enhanced timeline recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {String} Enhanced timeline recommendation
 */
function determineEnhancedTimeline(caseStrength, riskTolerance, historicalPatterns) {
  let timeline = "";
  
  if (caseStrength.assessment === "strong" && riskTolerance !== "low") {
    timeline = "Schnelle Prozessführung anstreben, um Druck auf die Gegenseite auszuüben. Sofortige Einreichung wesentlicher Dokumente.";
  } else if (caseStrength.assessment === "weak" || riskTolerance === "low") {
    timeline = "Ausreichend Zeit für Vorbereitung einplanen. Gründliche Sammlung aller relevanten Unterlagen und Beweise.";
  } else {
    timeline = "Standardmäßige Prozessführung. Ausreichend Zeit für fundierte Vorbereitung, aber ohne unnötige Verzögerungen.";
  }
  
  // Add historical context
  if (historicalPatterns.averageDuration) {
    timeline += ` Historisch betrachtet dauern vergleichbare Fälle durchschnittlich ${Math.round(historicalPatterns.averageDuration)} Tage.`;
  }
  
  return timeline;
}

/**
 * Determine enhanced evidence strategy recommendation
 * @param {Object} documentAnalysis - Document analysis results
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {String} Enhanced evidence strategy recommendation
 */
function determineEnhancedEvidenceStrategy(documentAnalysis, historicalPatterns) {
  const entities = documentAnalysis.entities || {};
  const persons = entities.persons || [];
  const organizations = entities.organizations || [];
  
  let strategy = "";
  
  if (persons.length > 3 || organizations.length > 2) {
    strategy = "Vielfältige Beteiligte erfordern umfassende Beweissicherung. Zeugenbefragung, Schriftstücke und digitale Kommunikation sichern.";
  } else {
    strategy = "Gründliche Sammlung und Organisation aller relevanten Beweismittel. Dokumente chronologisch sortieren und indizieren.";
  }
  
  // Reference historical challenges
  if (historicalPatterns.commonChallenges && historicalPatterns.commonChallenges.includes("Beweismangel")) {
    strategy += " Historisch gesehen war Beweismangel eine häufige Herausforderung in ähnlichen Fällen. Besondere Sorgfalt bei der Beweissicherung walten lassen.";
  }
  
  return strategy;
}

/**
 * Determine enhanced settlement potential recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @param {Object} riskAssessment - Risk assessment results
 * @returns {String} Enhanced settlement potential recommendation
 */
function determineEnhancedSettlementPotential(caseStrength, riskTolerance, riskAssessment) {
  let potential = "";
  
  if (caseStrength.assessment === "strong" && riskTolerance !== "low") {
    potential = "Starke Position für außergerichtliche Einigung nutzen. Klar definierte Mindestanforderungen setzen.";
  } else if (caseStrength.assessment === "weak" || riskTolerance === "low") {
    potential = "Außergerichtliche Lösung bevorzugen, um Risiken und Kosten zu minimieren. Kreative Lösungsansätze erwägen.";
  } else {
    potential = "Offene Haltung zur außergerichtlichen Beilegung. Verhandlungen auf Grundlage der Sachlage führen.";
  }
  
  // Adjust based on risk assessment
  if (riskAssessment.riskLevel === "high") {
    potential += " Aufgrund des hohen Risikos ist eine außergerichtliche Lösung besonders empfehlenswert.";
  }
  
  return potential;
}

/**
 * Determine risk mitigation strategy
 * @param {Object} riskAssessment - Risk assessment results
 * @returns {String} Risk mitigation strategy
 */
function determineRiskMitigationStrategy(riskAssessment) {
  if (!riskAssessment.mitigationStrategies || riskAssessment.mitigationStrategies.length === 0) {
    return "Standard-Risikominderungsmaßnahmen anwenden.";
  }
  
  const strategies = riskAssessment.mitigationStrategies
    .filter(s => s.priority === "high")
    .map(s => s.title.toLowerCase());
  
  if (strategies.length > 0) {
    return `Folgende Risikominderungsstrategien prioritär umsetzen: ${strategies.join(", ")}.`;
  }
  
  return "Empfohlene Risikominderungsstrategien umsetzen.";
}

/**
 * Derive overall strategy from recommendations
 * @param {Array} recommendations - Array of recommendations
 * @returns {String} Overall strategy
 */
function deriveOverallStrategy(recommendations) {
  // Combine key points from high priority recommendations
  const highPriorityRecs = recommendations.filter(rec => rec.priority === "high");
  
  if (highPriorityRecs.length === 0) {
    return "Ausgewogene rechtliche Strategie empfohlen.";
  }
  
  return highPriorityRecs.map(rec => rec.description).join(" ");
}

/**
 * Calculate enhanced confidence score for recommendations
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @param {Object} riskAssessment - Risk assessment results
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {Number} Enhanced confidence score (0-1)
 */
function calculateEnhancedConfidence(caseData, documentAnalysis, riskAssessment, historicalPatterns) {
  // Base confidence
  let confidence = 0.5;
  
  // Increase for more documents
  if (caseData.documents && caseData.documents.length > 3) {
    confidence += 0.15;
  }
  
  // Increase for more identified topics
  if (documentAnalysis.topics && documentAnalysis.topics.length > 5) {
    confidence += 0.1;
  }
  
  // Increase for sentiment analysis
  if (documentAnalysis.sentiment && documentAnalysis.sentiment.confidence > 0.5) {
    confidence += 0.1;
  }
  
  // Increase for risk assessment confidence
  if (riskAssessment.confidence) {
    confidence += riskAssessment.confidence * 0.1;
  }
  
  // Increase for substantial historical data
  if (historicalPatterns.totalCases > 50) {
    confidence += 0.05;
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

// Export functions
module.exports = {
  generateEnhancedStrategyRecommendations,
  analyzeCaseDocuments,
  assessCaseStrength,
  identifyKeyIssues,
  analyzeHistoricalPatterns,
  generateEnhancedRecommendations,
  determineEnhancedApproach,
  determineEnhancedDocumentStrategy,
  determineEnhancedTimeline,
  determineEnhancedEvidenceStrategy,
  determineEnhancedSettlementPotential,
  determineRiskMitigationStrategy,
  deriveOverallStrategy,
  calculateEnhancedConfidence
};