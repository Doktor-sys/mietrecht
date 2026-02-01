/**
 * Recommendation Engine for Mietrecht Agent
 * This module serves as the core engine for generating personalized legal recommendations.
 */

const { generateStrategyRecommendations } = require('./strategyRecommender.js');
const { createClientProfile, updateClientProfile } = require('./clientProfiler.js');

/**
 * Generate comprehensive legal recommendations
 * @param {Object} caseData - Case data including documents and context
 * @param {Object} clientData - Client data including history and preferences
 * @param {Object} lawyerData - Lawyer data including expertise and experience
 * @returns {Object} Comprehensive recommendations
 */
function generateRecommendations(caseData, clientData, lawyerData) {
  // Create or update client profile
  const clientProfile = createClientProfile(clientData);
  
  // Generate strategy recommendations
  const strategyRecommendations = generateStrategyRecommendations(
    caseData, 
    clientProfile, 
    lawyerData
  );
  
  // Generate additional recommendations
  const additionalRecommendations = generateAdditionalRecommendations(
    caseData, 
    clientProfile, 
    lawyerData
  );
  
  // Combine all recommendations
  const allRecommendations = [
    ...strategyRecommendations.recommendations,
    ...additionalRecommendations
  ];
  
  // Sort by priority
  const sortedRecommendations = sortRecommendations(allRecommendations);
  
  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence([
    strategyRecommendations.confidence,
    ...additionalRecommendations.map(rec => rec.confidence || 0.5)
  ]);
  
  return {
    caseId: caseData.id || null,
    clientId: clientData.id || null,
    lawyerId: lawyerData.id || null,
    overallStrategy: strategyRecommendations.strategy,
    caseStrength: strategyRecommendations.caseStrength,
    confidence: overallConfidence,
    recommendations: sortedRecommendations,
    supportingAnalysis: {
      documentAnalysis: strategyRecommendations.documentAnalysis,
      clientProfile: clientProfile
    }
  };
}

/**
 * Generate additional recommendations beyond strategy
 * @param {Object} caseData - Case data
 * @param {Object} clientProfile - Client profile
 * @param {Object} lawyerData - Lawyer data
 * @returns {Array} Additional recommendations
 */
function generateAdditionalRecommendations(caseData, clientProfile, lawyerData) {
  const recommendations = [];
  
  // Recommendation: Communication frequency
  recommendations.push({
    id: "communication_frequency",
    title: "Kommunikationsfrequenz",
    description: determineCommunicationFrequency(clientProfile),
    priority: "medium",
    confidence: 0.8,
    category: "client_management"
  });
  
  // Recommendation: Document preparation
  recommendations.push({
    id: "document_preparation",
    title: "Dokumentenvorbereitung",
    description: determineDocumentPreparationNeeds(caseData, clientProfile),
    priority: "high",
    confidence: 0.85,
    category: "case_preparation"
  });
  
  // Recommendation: Expert consultation
  recommendations.push({
    id: "expert_consultation",
    title: "Expertenkonsultation",
    description: determineExpertConsultationNeeds(caseData),
    priority: "medium",
    confidence: 0.75,
    category: "case_strategy"
  });
  
  // Recommendation: Timeline management
  recommendations.push({
    id: "timeline_management",
    title: "Zeitmanagement",
    description: determineTimelineManagementStrategy(caseData, clientProfile),
    priority: "high",
    confidence: 0.8,
    category: "case_management"
  });
  
  return recommendations;
}

/**
 * Determine recommended communication frequency
 * @param {Object} clientProfile - Client profile
 * @returns {String} Communication frequency recommendation
 */
function determineCommunicationFrequency(clientProfile) {
  const preferences = clientProfile.preferences || {};
  const involvement = preferences.involvement || "medium";
  
  if (involvement === "high") {
    return "Wöchentliche Updates und regelmäßige Konsultationen empfohlen, um den Mandanten aktiv einzubeziehen.";
  } else if (involvement === "low") {
    return "Monatliche Statusberichte ausreichend, mit der Möglichkeit zur ad-hoc-Kommunikation bei wichtigen Entwicklungen.";
  } else {
    return "Bi-wöchentliche Updates bieten eine gute Balance zwischen Informationsgehalt und Effizienz.";
  }
}

/**
 * Determine document preparation needs
 * @param {Object} caseData - Case data
 * @param {Object} clientProfile - Client profile
 * @returns {String} Document preparation recommendation
 */
function determineDocumentPreparationNeeds(caseData, clientProfile) {
  const documents = caseData.documents || [];
  const detailLevel = clientProfile.preferences.detailLevel || "medium";
  
  if (documents.length === 0) {
    return "Dringend erforderlich: Sammlung aller relevanten Dokumente (Verträge, Korrespondenz, Fotos, Quittungen).";
  } else if (documents.length < 3) {
    return "Weitere Dokumente benötigt, um die rechtliche Position zu stärken. Fokus auf Beweisdokumente legen.";
  } else {
    if (detailLevel === "high") {
      return "Umfassende Dokumentation vorhanden. Empfehlung: Detaillierte Analyse und Chronologieerstellung.";
    } else {
      return "Ausreichende Dokumentation für den Fall vorhanden. Zusammenfassung der wichtigsten Punkte erstellen.";
    }
  }
}

/**
 * Determine expert consultation needs
 * @param {Object} caseData - Case data
 * @returns {String} Expert consultation recommendation
 */
function determineExpertConsultationNeeds(caseData) {
  const documents = caseData.documents || [];
  const combinedText = documents.map(doc => doc.content || "").join(" ");
  
  // Simple heuristic: if technical terms are mentioned, expert consultation might be needed
  const technicalTerms = ["Schimmel", "Bausubstanz", "Energieverbrauch", "Mietspiegel", "Bewertung"];
  const hasTechnicalTerms = technicalTerms.some(term => combinedText.includes(term));
  
  if (hasTechnicalTerms) {
    return "Fachgutachten könnten zur Stärkung der Position erforderlich sein (z.B. Schimmelgutachten, Bauingenieurberatung).";
  } else {
    return "Kein unmittelbarer Bedarf an Expertengutachten identifiziert. Bei weiterem Fallverlauf erneut prüfen.";
  }
}

/**
 * Determine timeline management strategy
 * @param {Object} caseData - Case data
 * @param {Object} clientProfile - Client profile
 * @returns {String} Timeline management recommendation
 */
function determineTimelineManagementStrategy(caseData, clientProfile) {
  const riskTolerance = clientProfile.riskTolerance || "medium";
  const financialSituation = clientProfile.financialSituation || "moderate";
  
  if (riskTolerance === "low" || financialSituation === "limited") {
    return "Vorsichtige Zeitplanung empfohlen. Ausreichend Zeit für Vorbereitung und mögliche außergerichtliche Lösungen einplanen.";
  } else if (riskTolerance === "high") {
    return "Aggressive Zeitplanung möglich. Schnelle Schritte zur Durchsetzung der Interessen, jedoch rechtliche Mindestfristen beachten.";
  } else {
    return "Standardzeitplanung. Angemessene Fristen für alle Parteien unter Berücksichtigung der Fallkomplexität.";
  }
}

/**
 * Sort recommendations by priority and category
 * @param {Array} recommendations - Array of recommendations
 * @returns {Array} Sorted recommendations
 */
function sortRecommendations(recommendations) {
  // Priority order: high, medium, low
  const priorityOrder = { "high": 1, "medium": 2, "low": 3 };
  
  // Category order for equal priorities
  const categoryOrder = {
    "case_preparation": 1,
    "case_strategy": 2,
    "case_management": 3,
    "client_management": 4
  };
  
  return recommendations.sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Then sort by category
    return categoryOrder[a.category] - categoryOrder[b.category];
  });
}

/**
 * Calculate overall confidence from individual confidences
 * @param {Array} confidences - Array of confidence scores
 * @returns {Number} Overall confidence score
 */
function calculateOverallConfidence(confidences) {
  if (!confidences || confidences.length === 0) {
    return 0;
  }
  
  // Simple average
  const sum = confidences.reduce((acc, conf) => acc + conf, 0);
  return sum / confidences.length;
}

/**
 * Validate recommendation inputs
 * @param {Object} caseData - Case data
 * @param {Object} clientData - Client data
 * @param {Object} lawyerData - Lawyer data
 * @returns {Object} Validation result
 */
function validateInputs(caseData, clientData, lawyerData) {
  const errors = [];
  
  if (!caseData) {
    errors.push("Case data is required");
  }
  
  if (!clientData) {
    errors.push("Client data is required");
  }
  
  if (!lawyerData) {
    errors.push("Lawyer data is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Export functions
module.exports = {
  generateRecommendations,
  validateInputs
};