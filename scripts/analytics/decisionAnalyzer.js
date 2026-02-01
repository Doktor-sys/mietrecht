/**
 * Decision Analysis Module
 * This module provides advanced analysis capabilities for court decisions.
 */

const { getAllCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');
const { recordMetric } = require('../database/dao/dashboardMetricsDao.js');

// Import the new predictive model
const { performPredictiveAnalysis } = require('./legalPrecedentPredictor.js');

// Import enhanced ML models
const { performEnhancedPredictiveAnalysis } = require('../ml/predictiveLegalModel.js');

/**
 * Analyze decision trends over time
 * @returns {Promise<Object>} Trend analysis results
 */
async function analyzeDecisionTrends() {
  try {
    // Get all court decisions
    const decisions = await getAllCourtDecisions({ limit: 1000 });
    
    // Group decisions by month
    const monthlyCounts = {};
    const topicCounts = {};
    const courtCounts = {};
    
    decisions.forEach(decision => {
      // Parse decision date
      if (decision.decision_date) {
        const date = new Date(decision.decision_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Count decisions per month
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
      
      // Count decisions by topic
      if (decision.topics) {
        decision.topics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
      
      // Count decisions by court
      if (decision.court) {
        courtCounts[decision.court] = (courtCounts[decision.court] || 0) + 1;
      }
    });
    
    // Sort topics by frequency
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Sort courts by frequency
    const sortedCourts = Object.entries(courtCounts)
      .sort((a, b) => b[1] - a[1]);
    
    // Record analysis metrics
    if (sortedTopics.length > 0) {
      await recordMetric('most_common_topic', sortedTopics[0][1]);
    }
    
    return {
      monthlyTrends: monthlyCounts,
      topTopics: sortedTopics,
      courtDistribution: sortedCourts
    };
  } catch (error) {
    console.error('Error analyzing decision trends:', error);
    throw error;
  }
}

/**
 * Analyze lawyer specialization patterns
 * @returns {Promise<Object>} Lawyer specialization analysis
 */
async function analyzeLawyerSpecializations() {
  try {
    // Get all lawyers
    const lawyers = await getAllLawyers();
    
    // Count practice areas
    const practiceAreaCounts = {};
    
    lawyers.forEach(lawyer => {
      if (lawyer.practice_areas) {
        lawyer.practice_areas.forEach(area => {
          practiceAreaCounts[area] = (practiceAreaCounts[area] || 0) + 1;
        });
      }
    });
    
    // Sort practice areas by frequency
    const sortedPracticeAreas = Object.entries(practiceAreaCounts)
      .sort((a, b) => b[1] - a[1]);
    
    // Calculate specialization diversity
    const specializationDiversity = sortedPracticeAreas.length > 0 ? 
      sortedPracticeAreas.length / lawyers.length : 0;
    
    return {
      practiceAreaDistribution: sortedPracticeAreas,
      totalLawyers: lawyers.length,
      specializationDiversity
    };
  } catch (error) {
    console.error('Error analyzing lawyer specializations:', error);
    throw error;
  }
}

/**
 * Analyze decision impact factors
 * @returns {Promise<Object>} Impact factor analysis
 */
async function analyzeDecisionImpact() {
  try {
    // Get all court decisions
    const decisions = await getAllCourtDecisions({ limit: 1000 });
    
    // Count decisions by importance
    const importanceCounts = {};
    
    decisions.forEach(decision => {
      if (decision.importance) {
        importanceCounts[decision.importance] = (importanceCounts[decision.importance] || 0) + 1;
      }
    });
    
    // Calculate average topics per decision
    const totalTopics = decisions.reduce((sum, decision) => {
      return sum + (decision.topics ? decision.topics.length : 0);
    }, 0);
    
    const avgTopicsPerDecision = decisions.length > 0 ? totalTopics / decisions.length : 0;
    
    // Record metrics
    await recordMetric('avg_topics_per_decision', avgTopicsPerDecision);
    
    // Calculate impact distribution percentages
    const totalWithImportance = Object.values(importanceCounts).reduce((sum, count) => sum + count, 0);
    const importancePercentages = {};
    Object.entries(importanceCounts).forEach(([level, count]) => {
      importancePercentages[level] = totalWithImportance > 0 ? (count / totalWithImportance) * 100 : 0;
    });
    
    return {
      importanceDistribution: importanceCounts,
      importancePercentages,
      averageTopicsPerDecision: avgTopicsPerDecision,
      totalDecisions: decisions.length
    };
  } catch (error) {
    console.error('Error analyzing decision impact:', error);
    throw error;
  }
}

/**
 * Perform comprehensive analysis
 * @returns {Promise<Object>} Comprehensive analysis results
 */
async function performComprehensiveAnalysis() {
  try {
    console.log('Performing comprehensive analysis...');
    
    // Run all analyses
    const [trendAnalysis, specializationAnalysis, impactAnalysis, predictiveAnalysis, enhancedPredictiveAnalysis] = await Promise.all([
      analyzeDecisionTrends(),
      analyzeLawyerSpecializations(),
      analyzeDecisionImpact(),
      performPredictiveAnalysis(),
      performEnhancedPredictiveAnalysis()
    ]);
    
    console.log('Comprehensive analysis completed');
    
    return {
      trends: trendAnalysis,
      specializations: specializationAnalysis,
      impact: impactAnalysis,
      predictions: predictiveAnalysis,
      enhancedPredictions: enhancedPredictiveAnalysis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing comprehensive analysis:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  analyzeDecisionTrends,
  analyzeLawyerSpecializations,
  analyzeDecisionImpact,
  performComprehensiveAnalysis
};