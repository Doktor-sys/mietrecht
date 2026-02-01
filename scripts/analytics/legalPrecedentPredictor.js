/**
 * Legal Precedent Predictor Module
 * This module provides predictive modeling capabilities for legal precedents.
 */

const { getAllCourtDecisions, getRecentCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { recordMetric } = require('../database/dao/dashboardMetricsDao.js');

/**
 * Calculate similarity between two decisions based on topics and court
 * @param {Object} decision1 - First court decision
 * @param {Object} decision2 - Second court decision
 * @returns {number} Similarity score between 0 and 1
 */
function calculateDecisionSimilarity(decision1, decision2) {
  // Calculate topic similarity
  const topics1 = new Set(decision1.topics || []);
  const topics2 = new Set(decision2.topics || []);
  
  if (topics1.size === 0 || topics2.size === 0) {
    return 0;
  }
  
  // Jaccard similarity for topics
  const intersection = [...topics1].filter(topic => topics2.has(topic)).length;
  const union = new Set([...topics1, ...topics2]).size;
  const topicSimilarity = union > 0 ? intersection / union : 0;
  
  // Court similarity (1 if same court, 0.5 if same court level, 0 otherwise)
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
  
  // Weighted combination (70% topic similarity, 30% court similarity)
  return 0.7 * topicSimilarity + 0.3 * courtSimilarity;
}

/**
 * Predict the importance of a new decision based on similar past decisions
 * @param {Object} newDecision - New court decision to predict importance for
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Prediction results
 */
function predictDecisionImportance(newDecision, similarDecisions) {
  if (similarDecisions.length === 0) {
    return {
      predictedImportance: 'medium',
      confidence: 0,
      similarCount: 0
    };
  }
  
  // Count importance levels in similar decisions
  const importanceCounts = {};
  similarDecisions.forEach(decision => {
    if (decision.importance) {
      importanceCounts[decision.importance] = (importanceCounts[decision.importance] || 0) + 1;
    }
  });
  
  // Find the most common importance level
  let predictedImportance = 'medium';
  let maxCount = 0;
  let totalCount = 0;
  
  Object.entries(importanceCounts).forEach(([importance, count]) => {
    totalCount += count;
    if (count > maxCount) {
      maxCount = count;
      predictedImportance = importance;
    }
  });
  
  // Calculate confidence as percentage of similar decisions with the predicted importance
  const confidence = totalCount > 0 ? maxCount / totalCount : 0;
  
  return {
    predictedImportance,
    confidence,
    similarCount: similarDecisions.length,
    importanceDistribution: importanceCounts
  };
}

/**
 * Predict potential practice implications based on similar decisions
 * @param {Object} newDecision - New court decision
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Practice implications prediction
 */
function predictPracticeImplications(newDecision, similarDecisions) {
  if (similarDecisions.length === 0) {
    return {
      predictedImplications: [],
      confidence: 0
    };
  }
  
  // Extract practice implications from similar decisions
  const implicationCounts = {};
  let totalImplications = 0;
  
  similarDecisions.forEach(decision => {
    if (decision.practice_implications) {
      // Split implications by common separators
      const implications = decision.practice_implications
        .split(/[.;!?]+/)
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0);
      
      implications.forEach(implication => {
        implicationCounts[implication] = (implicationCounts[implication] || 0) + 1;
        totalImplications++;
      });
    }
  });
  
  // Get top implications (those appearing in more than 30% of similar decisions)
  const threshold = similarDecisions.length * 0.3;
  const predictedImplications = Object.entries(implicationCounts)
    .filter(([implication, count]) => count >= threshold)
    .map(([implication, count]) => ({
      implication,
      frequency: count / similarDecisions.length
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5) // Top 5 implications
    .map(item => item.implication);
  
  // Confidence is based on how many similar decisions had implications
  const decisionsWithImplications = similarDecisions.filter(d => d.practice_implications).length;
  const confidence = similarDecisions.length > 0 ? decisionsWithImplications / similarDecisions.length : 0;
  
  return {
    predictedImplications,
    confidence,
    similarDecisionsWithImplications: decisionsWithImplications
  };
}

/**
 * Find similar decisions to a given decision
 * @param {Object} targetDecision - Decision to find similar ones for
 * @param {Array} allDecisions - Array of all decisions to compare against
 * @param {number} limit - Maximum number of similar decisions to return
 * @returns {Array} Array of similar decisions with similarity scores
 */
function findSimilarDecisions(targetDecision, allDecisions, limit = 10) {
  // Calculate similarity scores for all decisions
  const similarities = allDecisions
    .filter(decision => decision.id !== targetDecision.id) // Exclude the target decision itself
    .map(decision => ({
      decision,
      similarity: calculateDecisionSimilarity(targetDecision, decision)
    }))
    .filter(item => item.similarity > 0.1) // Only consider decisions with some similarity
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
    .slice(0, limit); // Take top N
  
  return similarities;
}

/**
 * Generate a predictive analysis report for a decision
 * @param {Object} decision - Court decision to analyze
 * @returns {Promise<Object>} Predictive analysis report
 */
async function generatePredictiveAnalysis(decision) {
  try {
    // Get all decisions for comparison
    const allDecisions = await getAllCourtDecisions({ limit: 1000 });
    
    // Find similar decisions
    const similarDecisions = findSimilarDecisions(decision, allDecisions, 20);
    const similarDecisionObjects = similarDecisions.map(item => item.decision);
    
    // Predict importance
    const importancePrediction = predictDecisionImportance(decision, similarDecisionObjects);
    
    // Predict practice implications
    const implicationsPrediction = predictPracticeImplications(decision, similarDecisionObjects);
    
    // Calculate average similarity
    const avgSimilarity = similarDecisions.length > 0 
      ? similarDecisions.reduce((sum, item) => sum + item.similarity, 0) / similarDecisions.length
      : 0;
    
    // Record metrics
    await recordMetric('prediction_confidence', (importancePrediction.confidence + implicationsPrediction.confidence) / 2);
    await recordMetric('similar_decisions_found', similarDecisions.length);
    
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
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating predictive analysis:', error);
    throw error;
  }
}

/**
 * Get trend predictions for legal topics
 * @returns {Promise<Object>} Topic trend predictions
 */
async function getTopicTrendPredictions() {
  try {
    // Get recent decisions (last 30 days)
    const recentDecisions = await getRecentCourtDecisions({
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      limit: 500
    });
    
    // Get older decisions (31-60 days ago)
    const olderDecisions = await getRecentCourtDecisions({
      since: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      limit: 500
    });
    
    // Filter to only include decisions from 31-60 days ago
    const thirtyToSixtyDaysAgo = olderDecisions.filter(decision => {
      const decisionDate = new Date(decision.decision_date);
      const daysAgo = (Date.now() - decisionDate.getTime()) / (24 * 60 * 60 * 1000);
      return daysAgo >= 30 && daysAgo <= 60;
    });
    
    // Count topics in recent decisions
    const recentTopicCounts = {};
    recentDecisions.forEach(decision => {
      if (decision.topics) {
        decision.topics.forEach(topic => {
          recentTopicCounts[topic] = (recentTopicCounts[topic] || 0) + 1;
        });
      }
    });
    
    // Count topics in older decisions
    const olderTopicCounts = {};
    thirtyToSixtyDaysAgo.forEach(decision => {
      if (decision.topics) {
        decision.topics.forEach(topic => {
          olderTopicCounts[topic] = (olderTopicCounts[topic] || 0) + 1;
        });
      }
    });
    
    // Calculate trend indicators
    const trends = [];
    const allTopics = new Set([...Object.keys(recentTopicCounts), ...Object.keys(olderTopicCounts)]);
    
    allTopics.forEach(topic => {
      const recentCount = recentTopicCounts[topic] || 0;
      const olderCount = olderTopicCounts[topic] || 0;
      
      // Calculate trend (positive = increasing, negative = decreasing)
      const trend = recentCount - olderCount;
      const trendPercentage = olderCount > 0 ? (trend / olderCount) * 100 : (recentCount > 0 ? 100 : 0);
      
      trends.push({
        topic,
        recentCount,
        olderCount,
        trend,
        trendPercentage,
        direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
      });
    });
    
    // Sort by absolute trend value
    trends.sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend));
    
    // Identify hot topics (increasing significantly)
    const hotTopics = trends
      .filter(trend => trend.direction === 'increasing' && trend.trendPercentage > 50)
      .slice(0, 10);
    
    // Identify declining topics (decreasing significantly)
    const decliningTopics = trends
      .filter(trend => trend.direction === 'decreasing' && trend.trendPercentage > 50)
      .slice(0, 10);
    
    // Record metrics
    await recordMetric('hot_topics_count', hotTopics.length);
    await recordMetric('declining_topics_count', decliningTopics.length);
    
    return {
      totalTopics: trends.length,
      hotTopics,
      decliningTopics,
      allTrends: trends.slice(0, 20), // Top 20 trends
      period: {
        recent: 'Last 30 days',
        older: '31-60 days ago'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting topic trend predictions:', error);
    throw error;
  }
}

/**
 * Perform comprehensive predictive analysis
 * @returns {Promise<Object>} Comprehensive predictive analysis
 */
async function performPredictiveAnalysis() {
  try {
    console.log('Performing predictive analysis...');
    
    // Get topic trend predictions
    const topicTrends = await getTopicTrendPredictions();
    
    console.log('Predictive analysis completed');
    
    return {
      topicTrends,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing predictive analysis:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  calculateDecisionSimilarity,
  predictDecisionImportance,
  predictPracticeImplications,
  findSimilarDecisions,
  generatePredictiveAnalysis,
  getTopicTrendPredictions,
  performPredictiveAnalysis
};