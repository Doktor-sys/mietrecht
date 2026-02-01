/**
 * Contextual Filtering Module
 * This module provides contextual filtering for court decisions based on various factors
 */

/**
 * Applies contextual filtering to court decisions
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} context - Context object with filtering criteria
 * @returns {Array} Contextually filtered decisions
 */
function applyContextualFiltering(decisions, context) {
  // In a real implementation, this would use more sophisticated NLP and ML models
  // For this prototype, we'll use rule-based filtering with some randomness
  
  let filteredDecisions = [...decisions];
  
  // Filter by date range if provided
  if (context.dateRange) {
    const { from, to } = context.dateRange;
    filteredDecisions = filteredDecisions.filter(decision => {
      const decisionDate = new Date(decision.datum);
      return (!from || decisionDate >= new Date(from)) && 
             (!to || decisionDate <= new Date(to));
    });
  }
  
  // Filter by importance level if provided
  if (context.importanceLevels && context.importanceLevels.length > 0) {
    filteredDecisions = filteredDecisions.filter(decision => 
      context.importanceLevels.includes(decision.wichtigkeit)
    );
  }
  
  // Filter by court types if provided
  if (context.courtTypes && context.courtTypes.length > 0) {
    filteredDecisions = filteredDecisions.filter(decision => 
      context.courtTypes.includes(decision.gericht)
    );
  }
  
  // Filter by topics if provided
  if (context.topics && context.topics.length > 0) {
    filteredDecisions = filteredDecisions.filter(decision => 
      decision.themen.some(topic => context.topics.includes(topic))
    );
  }
  
  // Filter by regions if provided
  if (context.regions && context.regions.length > 0) {
    filteredDecisions = filteredDecisions.filter(decision => 
      decision.ort && context.regions.some(region => 
        decision.ort.toLowerCase().includes(region.toLowerCase())
      )
    );
  }
  
  // Filter by practice areas if provided
  if (context.practiceAreas && context.practiceAreas.length > 0) {
    // For this prototype, we assume practice areas are related to topics
    filteredDecisions = filteredDecisions.filter(decision => 
      decision.themen.some(topic => 
        context.practiceAreas.some(area => 
          topic.toLowerCase().includes(area.toLowerCase())
        )
      )
    );
  }
  
  // Apply temporal relevance (recent decisions are more relevant)
  if (context.temporalRelevance !== false) {
    const now = new Date();
    filteredDecisions = filteredDecisions.map(decision => {
      const decisionDate = new Date(decision.datum);
      const daysDiff = Math.floor((now - decisionDate) / (1000 * 60 * 60 * 24));
      
      // Boost score for recent decisions (within last 30 days)
      if (daysDiff <= 30) {
        return {
          ...decision,
          temporalBoost: Math.max(0, 1 - (daysDiff / 30)) // 1 for today, 0 for 30 days ago
        };
      }
      
      return decision;
    });
  }
  
  return filteredDecisions;
}

/**
 * Generates context based on lawyer profile and current situation
 * @param {Object} lawyer - Lawyer object
 * @param {Object} options - Additional options for context generation
 * @returns {Object} Context object
 */
function generateContext(lawyer, options = {}) {
  const context = {
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    practiceAreas: lawyer.schwerpunkte || [],
    regions: lawyer.regionen || [],
    preferences: lawyer.einstellungen || {},
    currentDate: new Date().toISOString().split('T')[0]
  };
  
  // Add seasonal context (e.g., heating cost season in winter)
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 2) { // November to March
    context.seasonalTopics = ["Heizkosten", "Nebenkostenabrechnung", "Winterdienst"];
  } else if (currentMonth >= 3 && currentMonth <= 5) { // April to June
    context.seasonalTopics = ["Modernisierung", "Kündigung", "Mietpreisanpassung"];
  } else { // July to October
    context.seasonalTopics = ["Mietminderung", "Schimmelbefall", "Reparatur"];
  }
  
  // Add temporal context (e.g., beginning of month for payment-related topics)
  const currentDay = new Date().getDate();
  if (currentDay <= 7) {
    context.temporalTopics = ["Mietzahlung", "Nebenkostenabrechnung", "Kündigungsfrist"];
  }
  
  // Add user behavior context if provided
  if (options.userBehavior) {
    context.userBehavior = options.userBehavior;
  }
  
  // Add current case context if provided
  if (options.currentCase) {
    context.currentCase = options.currentCase;
  }
  
  return context;
}

/**
 * Enhances decisions with contextual relevance scores
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} context - Context object
 * @returns {Array} Decisions with contextual relevance scores
 */
function enhanceWithContextualScores(decisions, context) {
  return decisions.map(decision => {
    let contextualScore = 0.5; // Base score
    
    // Boost for seasonal relevance
    if (context.seasonalTopics) {
      const seasonalMatch = decision.themen.some(topic => 
        context.seasonalTopics.includes(topic)
      );
      if (seasonalMatch) {
        contextualScore += 0.2;
      }
    }
    
    // Boost for temporal relevance
    if (context.temporalTopics) {
      const temporalMatch = decision.themen.some(topic => 
        context.temporalTopics.includes(topic)
      );
      if (temporalMatch) {
        contextualScore += 0.15;
      }
    }
    
    // Boost for practice area relevance
    if (context.practiceAreas) {
      const practiceAreaMatch = decision.themen.some(topic => 
        context.practiceAreas.some(area => 
          topic.toLowerCase().includes(area.toLowerCase())
        )
      );
      if (practiceAreaMatch) {
        contextualScore += 0.1;
      }
    }
    
    // Apply temporal boost if available
    if (decision.temporalBoost) {
      contextualScore += decision.temporalBoost * 0.1;
    }
    
    // Ensure score is between 0 and 1
    contextualScore = Math.min(Math.max(contextualScore, 0), 1);
    
    return {
      ...decision,
      contextualScore
    };
  });
}

/**
 * Combines AI relevance scores with contextual scores
 * @param {Array} decisions - Array of court decision objects with scores
 * @param {Number} aiWeight - Weight for AI relevance score (0-1)
 * @param {Number} contextualWeight - Weight for contextual score (0-1)
 * @returns {Array} Decisions with combined scores
 */
function combineScores(decisions, aiWeight = 0.7, contextualWeight = 0.3) {
  // Normalize weights
  const totalWeight = aiWeight + contextualWeight;
  const normalizedAiWeight = aiWeight / totalWeight;
  const normalizedContextualWeight = contextualWeight / totalWeight;
  
  return decisions.map(decision => {
    // Use existing relevanceScore or default to 0.5
    const aiScore = decision.relevanceScore || 0.5;
    // Use existing contextualScore or default to 0.5
    const contextualScore = decision.contextualScore || 0.5;
    
    // Combine scores
    const combinedScore = (aiScore * normalizedAiWeight) + 
                         (contextualScore * normalizedContextualWeight);
    
    return {
      ...decision,
      combinedScore
    };
  });
}

/**
 * Contextual filter function that combines all contextual filtering techniques
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object
 * @param {Array} interactionHistory - Lawyer's interaction history
 * @param {Object} options - Additional options
 * @returns {Array} Contextually filtered and scored decisions
 */
function contextualFilter(decisions, lawyer, interactionHistory = [], options = {}) {
  // Generate context based on lawyer profile
  const context = generateContext(lawyer, options);
  
  // Apply contextual filtering
  let filteredDecisions = applyContextualFiltering(decisions, context);
  
  // Enhance with contextual scores
  filteredDecisions = enhanceWithContextualScores(filteredDecisions, context);
  
  // If decisions already have AI relevance scores, combine them
  if (filteredDecisions.some(d => d.relevanceScore !== undefined)) {
    filteredDecisions = combineScores(filteredDecisions);
  }
  
  // Sort by combined score or contextual score
  filteredDecisions.sort((a, b) => {
    const scoreA = a.combinedScore || a.contextualScore || 0;
    const scoreB = b.combinedScore || b.contextualScore || 0;
    return scoreB - scoreA; // Descending order
  });
  
  return filteredDecisions;
}

// Export functions
module.exports = {
  applyContextualFiltering,
  generateContext,
  enhanceWithContextualScores,
  combineScores,
  contextualFilter
};