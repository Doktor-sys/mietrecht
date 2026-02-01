/**
 * Risk Assessment Optimizer for SmartLaw Mietrecht
 * This module provides performance optimizations for the risk assessment algorithms.
 */

/**
 * Cache for historical patterns to avoid recomputation
 */
const historicalPatternsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Optimized version of analyzeHistoricalPatterns with caching
 * @param {Object} historicalData - Historical case data
 * @param {String} caseType - Type of case
 * @returns {Object} Historical patterns analysis
 */
function analyzeHistoricalPatternsWithCache(historicalData, caseType) {
  const cacheKey = `${caseType}-${historicalData.timestamp || 'default'}`;
  const cached = historicalPatternsCache.get(cacheKey);
  
  // Check if we have a valid cached result
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result;
  }
  
  // Compute the result
  const result = analyzeHistoricalPatterns(historicalData, caseType);
  
  // Store in cache
  historicalPatternsCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  return result;
}

/**
 * Analyze historical patterns for risk assessment
 * @param {Object} historicalData - Historical case data
 * @param {String} caseType - Type of case
 * @returns {Object} Historical patterns analysis
 */
function analyzeHistoricalPatterns(historicalData, caseType) {
  if (!historicalData || !Array.isArray(historicalData.cases)) {
    return {
      successRate: 0.5,
      averageDuration: 90,
      commonRiskFactors: [],
      trendingFactors: []
    };
  }
  
  // Filter for relevant case type
  const relevantCases = historicalData.cases.filter(c => c.type === caseType);
  
  if (relevantCases.length === 0) {
    return {
      successRate: 0.5,
      averageDuration: 90,
      commonRiskFactors: [],
      trendingFactors: []
    };
  }
  
  // Calculate success rate
  const successfulCases = relevantCases.filter(c => c.outcome === 'successful').length;
  const successRate = successfulCases / relevantCases.length;
  
  // Calculate average duration
  const totalDuration = relevantCases.reduce((sum, c) => sum + (c.duration || 0), 0);
  const averageDuration = totalDuration / relevantCases.length;
  
  // Identify common risk factors
  const riskFactorCounts = {};
  relevantCases.forEach(c => {
    if (c.riskFactors && Array.isArray(c.riskFactors)) {
      c.riskFactors.forEach(factor => {
        riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1;
      });
    }
  });
  
  const commonRiskFactors = Object.entries(riskFactorCounts)
    .filter(([_, count]) => count > relevantCases.length * 0.1) // Factors appearing in >10% of cases
    .map(([factor, _]) => factor);
  
  // Identify trending factors (factors increasing in recent cases)
  const recentCases = relevantCases.slice(-Math.min(50, Math.floor(relevantCases.length * 0.3)));
  const olderCases = relevantCases.slice(0, -recentCases.length);
  
  const recentFactorCounts = {};
  const olderFactorCounts = {};
  
  recentCases.forEach(c => {
    if (c.riskFactors && Array.isArray(c.riskFactors)) {
      c.riskFactors.forEach(factor => {
        recentFactorCounts[factor] = (recentFactorCounts[factor] || 0) + 1;
      });
    }
  });
  
  olderCases.forEach(c => {
    if (c.riskFactors && Array.isArray(c.riskFactors)) {
      c.riskFactors.forEach(factor => {
        olderFactorCounts[factor] = (olderFactorCounts[factor] || 0) + 1;
      });
    }
  });
  
  const trendingFactors = Object.keys(recentFactorCounts).filter(factor => {
    const recentRatio = (recentFactorCounts[factor] || 0) / recentCases.length;
    const olderRatio = (olderFactorCounts[factor] || 0) / olderCases.length;
    return recentRatio > olderRatio * 1.5; // 50% increase in frequency
  });
  
  return {
    successRate,
    averageDuration,
    commonRiskFactors,
    trendingFactors,
    totalCases: relevantCases.length
  };
}

/**
 * Optimized risk score calculation with early exits
 * @param {Object} caseAnalysis - Case analysis results
 * @param {Object} clientProfile - Client profile
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {Number} Enhanced risk score (0-1)
 */
function calculateOptimizedRiskScore(caseAnalysis, clientProfile, historicalPatterns) {
  // Early exit for extreme cases
  if (caseAnalysis.riskScore >= 0.95) {
    return Math.min(0.99, caseAnalysis.riskScore + 0.05); // Allow some adjustment but cap at 0.99
  }
  
  if (caseAnalysis.riskScore <= 0.05) {
    return Math.max(0.01, caseAnalysis.riskScore - 0.05); // Allow some adjustment but floor at 0.01
  }
  
  // Base risk from case analysis
  let riskScore = caseAnalysis.riskScore || 0.5;
  
  // Adjust based on client profile
  if (clientProfile.riskHistory) {
    // Previous cases with negative outcomes increase risk
    const negativeOutcomeRatio = (clientProfile.riskHistory.negativeOutcomes || 0) / 
                                (clientProfile.riskHistory.totalCases || 1);
    riskScore += negativeOutcomeRatio * 0.2;
  }
  
  if (clientProfile.financialStability) {
    // Lower financial stability increases risk
    riskScore += (1 - clientProfile.financialStability) * 0.15;
  }
  
  // Adjust based on historical patterns
  if (historicalPatterns.successRate) {
    // Lower success rate in similar cases increases risk
    riskScore += (1 - historicalPatterns.successRate) * 0.25;
  }
  
  // Adjust for trending risk factors
  if (caseAnalysis.riskFactors && historicalPatterns.trendingFactors) {
    const trendingRiskFactors = caseAnalysis.riskFactors.filter(
      factor => historicalPatterns.trendingFactors.includes(factor)
    );
    
    // Each trending risk factor increases risk
    riskScore += trendingRiskFactors.length * 0.1;
  }
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, riskScore));
}

/**
 * Batch process risk assessments for multiple cases
 * @param {Array} cases - Array of case data
 * @param {Object} clientData - Client data
 * @param {Object} historicalData - Historical data
 * @returns {Promise<Array>} Array of risk assessment results
 */
async function batchRiskAssessment(cases, clientData, historicalData) {
  const results = [];
  
  // Process in batches to avoid memory issues
  const batchSize = 10;
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    const batchPromises = batch.map(caseData => {
      return assessEnhancedCaseRisk(caseData, clientData, historicalData);
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : { error: result.reason }
    ));
  }
  
  return results;
}

/**
 * Enhanced risk assessment for legal cases with optimizations
 * @param {Object} caseData - Case data including documents and context
 * @param {Object} clientData - Client data including history and preferences
 * @param {Object} historicalData - Historical case data for comparison
 * @returns {Promise<Object>} Enhanced risk assessment results
 */
async function assessOptimizedCaseRisk(caseData, clientData, historicalData) {
  try {
    // Analyze case
    const caseAnalysis = analyzeCase(caseData);
    
    // Create client profile
    const clientProfile = createClientProfile(clientData);
    
    // Analyze historical data patterns with caching
    const historicalPatterns = analyzeHistoricalPatternsWithCache(historicalData, caseData.type);
    
    // Calculate optimized risk score
    const riskScore = calculateOptimizedRiskScore(caseAnalysis, clientProfile, historicalPatterns);
    
    // Determine risk factors
    const riskFactors = identifyRiskFactors(caseAnalysis, clientProfile, historicalPatterns);
    
    // Generate risk mitigation strategies
    const mitigationStrategies = generateRiskMitigationStrategies(riskFactors);
    
    return {
      caseId: caseData.id,
      clientId: clientData.id,
      riskScore,
      riskLevel: determineRiskLevel(riskScore),
      riskFactors,
      mitigationStrategies,
      confidence: calculateRiskAssessmentConfidence(caseAnalysis, historicalPatterns),
      assessmentTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in optimized risk assessment:', error);
    throw error;
  }
}

/**
 * Identify specific risk factors for a case
 * @param {Object} caseAnalysis - Case analysis results
 * @param {Object} clientProfile - Client profile
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {Array} Identified risk factors
 */
function identifyRiskFactors(caseAnalysis, clientProfile, historicalPatterns) {
  const riskFactors = [];
  
  // From case analysis
  if (caseAnalysis.riskFactors && Array.isArray(caseAnalysis.riskFactors)) {
    riskFactors.push(...caseAnalysis.riskFactors);
  }
  
  // From client profile
  if (clientProfile.riskTolerance === "low") {
    riskFactors.push("Klient mit niedriger Risikobereitschaft");
  }
  
  if (clientProfile.financialStability && clientProfile.financialStability < 0.3) {
    riskFactors.push("Geringe finanzielle Stabilität des Klienten");
  }
  
  // From historical patterns
  if (historicalPatterns.trendingFactors && historicalPatterns.trendingFactors.length > 0) {
    riskFactors.push(
      `Zunehmendes Risiko durch folgende Faktoren: ${historicalPatterns.trendingFactors.join(", ")}`
    );
  }
  
  if (historicalPatterns.successRate < 0.4) {
    riskFactors.push("Historisch niedrige Erfolgsrate bei ähnlichen Fällen");
  }
  
  // Deduplication
  return [...new Set(riskFactors)];
}

/**
 * Generate risk mitigation strategies
 * @param {Array} riskFactors - Identified risk factors
 * @returns {Array} Risk mitigation strategies
 */
function generateRiskMitigationStrategies(riskFactors) {
  const strategies = [];
  
  if (riskFactors.includes("Klient mit niedriger Risikobereitschaft")) {
    strategies.push({
      id: "communication_plan",
      title: "Angepasster Kommunikationsplan",
      description: "Regelmäßige Updates und transparente Kommunikation über Fortschritte und Herausforderungen, um die Erwartungen des Klienten zu managen.",
      priority: "high"
    });
  }
  
  if (riskFactors.includes("Geringe finanzielle Stabilität des Klienten")) {
    strategies.push({
      id: "cost_management",
      title: "Kostenmanagement",
      description: "Kosteneffiziente Herangehensweise mit klaren Budgetgrenzen und regelmäßiger Kostenüberprüfung.",
      priority: "high"
    });
  }
  
  if (riskFactors.some(f => f.includes("Zunehmendes Risiko"))) {
    strategies.push({
      id: "legal_research",
      title: "Erweiterte Recherche",
      description: "Vertiefte Recherche aktueller Rechtsprechung und neu aufkommender Trends im Zusammenhang mit den identifizierten Risikofaktoren.",
      priority: "medium"
    });
  }
  
  if (riskFactors.includes("Historisch niedrige Erfolgsrate bei ähnlichen Fällen")) {
    strategies.push({
      id: "alternative_approaches",
      title: "Alternative Ansätze prüfen",
      description: "Prüfung außergerichtlicher Lösungen und alternativer Strategien zur Risikominderung.",
      priority: "high"
    });
    
    strategies.push({
      id: "specialist_consultation",
      title: "Konsultation von Fachexperten",
      description: "Einbindung von Spezialisten für komplexe Aspekte des Falls zur Stärkung der Strategie.",
      priority: "medium"
    });
  }
  
  // Generic strategies if no specific factors
  if (strategies.length === 0) {
    strategies.push({
      id: "standard_precautions",
      title: "Standard-Vorsichtsmaßnahmen",
      description: "Dokumentation aller Schritte, regelmäßige Überprüfung der Strategie und frühzeitige Identifikation von Problemen.",
      priority: "medium"
    });
  }
  
  return strategies;
}

/**
 * Determine risk level from score
 * @param {Number} riskScore - Risk score (0-1)
 * @returns {String} Risk level
 */
function determineRiskLevel(riskScore) {
  if (riskScore < 0.3) {
    return "low";
  } else if (riskScore < 0.7) {
    return "medium";
  } else {
    return "high";
  }
}

/**
 * Calculate confidence in risk assessment
 * @param {Object} caseAnalysis - Case analysis results
 * @param {Object} historicalPatterns - Historical patterns analysis
 * @returns {Number} Confidence score (0-1)
 */
function calculateRiskAssessmentConfidence(caseAnalysis, historicalPatterns) {
  let confidence = 0.5; // Base confidence
  
  // Increase for thorough case analysis
  if (caseAnalysis.confidence) {
    confidence += caseAnalysis.confidence * 0.3;
  }
  
  // Increase for substantial historical data
  if (historicalPatterns.totalCases > 50) {
    confidence += 0.2;
  } else if (historicalPatterns.totalCases > 20) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

// Export functions
module.exports = {
  assessOptimizedCaseRisk,
  analyzeHistoricalPatterns,
  calculateOptimizedRiskScore,
  identifyRiskFactors,
  generateRiskMitigationStrategies,
  determineRiskLevel,
  calculateRiskAssessmentConfidence,
  batchRiskAssessment
};