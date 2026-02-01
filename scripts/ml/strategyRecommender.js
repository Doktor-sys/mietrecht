/**
 * Strategy Recommender for Mietrecht Agent
 * This module provides personalized legal strategy recommendations.
 */

const { advancedExtractTopics, advancedExtractEntities } = require('../nlp/advancedNLPProcessor.js');
const { extractNamedEntities } = require('../nlp/entityExtractor.js');
const { analyzeSentiment } = require('../nlp/sentimentAnalyzer.js');
const { performTopicModeling } = require('../nlp/semanticAnalyzer.js');

/**
 * Generate personalized legal strategy recommendations
 * @param {Object} caseData - Case data including documents, client info, etc.
 * @param {Object} clientProfile - Client profile with preferences and history
 * @param {Object} lawyerProfile - Lawyer profile with expertise and experience
 * @returns {Object} Strategy recommendations
 */
function generateStrategyRecommendations(caseData, clientProfile, lawyerProfile) {
  // In a real implementation, this would use machine learning models
  // For now, we'll create a placeholder implementation
  
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
  
  // Generate recommendations based on analysis
  const recommendations = generateRecommendations(
    caseData, 
    clientProfile, 
    lawyerProfile, 
    documentAnalysis, 
    caseStrength,
    riskTolerance
  );
  
  // Calculate confidence score
  const confidence = calculateConfidence(caseData, documentAnalysis);
  
  return {
    strategy: deriveOverallStrategy(recommendations),
    confidence,
    caseStrength,
    recommendations,
    documentAnalysis
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
  // In a real implementation, this would use ML models
  // For now, we'll create a placeholder implementation
  
  // Simple strength assessment based on sentiment and key issues
  const sentimentScore = documentAnalysis.sentiment.polarity || 0;
  const keyIssueCount = documentAnalysis.keyIssues.length || 0;
  
  // Adjust for case type
  let strength = 0.5; // Neutral baseline
  
  // Positive sentiment increases strength
  strength += sentimentScore * 0.2;
  
  // More key issues might indicate complexity (could be positive or negative)
  strength -= Math.min(keyIssueCount * 0.05, 0.3);
  
  // Adjust based on case value (higher value might mean higher stakes)
  if (caseData.value > 10000) {
    strength += 0.1; // High-value cases might be stronger
  }
  
  // Clamp between 0 and 1
  strength = Math.max(0, Math.min(1, strength));
  
  // Convert to categorical assessment
  let assessment = "medium";
  if (strength > 0.7) {
    assessment = "strong";
  } else if (strength < 0.3) {
    assessment = "weak";
  }
  
  return {
    score: strength,
    assessment,
    factors: {
      sentimentImpact: sentimentScore * 0.2,
      complexityImpact: -Math.min(keyIssueCount * 0.05, 0.3),
      valueImpact: caseData.value > 10000 ? 0.1 : 0
    }
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
 * Generate specific recommendations
 * @param {Object} caseData - Case data
 * @param {Object} clientProfile - Client profile
 * @param {Object} lawyerProfile - Lawyer profile
 * @param {Object} documentAnalysis - Document analysis results
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @returns {Array} Recommendations
 */
function generateRecommendations(caseData, clientProfile, lawyerProfile, documentAnalysis, caseStrength, riskTolerance) {
  const recommendations = [];
  
  // Recommendation 1: Overall approach
  recommendations.push({
    id: "approach",
    title: "Empfohlene Vorgehensweise",
    description: determineApproach(caseStrength, riskTolerance),
    priority: "high",
    confidence: 0.8
  });
  
  // Recommendation 2: Document strategy
  recommendations.push({
    id: "documents",
    title: "Dokumentenstrategie",
    description: determineDocumentStrategy(documentAnalysis),
    priority: "high",
    confidence: 0.75
  });
  
  // Recommendation 3: Timeline
  recommendations.push({
    id: "timeline",
    title: "Zeitlicher Ablauf",
    description: determineTimeline(caseStrength, riskTolerance),
    priority: "medium",
    confidence: 0.7
  });
  
  // Recommendation 4: Evidence collection
  recommendations.push({
    id: "evidence",
    title: "Beweissicherung",
    description: determineEvidenceStrategy(documentAnalysis),
    priority: "high",
    confidence: 0.85
  });
  
  // Recommendation 5: Settlement potential
  recommendations.push({
    id: "settlement",
    title: "Außergerichtliche Beilegung",
    description: determineSettlementPotential(caseStrength, riskTolerance),
    priority: "medium",
    confidence: 0.75
  });
  
  return recommendations;
}

/**
 * Determine overall approach recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @returns {String} Approach recommendation
 */
function determineApproach(caseStrength, riskTolerance) {
  if (caseStrength.assessment === "strong") {
    if (riskTolerance === "low") {
      return "Stärke des Falls nutzen, aber risikobewusst vorgehen. Außergerichtliche Lösung anstreben, aber Prozessvorbereitung nicht vernachlässigen.";
    } else {
      return "Stärke des Falls konsequent ausspielen. Prozessführung mit hoher Erfolgswahrscheinlichkeit.";
    }
  } else if (caseStrength.assessment === "weak") {
    if (riskTolerance === "high") {
      return "Schwächen des Falls einkalkulieren. Aggressive Strategie nur bei ausdrücklicher Zustimmung des Mandanten.";
    } else {
      return "Schwächen des Falls offenlegen. Alternative Lösungswege (Mediation, Vergleich) bevorzugen.";
    }
  } else {
    return "Ausgewogene Strategie verfolgen. Stärken nutzen, Schwächen minimieren. Flexible Vorgehensweise je nach Gegenseite.";
  }
}

/**
 * Determine document strategy recommendation
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {String} Document strategy recommendation
 */
function determineDocumentStrategy(documentAnalysis) {
  const keyIssues = documentAnalysis.keyIssues || [];
  
  if (keyIssues.length > 3) {
    return "Komplexität des Falls erfordert strukturierte Dokumentation. Jede rechtliche Position separat dokumentieren und begründen.";
  } else if (keyIssues.length > 0) {
    return "Fokus auf Hauptthemen des Falls. Dokumentation klar und präzise halten, unnötige Komplexität vermeiden.";
  } else {
    return "Dokumentation auf wesentliche Fakten beschränken. Klare, sachliche Darstellung des Sachverhalts.";
  }
}

/**
 * Determine timeline recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @returns {String} Timeline recommendation
 */
function determineTimeline(caseStrength, riskTolerance) {
  if (caseStrength.assessment === "strong" && riskTolerance !== "low") {
    return "Schnelle Prozessführung anstreben, um Druck auf die Gegenseite auszuüben. Sofortige Einreichung wesentlicher Dokumente.";
  } else if (caseStrength.assessment === "weak" || riskTolerance === "low") {
    return "Ausreichend Zeit für Vorbereitung einplanen. Gründliche Sammlung aller relevanten Unterlagen und Beweise.";
  } else {
    return "Standardmäßige Prozessführung. Ausreichend Zeit für fundierte Vorbereitung, aber ohne unnötige Verzögerungen.";
  }
}

/**
 * Determine evidence strategy recommendation
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {String} Evidence strategy recommendation
 */
function determineEvidenceStrategy(documentAnalysis) {
  const entities = documentAnalysis.entities || {};
  const persons = entities.persons || [];
  const organizations = entities.organizations || [];
  
  if (persons.length > 3 || organizations.length > 2) {
    return "Vielfältige Beteiligte erfordern umfassende Beweissicherung. Zeugenbefragung, Schriftstücke und digitale Kommunikation sichern.";
  } else {
    return "Begrenzte Anzahl an Beteiligten ermöglicht fokussierte Beweissicherung. Wesentliche Dokumente und Schlüsselzeugen identifizieren.";
  }
}

/**
 * Determine settlement potential recommendation
 * @param {Object} caseStrength - Case strength assessment
 * @param {String} riskTolerance - Client's risk tolerance
 * @returns {String} Settlement potential recommendation
 */
function determineSettlementPotential(caseStrength, riskTolerance) {
  if (caseStrength.assessment === "strong" && riskTolerance !== "high") {
    return "Starke rechtliche Position ermöglicht gutes Vergleichspotenzial. Attraktives Angebot zur außergerichtlichen Beilegung unterbreiten.";
  } else if (caseStrength.assessment === "weak" || riskTolerance === "low") {
    return "Schwächen oder Risikoscheu sprechen für außergerichtliche Lösung. Offenes Gespräch mit der Gegenseite suchen.";
  } else {
    return "Gemischte Faktoren erfordern individuelle Abwägung. Vergleichsmöglichkeiten prüfen, aber Prozessbereitschaft signalisieren.";
  }
}

/**
 * Derive overall strategy from recommendations
 * @param {Array} recommendations - Array of recommendations
 * @returns {String} Overall strategy
 */
function deriveOverallStrategy(recommendations) {
  // Simple implementation - combine key points from high priority recommendations
  const highPriorityRecs = recommendations.filter(rec => rec.priority === "high");
  
  if (highPriorityRecs.length === 0) {
    return "Ausgewogene rechtliche Strategie empfohlen.";
  }
  
  return highPriorityRecs.map(rec => rec.description).join(" ");
}

/**
 * Calculate confidence score for recommendations
 * @param {Object} caseData - Case data
 * @param {Object} documentAnalysis - Document analysis results
 * @returns {Number} Confidence score (0-1)
 */
function calculateConfidence(caseData, documentAnalysis) {
  // Base confidence
  let confidence = 0.5;
  
  // Increase for more documents
  if (caseData.documents && caseData.documents.length > 3) {
    confidence += 0.2;
  }
  
  // Increase for more identified topics
  if (documentAnalysis.topics && documentAnalysis.topics.length > 5) {
    confidence += 0.15;
  }
  
  // Increase for sentiment analysis
  if (documentAnalysis.sentiment && documentAnalysis.sentiment.confidence > 0.5) {
    confidence += 0.15;
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

// Export functions
module.exports = {
  generateStrategyRecommendations,
  analyzeCaseDocuments,
  assessCaseStrength,
  generateRecommendations
};