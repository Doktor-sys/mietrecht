/**
 * Personalized Recommendation Engine
 * This module provides personalized recommendations for legal decisions based on lawyer preferences.
 */

const { getAllCourtDecisions, getRecentCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');
const { createUserInteraction, getUserInteractionsByLawyer } = require('../database/dao/userInteractionDao.js');

// Neue Abhängigkeiten für verbesserte Empfehlungen
const tf = require('@tensorflow/tfjs-node');

/**
 * Calculate lawyer preference profile based on interactions and explicit preferences
 * @param {Object} lawyer - Lawyer object
 * @param {Array} interactions - User interactions for this lawyer
 * @returns {Object} Preference profile
 */
function calculatePreferenceProfile(lawyer, interactions) {
  const profile = {
    preferredTopics: {},
    preferredCourts: {},
    preferredImportanceLevels: {},
    activityPattern: {}, // When the lawyer is most active
    engagementScore: 0
  };
  
  // Start with explicit preferences
  if (lawyer.topics) {
    lawyer.topics.forEach(topic => {
      profile.preferredTopics[topic] = 2.0; // Base weight for explicit preferences
    });
  }
  
  if (lawyer.court_levels) {
    lawyer.court_levels.forEach(court => {
      profile.preferredCourts[court] = 2.0;
    });
  }
  
  // Enhance with interaction data
  if (interactions && interactions.length > 0) {
    // Count interactions by type
    const interactionCounts = {};
    interactions.forEach(interaction => {
      interactionCounts[interaction.interaction_type] = 
        (interactionCounts[interaction.interaction_type] || 0) + 1;
    });
    
    // Calculate engagement score
    const viewCount = interactionCounts['view'] || 0;
    const clickCount = interactionCounts['click'] || 0;
    const downloadCount = interactionCounts['download'] || 0;
    const shareCount = interactionCounts['share'] || 0;
    
    profile.engagementScore = viewCount + (clickCount * 2) + (downloadCount * 3) + (shareCount * 4);
    
    // Analyze interaction timing for activity patterns
    const hours = Array(24).fill(0);
    interactions.forEach(interaction => {
      if (interaction.created_at) {
        const hour = new Date(interaction.created_at).getHours();
        hours[hour]++;
      }
    });
    
    // Find peak activity hours
    const maxHour = hours.indexOf(Math.max(...hours));
    profile.activityPattern.peakHour = maxHour;
    profile.activityPattern.isActiveMorning = (hours[6] + hours[7] + hours[8] + hours[9]) > 
      (hours[18] + hours[19] + hours[20] + hours[21]);
    
    // Analyze decision characteristics from interactions
    interactions.forEach(interaction => {
      if (interaction.decision) {
        // Topic preferences from interactions
        if (interaction.decision.topics) {
          interaction.decision.topics.forEach(topic => {
            profile.preferredTopics[topic] = (profile.preferredTopics[topic] || 0) + 0.5;
          });
        }
        
        // Court preferences from interactions
        if (interaction.decision.court) {
          profile.preferredCourts[interaction.decision.court] = 
            (profile.preferredCourts[interaction.decision.court] || 0) + 0.5;
        }
        
        // Importance level preferences
        if (interaction.decision.importance) {
          profile.preferredImportanceLevels[interaction.decision.importance] = 
            (profile.preferredImportanceLevels[interaction.decision.importance] || 0) + 0.5;
        }
      }
    });
  }
  
  return profile;
}

/**
 * Score a decision for a specific lawyer based on their preference profile
 * @param {Object} decision - Court decision object
 * @param {Object} lawyerProfile - Lawyer's preference profile
 * @returns {number} Recommendation score (0-10)
 */
function scoreDecisionForLawyer(decision, lawyerProfile) {
  let score = 0;
  let maxPossibleScore = 10;
  
  // Topic relevance (40% of score)
  if (decision.topics && decision.topics.length > 0) {
    let topicScore = 0;
    decision.topics.forEach(topic => {
      topicScore += lawyerProfile.preferredTopics[topic] || 0;
    });
    
    // Normalize by number of topics
    topicScore = Math.min(4, (topicScore / Math.max(1, decision.topics.length)) * 4);
    score += topicScore;
  }
  
  // Court relevance (20% of score)
  if (decision.court) {
    const courtScore = Math.min(2, (lawyerProfile.preferredCourts[decision.court] || 0) * 2);
    score += courtScore;
  }
  
  // Importance level relevance (15% of score)
  if (decision.importance) {
    const importanceScore = Math.min(1.5, (lawyerProfile.preferredImportanceLevels[decision.importance] || 0) * 1.5);
    score += importanceScore;
  }
  
  // Recency factor (15% of score)
  if (decision.decision_date) {
    const decisionDate = new Date(decision.decision_date);
    const daysOld = (Date.now() - decisionDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // More recent decisions get higher scores (exponential decay)
    const recencyScore = Math.min(1.5, Math.max(0, 1.5 * Math.exp(-daysOld / 30))); // Half-life of 30 days
    score += recencyScore;
  }
  
  // Novelty factor (10% of score) - decisions the lawyer hasn't seen before
  // This would require tracking what decisions each lawyer has interacted with
  // For now, we'll give a small boost to newer decisions they haven't interacted with
  
  return Math.min(10, score); // Cap at 10
}

/**
 * NEW: Enhanced scoring using neural network
 * @param {Object} decision - Court decision object
 * @param {Object} lawyerProfile - Lawyer's preference profile
 * @returns {number} Enhanced recommendation score (0-10)
 */
async function scoreDecisionWithNN(decision, lawyerProfile) {
  // Extract features for the neural network
  const features = [
    // Topic relevance (normalized)
    calculateTopicRelevance(decision.topics, lawyerProfile.preferredTopics),
    // Court relevance (normalized)
    lawyerProfile.preferredCourts[decision.court] || 0,
    // Importance level relevance (normalized)
    lawyerProfile.preferredImportanceLevels[decision.importance] || 0,
    // Recency factor (0-1)
    calculateRecencyFactor(decision.decision_date),
    // Engagement score of the lawyer (normalized)
    Math.min(1, lawyerProfile.engagementScore / 100),
    // Novelty factor (0-1)
    calculateNoveltyFactor(decision.id, lawyerProfile)
  ];
  
  // In a real implementation, we would use a trained neural network model
  // For now, we'll simulate the behavior with a weighted sum
  const weights = [0.3, 0.2, 0.15, 0.15, 0.1, 0.1]; // Weights for each feature
  let weightedScore = 0;
  
  features.forEach((feature, index) => {
    weightedScore += feature * weights[index];
  });
  
  // Scale to 0-10 range
  return weightedScore * 10;
}

/**
 * Helper function to calculate topic relevance
 * @param {Array} topics - Decision topics
 * @param {Object} preferredTopics - Lawyer's preferred topics
 * @returns {number} Topic relevance score (0-1)
 */
function calculateTopicRelevance(topics, preferredTopics) {
  if (!topics || topics.length === 0) return 0;
  
  let totalRelevance = 0;
  topics.forEach(topic => {
    totalRelevance += preferredTopics[topic] || 0;
  });
  
  // Normalize by number of topics and max possible relevance
  const maxRelevance = Math.max(...Object.values(preferredTopics), 1);
  return Math.min(1, totalRelevance / (topics.length * maxRelevance));
}

/**
 * Helper function to calculate recency factor
 * @param {String} decisionDate - Decision date
 * @returns {number} Recency factor (0-1)
 */
function calculateRecencyFactor(decisionDate) {
  if (!decisionDate) return 0.5;
  
  const date = new Date(decisionDate);
  const now = new Date();
  const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
  
  // Exponential decay - more recent = higher score
  return Math.exp(-daysDiff / 30); // Half-life of 30 days
}

/**
 * Helper function to calculate novelty factor
 * @param {number} decisionId - Decision ID
 * @param {Object} lawyerProfile - Lawyer's profile
 * @returns {number} Novelty factor (0-1)
 */
function calculateNoveltyFactor(decisionId, lawyerProfile) {
  // In a real implementation, this would check if the lawyer has interacted with this decision
  // For now, we'll simulate with a random factor
  return Math.random();
}

/**
 * NEW: Collaborative filtering for lawyer recommendations
 * @param {Object} targetLawyer - Target lawyer object
 * @param {Array} allLawyers - All lawyers
 * @param {Array} allDecisions - All court decisions
 * @returns {Array} Array of similar lawyers with similarity scores
 */
function findSimilarLawyers(targetLawyer, allLawyers, allDecisions) {
  // Calculate similarity between lawyers based on their preferences and interactions
  const similarities = [];
  
  allLawyers.forEach(lawyer => {
    if (lawyer.id === targetLawyer.id) return; // Skip target lawyer
    
    // Calculate similarity based on shared practice areas
    const practiceAreaSimilarity = calculatePracticeAreaSimilarity(
      targetLawyer.practice_areas || [], 
      lawyer.practice_areas || []
    );
    
    // Calculate similarity based on topic preferences
    const topicSimilarity = calculateTopicPreferenceSimilarity(
      targetLawyer.topics || [], 
      lawyer.topics || []
    );
    
    // Combined similarity score
    const similarity = (practiceAreaSimilarity * 0.6) + (topicSimilarity * 0.4);
    
    if (similarity > 0.1) { // Only include lawyers with significant similarity
      similarities.push({
        lawyer,
        similarity
      });
    }
  });
  
  // Sort by similarity and return top 10
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
}

/**
 * Helper function to calculate practice area similarity
 * @param {Array} areas1 - First lawyer's practice areas
 * @param {Array} areas2 - Second lawyer's practice areas
 * @returns {number} Similarity score (0-1)
 */
function calculatePracticeAreaSimilarity(areas1, areas2) {
  if (areas1.length === 0 || areas2.length === 0) return 0;
  
  // Calculate Jaccard similarity
  const set1 = new Set(areas1);
  const set2 = new Set(areas2);
  const intersection = [...set1].filter(area => set2.has(area)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Helper function to calculate topic preference similarity
 * @param {Array} topics1 - First lawyer's topics
 * @param {Array} topics2 - Second lawyer's topics
 * @returns {number} Similarity score (0-1)
 */
function calculateTopicPreferenceSimilarity(topics1, topics2) {
  if (topics1.length === 0 || topics2.length === 0) return 0;
  
  // Calculate cosine similarity
  const set1 = new Set(topics1);
  const set2 = new Set(topics2);
  
  const intersection = [...set1].filter(topic => set2.has(topic)).length;
  const magnitude1 = Math.sqrt(set1.size);
  const magnitude2 = Math.sqrt(set2.size);
  
  return magnitude1 > 0 && magnitude2 > 0 ? intersection / (magnitude1 * magnitude2) : 0;
}

/**
 * NEW: Neural network model for recommendation scoring
 * @param {Array} trainingData - Training data for the model
 * @returns {Object} Trained model
 */
async function trainRecommendationModel(trainingData) {
  // Prepare training data
  const xs = trainingData.map(item => [
    item.topicRelevance || 0,
    item.courtRelevance || 0,
    item.importanceRelevance || 0,
    item.recencyFactor || 0,
    item.lawyerEngagement || 0,
    item.noveltyFactor || 0
  ]);
  
  const ys = trainingData.map(item => [item.rating || 0]); // Rating scale 0-10
  
  // Create tensors
  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys);
  
  // Create model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [6] }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'linear' })); // Output rating 0-10
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  // Train model
  await model.fit(xTensor, yTensor, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2
  });
  
  return model;
}

/**
 * Generate personalized recommendations for a lawyer
 * @param {Object} lawyer - Lawyer object
 * @param {Array} allDecisions - All court decisions
 * @param {Array} lawyerInteractions - Lawyer's interactions
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} Array of recommended decisions with scores
 */
function generateRecommendations(lawyer, allDecisions, lawyerInteractions, limit = 10) {
  // Calculate lawyer's preference profile
  const profile = calculatePreferenceProfile(lawyer, lawyerInteractions);
  
  // Score all decisions for this lawyer
  const scoredDecisions = allDecisions
    .map(decision => ({
      decision,
      score: scoreDecisionForLawyer(decision, profile)
    }))
    .filter(item => item.score > 2) // Only include decisions with reasonable scores
    .sort((a, b) => b.score - a.score) // Sort by score (highest first)
    .slice(0, limit); // Take top N
  
  return scoredDecisions;
}

/**
 * NEW: Generate enhanced personalized recommendations using collaborative filtering
 * @param {Object} lawyer - Lawyer object
 * @param {Array} allDecisions - All court decisions
 * @param {Array} allLawyers - All lawyers
 * @param {Array} lawyerInteractions - Lawyer's interactions
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} Array of recommended decisions with scores
 */
async function generateEnhancedRecommendations(lawyer, allDecisions, allLawyers, lawyerInteractions, limit = 10) {
  // Calculate lawyer's preference profile
  const profile = calculatePreferenceProfile(lawyer, lawyerInteractions);
  
  // Find similar lawyers
  const similarLawyers = findSimilarLawyers(lawyer, allLawyers, allDecisions);
  
  // Score all decisions using enhanced methods
  const scoredDecisions = [];
  
  for (const decision of allDecisions) {
    // Calculate personal score
    const personalScore = scoreDecisionForLawyer(decision, profile);
    
    // Calculate collaborative score based on similar lawyers
    let collaborativeScore = 0;
    if (similarLawyers.length > 0) {
      let totalSimilarity = 0;
      let weightedScore = 0;
      
      for (const similarLawyer of similarLawyers) {
        // In a real implementation, we would get this lawyer's interactions with the decision
        // For now, we'll simulate with a random score weighted by similarity
        const simulatedScore = Math.random() * 10; // 0-10
        weightedScore += simulatedScore * similarLawyer.similarity;
        totalSimilarity += similarLawyer.similarity;
      }
      
      collaborativeScore = totalSimilarity > 0 ? weightedScore / totalSimilarity : 0;
    }
    
    // Combined score (70% personal, 30% collaborative)
    const combinedScore = (personalScore * 0.7) + (collaborativeScore * 0.3);
    
    if (combinedScore > 2) { // Only include decisions with reasonable scores
      scoredDecisions.push({
        decision,
        score: combinedScore,
        personalScore,
        collaborativeScore
      });
    }
  }
  
  // Sort by combined score and return top N
  return scoredDecisions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get personalized recommendations for a specific lawyer
 * @param {number} lawyerId - Lawyer ID
 * @param {Object} options - Options for recommendations
 * @returns {Promise<Array>} Array of recommended decisions
 */
async function getPersonalizedRecommendations(lawyerId, options = {}) {
  try {
    // Get the lawyer
    const lawyers = await getAllLawyers();
    const lawyer = lawyers.find(l => l.id === lawyerId);
    
    if (!lawyer) {
      throw new Error(`Lawyer with ID ${lawyerId} not found`);
    }
    
    // Get lawyer's interactions
    const lawyerInteractions = await getUserInteractionsByLawyer(lawyerId);
    
    // Get all decisions (or recent decisions based on options)
    let allDecisions;
    if (options.recentOnly) {
      allDecisions = await getRecentCourtDecisions({
        since: new Date(Date.now() - (options.days || 30) * 24 * 60 * 60 * 1000).toISOString(),
        limit: options.limit || 100
      });
    } else {
      allDecisions = await getAllCourtDecisions({ limit: options.limit || 500 });
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      lawyer, 
      allDecisions, 
      lawyerInteractions, 
      options.count || 10
    );
    
    return recommendations;
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    throw error;
  }
}

/**
 * NEW: Get enhanced personalized recommendations using collaborative filtering
 * @param {number} lawyerId - Lawyer ID
 * @param {Object} options - Options for recommendations
 * @returns {Promise<Array>} Array of recommended decisions
 */
async function getEnhancedPersonalizedRecommendations(lawyerId, options = {}) {
  try {
    // Get the lawyer
    const lawyers = await getAllLawyers();
    const lawyer = lawyers.find(l => l.id === lawyerId);
    
    if (!lawyer) {
      throw new Error(`Lawyer with ID ${lawyerId} not found`);
    }
    
    // Get lawyer's interactions
    const lawyerInteractions = await getUserInteractionsByLawyer(lawyerId);
    
    // Get all decisions (or recent decisions based on options)
    let allDecisions;
    if (options.recentOnly) {
      allDecisions = await getRecentCourtDecisions({
        since: new Date(Date.now() - (options.days || 30) * 24 * 60 * 60 * 1000).toISOString(),
        limit: options.limit || 100
      });
    } else {
      allDecisions = await getAllCourtDecisions({ limit: options.limit || 500 });
    }
    
    // Generate enhanced recommendations
    const recommendations = await generateEnhancedRecommendations(
      lawyer, 
      allDecisions, 
      lawyers,
      lawyerInteractions, 
      options.count || 10
    );
    
    return recommendations;
  } catch (error) {
    console.error('Error generating enhanced personalized recommendations:', error);
    throw error;
  }
}

/**
 * Update recommendation model based on new interaction
 * @param {Object} interaction - User interaction object
 * @returns {Promise<void>}
 */
async function updateRecommendationModel(interaction) {
  try {
    // In a more advanced implementation, this would update a machine learning model
    // For now, we'll just ensure the interaction is recorded properly
    console.log('Recommendation model update triggered by interaction:', interaction);
    
    // Record the interaction for future recommendation calculations
    // This is already handled by the DAO, but we could add additional processing here
  } catch (error) {
    console.error('Error updating recommendation model:', error);
    throw error;
  }
}

/**
 * Get similar lawyers based on preference profiles for collaborative filtering
 * @param {Object} targetLawyer - Target lawyer object
 * @param {Array} allLawyers - All lawyers
 * @returns {Array} Array of similar lawyers
 */
function findSimilarLawyers(targetLawyer, allLawyers) {
  // This would implement collaborative filtering
  // For now, we'll return a simple similarity based on shared practice areas
  
  const targetAreas = new Set(targetLawyer.practice_areas || []);
  
  return allLawyers
    .filter(lawyer => lawyer.id !== targetLawyer.id)
    .map(lawyer => {
      const lawyerAreas = new Set(lawyer.practice_areas || []);
      
      // Calculate Jaccard similarity of practice areas
      const intersection = [...targetAreas].filter(area => lawyerAreas.has(area)).length;
      const union = new Set([...targetAreas, ...lawyerAreas]).size;
      const similarity = union > 0 ? intersection / union : 0;
      
      return {
        lawyer,
        similarity
      };
    })
    .filter(item => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 similar lawyers
}

// Export functions
module.exports = {
  calculatePreferenceProfile,
  scoreDecisionForLawyer,
  scoreDecisionWithNN,
  calculateTopicRelevance,
  calculateRecencyFactor,
  calculateNoveltyFactor,
  findSimilarLawyers,
  calculatePracticeAreaSimilarity,
  calculateTopicPreferenceSimilarity,
  trainRecommendationModel,
  generateRecommendations,
  generateEnhancedRecommendations,
  getPersonalizedRecommendations,
  getEnhancedPersonalizedRecommendations,
  updateRecommendationModel
};