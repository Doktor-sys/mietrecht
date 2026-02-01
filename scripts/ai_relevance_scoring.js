/**
 * AI-based Relevance Scoring Module
 * This module provides AI-powered relevance scoring for court decisions
 */

// Mock implementation of AI relevance scoring
// In a real implementation, this would use a trained model or external API

/**
 * Calculates relevance score for a court decision based on lawyer preferences
 * @param {Object} decision - Court decision object
 * @param {Object} lawyer - Lawyer object with preferences
 * @param {Array} interactionHistory - Lawyer's interaction history (optional)
 * @returns {Number} Relevance score between 0 and 1
 */
function calculateRelevanceScore(decision, lawyer, interactionHistory = []) {
  // In a real implementation, this would use NLP and ML models
  // For this prototype, we'll use a rule-based approach with some randomness
  
  let score = 0.5; // Base score
  
  // Increase score based on matching court levels
  if (lawyer.einstellungen.gerichtsarten.includes(decision.gericht)) {
    score += 0.2;
  }
  
  // Increase score based on matching topics
  const matchingTopics = lawyer.einstellungen.themengebiete.filter(topic => 
    decision.themen.includes(topic)
  );
  
  score += matchingTopics.length * 0.1;
  
  // Adjust score based on importance level
  if (decision.wichtigkeit === "hoch") {
    score += 0.15;
  } else if (decision.wichtigkeit === "mittel") {
    score += 0.1;
  } else if (decision.wichtigkeit === "niedrig") {
    score += 0.05;
  }
  
  // Adjust score based on regions (if available)
  if (decision.ort && lawyer.regionen.some(region => 
    decision.ort.toLowerCase().includes(region.toLowerCase())
  )) {
    score += 0.1;
  }
  
  // Adjust score based on interaction history (learning preferences)
  if (interactionHistory.length > 0) {
    // Count interactions with similar topics
    const topicInteractions = interactionHistory.filter(interaction => {
      if (interaction.decision && interaction.decision.themen) {
        return interaction.decision.themen.some(topic => 
          decision.themen.includes(topic)
        );
      }
      return false;
    }).length;
    
    // Increase score based on interaction frequency
    if (topicInteractions > 0) {
      score += Math.min(topicInteractions * 0.05, 0.2); // Max 0.2 bonus
    }
  }
  
  // Ensure score is between 0 and 1
  score = Math.min(Math.max(score, 0), 1);
  
  // Add some randomness to simulate AI uncertainty
  const randomness = (Math.random() - 0.5) * 0.1; // +/- 5%
  score = Math.min(Math.max(score + randomness, 0), 1);
  
  return score;
}

/**
 * Enhanced filter function that uses AI relevance scoring
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object with preferences
 * @param {Array} interactionHistory - Lawyer's interaction history (optional)
 * @param {Number} threshold - Minimum relevance score (0-1, default 0.6)
 * @returns {Array} Filtered and sorted decisions
 */
function filterAndRankDecisions(decisions, lawyer, interactionHistory = [], threshold = 0.6) {
  // Calculate relevance scores for all decisions
  const scoredDecisions = decisions.map(decision => ({
    ...decision,
    relevanceScore: calculateRelevanceScore(decision, lawyer, interactionHistory)
  }));
  
  // Filter by threshold and sort by relevance score (descending)
  return scoredDecisions
    .filter(decision => decision.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generates personalized recommendations based on lawyer's practice history
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} lawyer - Lawyer object with preferences and history
 * @param {Array} interactionHistory - Lawyer's interaction history (optional)
 * @returns {Array} Personalized recommendations
 */
function generatePersonalizedRecommendations(decisions, lawyer, interactionHistory = []) {
  // For this prototype, we'll create simple recommendations
  // In a real implementation, this would use collaborative filtering or deep learning
  
  // Get top 3 most relevant decisions
  const relevantDecisions = filterAndRankDecisions(decisions, lawyer, interactionHistory, 0.5);
  const topDecisions = relevantDecisions.slice(0, 3);
  
  // Generate recommendations based on topics
  const allTopics = [...new Set(decisions.flatMap(d => d.themen))];
  const lawyerTopics = lawyer.einstellungen.themengebiete;
  
  // Find topics the lawyer hasn't explicitly selected but might be interested in
  const suggestedTopics = allTopics.filter(topic => 
    !lawyerTopics.includes(topic) && 
    decisions.some(d => 
      d.themen.includes(topic) && 
      calculateRelevanceScore(d, lawyer, interactionHistory) > 0.4
    )
  );
  
  return {
    recommendedDecisions: topDecisions,
    suggestedTopics: suggestedTopics.slice(0, 3), // Top 3 suggestions
    relevanceThreshold: 0.6
  };
}

/**
 * Updates lawyer preferences based on interaction history
 * @param {Object} lawyer - Lawyer object with preferences
 * @param {Array} interactions - Array of interaction objects
 * @returns {Object} Updated lawyer preferences
 */
function updateLawyerPreferences(lawyer, interactions) {
  // In a real implementation, this would use machine learning to adapt preferences
  // For this prototype, we'll simulate simple preference learning
  
  // Count topic interactions
  const topicInteractions = {};
  interactions.forEach(interaction => {
    if (interaction.type === 'view_decision' || interaction.type === 'click_link') {
      interaction.decision.themen.forEach(topic => {
        topicInteractions[topic] = (topicInteractions[topic] || 0) + 1;
      });
    }
  });
  
  // Find most interacted topics
  const sortedTopics = Object.entries(topicInteractions)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => topic);
  
  // Update preferences with top 2 new topics (if not already present)
  const currentTopics = lawyer.einstellungen.themengebiete;
  const newTopics = sortedTopics.filter(topic => !currentTopics.includes(topic));
  
  // Add up to 2 new topics to preferences
  const updatedTopics = [...currentTopics, ...newTopics.slice(0, 2)];
  
  return {
    ...lawyer,
    einstellungen: {
      ...lawyer.einstellungen,
      themengebiete: updatedTopics
    }
  };
}

/**
 * Learns from user interactions to improve future recommendations
 * @param {Array} interactions - Array of user interactions
 * @returns {Object} Learning insights
 */
function learnFromInteractions(interactions) {
  // In a real implementation, this would train/update ML models
  // For this prototype, we'll extract simple insights
  
  const insights = {
    totalInteractions: interactions.length,
    interactionTypes: {},
    popularTopics: {},
    engagementPatterns: {}
  };
  
  // Count interaction types
  interactions.forEach(interaction => {
    insights.interactionTypes[interaction.type] = 
      (insights.interactionTypes[interaction.type] || 0) + 1;
    
    if (interaction.decision && interaction.decision.themen) {
      interaction.decision.themen.forEach(topic => {
        insights.popularTopics[topic] = (insights.popularTopics[topic] || 0) + 1;
      });
    }
  });
  
  // Sort popular topics
  insights.popularTopics = Object.entries(insights.popularTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [topic, count]) => {
      obj[topic] = count;
      return obj;
    }, {});
  
  return insights;
}

// Export functions
module.exports = {
  calculateRelevanceScore,
  filterAndRankDecisions,
  generatePersonalizedRecommendations,
  updateLawyerPreferences,
  learnFromInteractions
};