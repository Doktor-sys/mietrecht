/**
 * Client Profiler for Mietrecht Agent
 * This module creates and manages client profiles for personalized recommendations.
 */

/**
 * Create a client profile based on case history and preferences
 * @param {Object} clientData - Client data including history and preferences
 * @returns {Object} Client profile
 */
function createClientProfile(clientData) {
  if (!clientData) {
    return createDefaultProfile();
  }
  
  return {
    id: clientData.id || null,
    demographics: extractDemographics(clientData),
    legalHistory: analyzeLegalHistory(clientData.history || []),
    preferences: extractPreferences(clientData.preferences || {}),
    riskTolerance: determineRiskTolerance(clientData),
    communicationStyle: determineCommunicationStyle(clientData),
    financialSituation: assessFinancialSituation(clientData),
    goals: identifyClientGoals(clientData),
    satisfactionFactors: identifySatisfactionFactors(clientData)
  };
}

/**
 * Create a default client profile
 * @returns {Object} Default client profile
 */
function createDefaultProfile() {
  return {
    id: null,
    demographics: {
      ageGroup: "unknown",
      location: "unknown",
      occupation: "unknown"
    },
    legalHistory: {
      caseTypes: [],
      outcomes: [],
      experience: "unknown"
    },
    preferences: {
      communication: "email",
      detailLevel: "medium",
      involvement: "medium"
    },
    riskTolerance: "medium",
    communicationStyle: "formal",
    financialSituation: "unknown",
    goals: ["fair_resolution"],
    satisfactionFactors: ["clear_communication", "reasonable_costs"]
  };
}

/**
 * Extract demographic information from client data
 * @param {Object} clientData - Client data
 * @returns {Object} Demographic information
 */
function extractDemographics(clientData) {
  return {
    ageGroup: clientData.ageGroup || "unknown",
    location: clientData.location || "unknown",
    occupation: clientData.occupation || "unknown",
    familyStatus: clientData.familyStatus || "unknown"
  };
}

/**
 * Analyze client's legal history
 * @param {Array} history - Client's legal history
 * @returns {Object} Legal history analysis
 */
function analyzeLegalHistory(history) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return {
      caseTypes: [],
      outcomes: [],
      experience: "first_time"
    };
  }
  
  // Extract case types
  const caseTypes = [...new Set(history.map(caseItem => caseItem.type || "unknown"))];
  
  // Extract outcomes
  const outcomes = history.map(caseItem => caseItem.outcome || "unknown");
  
  // Determine experience level
  let experience = "first_time";
  if (history.length > 5) {
    experience = "experienced";
  } else if (history.length > 1) {
    experience = "some_experience";
  }
  
  return {
    caseTypes,
    outcomes,
    experience
  };
}

/**
 * Extract client preferences
 * @param {Object} preferences - Client preferences
 * @returns {Object} Normalized preferences
 */
function extractPreferences(preferences) {
  return {
    communication: preferences.communication || "email",
    detailLevel: preferences.detailLevel || "medium",
    involvement: preferences.involvement || "medium",
    timeline: preferences.timeline || "flexible",
    costSensitivity: preferences.costSensitivity || "medium"
  };
}

/**
 * Determine client's risk tolerance
 * @param {Object} clientData - Client data
 * @returns {String} Risk tolerance level (low, medium, high)
 */
function determineRiskTolerance(clientData) {
  // If explicitly set, use that
  if (clientData.riskTolerance) {
    return clientData.riskTolerance;
  }
  
  // Otherwise, infer from various factors
  const history = clientData.history || [];
  const preferences = clientData.preferences || {};
  
  // Look at history of settled vs. litigated cases
  const settledCases = history.filter(caseItem => caseItem.outcome && caseItem.outcome.includes("settle")).length;
  const litigatedCases = history.filter(caseItem => caseItem.outcome && caseItem.outcome.includes("litigat")).length;
  
  // Look at preference for timeline
  const timelinePreference = preferences.timeline || "flexible";
  
  // Look at cost sensitivity
  const costSensitivity = preferences.costSensitivity || "medium";
  
  // Simple heuristic
  if (settledCases > litigatedCases || timelinePreference === "conservative" || costSensitivity === "high") {
    return "low"; // Low risk tolerance
  } else if (litigatedCases > settledCases || timelinePreference === "aggressive" || costSensitivity === "low") {
    return "high"; // High risk tolerance
  } else {
    return "medium"; // Medium risk tolerance
  }
}

/**
 * Determine client's communication style
 * @param {Object} clientData - Client data
 * @returns {String} Communication style
 */
function determineCommunicationStyle(clientData) {
  const preferences = clientData.preferences || {};
  
  // If explicitly set, use that
  if (preferences.communicationStyle) {
    return preferences.communicationStyle;
  }
  
  // Infer from communication preference
  const communicationPref = preferences.communication || "email";
  
  if (communicationPref === "phone") {
    return "direct";
  } else if (communicationPref === "email") {
    return "formal";
  } else if (communicationPref === "portal") {
    return "self_service";
  } else {
    return "formal"; // Default
  }
}

/**
 * Assess client's financial situation
 * @param {Object} clientData - Client data
 * @returns {String} Financial situation assessment
 */
function assessFinancialSituation(clientData) {
  if (clientData.financialSituation) {
    return clientData.financialSituation;
  }
  
  const preferences = clientData.preferences || {};
  const costSensitivity = preferences.costSensitivity || "medium";
  
  if (costSensitivity === "high") {
    return "limited";
  } else if (costSensitivity === "low") {
    return "comfortable";
  } else {
    return "moderate";
  }
}

/**
 * Identify client's primary goals
 * @param {Object} clientData - Client data
 * @returns {Array} Client goals
 */
function identifyClientGoals(clientData) {
  if (clientData.goals && Array.isArray(clientData.goals)) {
    return clientData.goals;
  }
  
  // Infer from case history and preferences
  const history = clientData.history || [];
  const preferences = clientData.preferences || {};
  
  const goals = ["fair_resolution"]; // Default goal
  
  // Add goals based on history
  const wonCases = history.filter(caseItem => caseItem.outcome && caseItem.outcome.includes("win")).length;
  const lostCases = history.filter(caseItem => caseItem.outcome && caseItem.outcome.includes("lose")).length;
  
  if (wonCases > lostCases) {
    goals.push("consistent_results");
  }
  
  // Add goals based on preferences
  if (preferences.detailLevel === "high") {
    goals.push("thorough_process");
  }
  
  if (preferences.involvement === "high") {
    goals.push("active_participation");
  }
  
  return [...new Set(goals)]; // Remove duplicates
}

/**
 * Identify factors that contribute to client satisfaction
 * @param {Object} clientData - Client data
 * @returns {Array} Satisfaction factors
 */
function identifySatisfactionFactors(clientData) {
  if (clientData.satisfactionFactors && Array.isArray(clientData.satisfactionFactors)) {
    return clientData.satisfactionFactors;
  }
  
  // Default satisfaction factors
  const factors = ["clear_communication", "reasonable_costs"];
  
  const preferences = clientData.preferences || {};
  
  // Add factors based on preferences
  if (preferences.detailLevel === "high") {
    factors.push("detailed_updates");
  }
  
  if (preferences.involvement === "high") {
    factors.push("consultation_opportunities");
  }
  
  if (preferences.timeline === "aggressive") {
    factors.push("prompt_action");
  }
  
  if (preferences.costSensitivity === "high") {
    factors.push("cost_transparency");
  }
  
  return factors;
}

/**
 * Update client profile with new information
 * @param {Object} existingProfile - Existing client profile
 * @param {Object} newInformation - New information to incorporate
 * @returns {Object} Updated client profile
 */
function updateClientProfile(existingProfile, newInformation) {
  if (!existingProfile) {
    return createClientProfile(newInformation);
  }
  
  // Create a copy of the existing profile
  const updatedProfile = JSON.parse(JSON.stringify(existingProfile));
  
  // Update with new information
  if (newInformation.demographics) {
    updatedProfile.demographics = {
      ...updatedProfile.demographics,
      ...newInformation.demographics
    };
  }
  
  if (newInformation.history) {
    updatedProfile.legalHistory = analyzeLegalHistory(newInformation.history);
  }
  
  if (newInformation.preferences) {
    updatedProfile.preferences = {
      ...updatedProfile.preferences,
      ...extractPreferences(newInformation.preferences)
    };
    
    // Recalculate derived attributes
    updatedProfile.riskTolerance = determineRiskTolerance(newInformation);
    updatedProfile.communicationStyle = determineCommunicationStyle(newInformation);
    updatedProfile.financialSituation = assessFinancialSituation(newInformation);
  }
  
  if (newInformation.goals) {
    updatedProfile.goals = [...new Set([...updatedProfile.goals, ...newInformation.goals])];
  }
  
  if (newInformation.satisfactionFactors) {
    updatedProfile.satisfactionFactors = [...new Set([...updatedProfile.satisfactionFactors, ...newInformation.satisfactionFactors])];
  }
  
  return updatedProfile;
}

// Export functions
module.exports = {
  createClientProfile,
  createDefaultProfile,
  updateClientProfile
};