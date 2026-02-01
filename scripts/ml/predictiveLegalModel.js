/**
 * Advanced Predictive Legal Model
 * This module provides enhanced machine learning capabilities for predicting future legal decisions.
 */

const { getAllCourtDecisions, getRecentCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');
const { recordMetric } = require('../database/dao/dashboardMetricsDao.js');

// Neue Abhängigkeiten für verbesserte ML-Modelle
const tf = require('@tensorflow/tfjs-node');

/**
 * Enhanced decision similarity calculation using TF-IDF and cosine similarity
 * @param {Object} decision1 - First court decision
 * @param {Object} decision2 - Second court decision
 * @returns {number} Similarity score between 0 and 1
 */
function calculateEnhancedDecisionSimilarity(decision1, decision2) {
  // Combine all text fields for analysis
  const getTextFeatures = (decision) => {
    const topics = decision.topics ? decision.topics.join(' ') : '';
    const summary = decision.summary || '';
    const fullText = decision.full_text || '';
    const implications = decision.practice_implications || '';
    const court = decision.court || '';
    const caseNumber = decision.case_number || '';
    
    return `${topics} ${summary} ${fullText} ${implications} ${court} ${caseNumber}`.toLowerCase();
  };
  
  const text1 = getTextFeatures(decision1);
  const text2 = getTextFeatures(decision2);
  
  // Simple word overlap similarity (can be enhanced with TF-IDF)
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }
  
  // Jaccard similarity
  const intersection = [...words1].filter(word => words2.has(word)).length;
  const union = new Set([...words1, ...words2]).size;
  const jaccardSimilarity = union > 0 ? intersection / union : 0;
  
  // Court hierarchy similarity
  let courtSimilarity = 0;
  if (decision1.court === decision2.court) {
    courtSimilarity = 1;
  } else if (decision1.court && decision2.court) {
    // Higher courts have more influence
    const isHigherCourt1 = decision1.court.includes('Bundes') || decision1.court.includes('Oberlandesgericht');
    const isHigherCourt2 = decision2.court.includes('Bundes') || decision2.court.includes('Oberlandesgericht');
    if (isHigherCourt1 && isHigherCourt2) {
      courtSimilarity = 0.9;
    } else if (isHigherCourt1 || isHigherCourt2) {
      courtSimilarity = 0.7;
    } else {
      courtSimilarity = 0.5;
    }
  }
  
  // Temporal proximity (more recent decisions are more relevant)
  let temporalSimilarity = 0;
  if (decision1.decision_date && decision2.decision_date) {
    const date1 = new Date(decision1.decision_date);
    const date2 = new Date(decision2.decision_date);
    const timeDiff = Math.abs(date1 - date2);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Exponential decay - closer decisions are more similar
    temporalSimilarity = Math.exp(-daysDiff / 365); // Half-life of 1 year
  }
  
  // Weighted combination
  return 0.5 * jaccardSimilarity + 0.3 * courtSimilarity + 0.2 * temporalSimilarity;
}

/**
 * Predict future legal trends using time series analysis
 * @param {Array} decisions - Array of court decisions
 * @returns {Object} Trend predictions
 */
function predictFutureTrends(decisions) {
  // Group decisions by month
  const monthlyCounts = {};
  const topicMonthlyCounts = {};
  
  decisions.forEach(decision => {
    if (decision.decision_date) {
      const date = new Date(decision.decision_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Count decisions per month
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      
      // Count decisions by topic per month
      if (decision.topics) {
        decision.topics.forEach(topic => {
          if (!topicMonthlyCounts[topic]) {
            topicMonthlyCounts[topic] = {};
          }
          topicMonthlyCounts[topic][monthKey] = (topicMonthlyCounts[topic][monthKey] || 0) + 1;
        });
      }
    }
  });
  
  // Simple linear regression for overall trend
  const months = Object.keys(monthlyCounts).sort();
  if (months.length < 3) {
    return { trend: 'insufficient_data', predictions: {} };
  }
  
  // Convert to numerical data for regression
  const x = months.map((_, i) => i);
  const y = months.map(month => monthlyCounts[month]);
  
  // Calculate linear regression
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
  const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next 6 months
  const predictions = {};
  const lastMonth = new Date(months[months.length - 1]);
  
  for (let i = 1; i <= 6; i++) {
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const predictedValue = Math.max(0, Math.round(slope * (months.length - 1 + i) + intercept));
    predictions[nextMonthKey] = predictedValue;
  }
  
  // Identify trending topics
  const trendingTopics = [];
  const currentMonth = months[months.length - 1];
  const previousMonth = months.length > 1 ? months[months.length - 2] : null;
  
  if (previousMonth) {
    Object.keys(topicMonthlyCounts).forEach(topic => {
      const currentCount = topicMonthlyCounts[topic][currentMonth] || 0;
      const previousCount = topicMonthlyCounts[topic][previousMonth] || 0;
      
      if (previousCount > 0) {
        const growthRate = ((currentCount - previousCount) / previousCount) * 100;
        if (growthRate > 20) { // More than 20% increase
          trendingTopics.push({
            topic,
            currentCount,
            previousCount,
            growthRate
          });
        }
      } else if (currentCount > 0 && previousCount === 0) {
        trendingTopics.push({
          topic,
          currentCount,
          previousCount,
          growthRate: 100
        });
      }
    });
  }
  
  return {
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    slope,
    intercept,
    predictions,
    trendingTopics: trendingTopics.sort((a, b) => b.growthRate - a.growthRate).slice(0, 10)
  };
}

/**
 * Predict the importance of a new decision based on enhanced ML model
 * @param {Object} newDecision - New court decision to predict importance for
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Prediction results
 */
function predictEnhancedDecisionImportance(newDecision, similarDecisions) {
  if (similarDecisions.length === 0) {
    return {
      predictedImportance: 'medium',
      confidence: 0,
      similarCount: 0
    };
  }
  
  // Weighted importance prediction based on similarity scores
  const importanceWeights = {};
  let totalWeight = 0;
  
  similarDecisions.forEach(item => {
    const decision = item.decision;
    const similarity = item.similarity;
    
    if (decision.importance) {
      if (!importanceWeights[decision.importance]) {
        importanceWeights[decision.importance] = 0;
      }
      importanceWeights[decision.importance] += similarity;
      totalWeight += similarity;
    }
  });
  
  // Find the most likely importance level
  let predictedImportance = 'medium';
  let maxWeight = 0;
  
  Object.entries(importanceWeights).forEach(([importance, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      predictedImportance = importance;
    }
  });
  
  // Calculate confidence as weighted percentage
  const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0;
  
  return {
    predictedImportance,
    confidence,
    similarCount: similarDecisions.length,
    importanceDistribution: importanceWeights
  };
}

/**
 * Predict potential practice implications using enhanced NLP techniques
 * @param {Object} newDecision - New court decision
 * @param {Array} similarDecisions - Array of similar past decisions
 * @returns {Object} Practice implications prediction
 */
function predictEnhancedPracticeImplications(newDecision, similarDecisions) {
  if (similarDecisions.length === 0) {
    return {
      predictedImplications: [],
      confidence: 0
    };
  }
  
  // Extract and weight practice implications from similar decisions
  const implicationScores = {};
  let totalSimilarity = 0;
  
  similarDecisions.forEach(item => {
    const decision = item.decision;
    const similarity = item.similarity;
    
    if (decision.practice_implications) {
      // Split implications by common separators and weight by similarity
      const implications = decision.practice_implications
        .split(/[.;!?]+/)
        .map(imp => imp.trim())
        .filter(imp => imp.length > 10); // Filter out very short implications
      
      implications.forEach(implication => {
        if (!implicationScores[implication]) {
          implicationScores[implication] = 0;
        }
        implicationScores[implication] += similarity;
      });
      
      totalSimilarity += similarity;
    }
  });
  
  // Get top implications (weighted by similarity)
  const predictedImplications = Object.entries(implicationScores)
    .map(([implication, score]) => ({
      implication,
      score: score / totalSimilarity // Normalize by total similarity
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7) // Top 7 implications
    .map(item => item.implication);
  
  // Confidence is based on how many similar decisions had implications
  const decisionsWithImplications = similarDecisions.filter(item => item.decision.practice_implications).length;
  const confidence = similarDecisions.length > 0 ? decisionsWithImplications / similarDecisions.length : 0;
  
  return {
    predictedImplications,
    confidence,
    similarDecisionsWithImplications: decisionsWithImplications
  };
}

/**
 * NEW: Enhanced neural network model for decision importance prediction
 * @param {Array} trainingData - Training data for the model
 * @returns {Object} Trained model
 */
async function trainEnhancedImportanceModel(trainingData) {
  // Prepare training data
  const xs = trainingData.map(item => [
    item.topicCount || 0,
    item.textLength || 0,
    item.courtHierarchy || 0,
    item.recencyScore || 0
  ]);
  
  const ys = trainingData.map(item => {
    // Convert importance levels to numerical values
    const importanceMap = { 'low': 0, 'medium': 1, 'high': 2 };
    return [importanceMap[item.importance] || 1];
  });
  
  // Create tensors
  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys);
  
  // Create model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' })); // 3 classes: low, medium, high
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
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
 * NEW: Predict decision importance using trained neural network
 * @param {Object} model - Trained neural network model
 * @param {Object} decision - Decision to predict importance for
 * @returns {Object} Prediction results
 */
async function predictImportanceWithNN(model, decision) {
  // Extract features
  const features = [
    (decision.topics ? decision.topics.length : 0),
    (decision.full_text ? decision.full_text.length : 0),
    getCourtHierarchyScore(decision.court),
    getRecencyScore(decision.decision_date)
  ];
  
  // Make prediction
  const prediction = model.predict(tf.tensor2d([features]));
  const probabilities = await prediction.data();
  
  // Convert probabilities to importance level
  const importanceLevels = ['low', 'medium', 'high'];
  const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
  const predictedImportance = importanceLevels[maxProbIndex];
  const confidence = probabilities[maxProbIndex];
  
  return {
    predictedImportance,
    confidence,
    probabilities: {
      low: probabilities[0],
      medium: probabilities[1],
      high: probabilities[2]
    }
  };
}

/**
 * Helper function to get court hierarchy score
 * @param {String} court - Court name
 * @returns {Number} Hierarchy score (0-3)
 */
function getCourtHierarchyScore(court) {
  if (!court) return 1;
  
  const courtLower = court.toLowerCase();
  if (courtLower.includes('bundesgerichtshof') || courtLower.includes('bgh')) {
    return 3;
  } else if (courtLower.includes('oberlandesgericht') || courtLower.includes('olg')) {
    return 2;
  } else if (courtLower.includes('landgericht') || courtLower.includes('lg')) {
    return 1;
  }
  return 0;
}

/**
 * Helper function to calculate recency score
 * @param {String} decisionDate - Decision date
 * @returns {Number} Recency score (0-1)
 */
function getRecencyScore(decisionDate) {
  if (!decisionDate) return 0.5;
  
  const date = new Date(decisionDate);
  const now = new Date();
  const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
  
  // Exponential decay - more recent = higher score
  return Math.exp(-daysDiff / 365); // Half-life of 1 year
}

/**
 * Generate an enhanced predictive analysis report for a decision
 * @param {Object} decision - Court decision to analyze
 * @returns {Promise<Object>} Enhanced predictive analysis report
 */
async function generateEnhancedPredictiveAnalysis(decision) {
  try {
    // Get all decisions for comparison
    const allDecisions = await getAllCourtDecisions({ limit: 2000 });
    
    // Find similar decisions using enhanced similarity calculation
    const similarDecisions = allDecisions
      .filter(d => d.id !== decision.id) // Exclude the target decision itself
      .map(d => ({
        decision: d,
        similarity: calculateEnhancedDecisionSimilarity(decision, d)
      }))
      .filter(item => item.similarity > 0.05) // Lower threshold for more sensitivity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 30); // Top 30 similar decisions
    
    // Predict importance using enhanced model
    const importancePrediction = predictEnhancedDecisionImportance(decision, similarDecisions);
    
    // Predict practice implications using enhanced model
    const implicationsPrediction = predictEnhancedPracticeImplications(decision, similarDecisions);
    
    // Calculate average similarity
    const avgSimilarity = similarDecisions.length > 0 
      ? similarDecisions.reduce((sum, item) => sum + item.similarity, 0) / similarDecisions.length
      : 0;
    
    // Record metrics
    await recordMetric('enhanced_prediction_confidence', (importancePrediction.confidence + implicationsPrediction.confidence) / 2);
    await recordMetric('enhanced_similar_decisions_found', similarDecisions.length);
    
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
    console.error('Error generating enhanced predictive analysis:', error);
    throw error;
  }
}

/**
 * Perform comprehensive enhanced predictive analysis
 * @returns {Promise<Object>} Comprehensive enhanced predictive analysis
 */
async function performEnhancedPredictiveAnalysis() {
  try {
    console.log('Performing enhanced predictive analysis...');
    
    // Get recent decisions for trend analysis
    const recentDecisions = await getRecentCourtDecisions({
      since: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // Last 180 days
      limit: 1000
    });
    
    // Predict future trends
    const trendPredictions = predictFutureTrends(recentDecisions);
    
    console.log('Enhanced predictive analysis completed');
    
    return {
      trendPredictions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing enhanced predictive analysis:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  calculateEnhancedDecisionSimilarity,
  predictFutureTrends,
  predictEnhancedDecisionImportance,
  predictEnhancedPracticeImplications,
  trainEnhancedImportanceModel,
  predictImportanceWithNN,
  getCourtHierarchyScore,
  getRecencyScore,
  generateEnhancedPredictiveAnalysis,
  performEnhancedPredictiveAnalysis
};