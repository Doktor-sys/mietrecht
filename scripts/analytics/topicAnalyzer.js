/**
 * Topic Analysis Module
 * This module analyzes topics in court decisions to identify patterns and relationships.
 */

/**
 * Extract topic co-occurrence matrix
 * @param {Array} decisions - Array of court decisions
 * @returns {Object} Co-occurrence matrix
 */
function extractTopicCooccurrence(decisions) {
  const cooccurrence = {};
  
  decisions.forEach(decision => {
    if (decision.topics && decision.topics.length > 1) {
      // For each pair of topics in the decision
      for (let i = 0; i < decision.topics.length; i++) {
        for (let j = i + 1; j < decision.topics.length; j++) {
          const topic1 = decision.topics[i];
          const topic2 = decision.topics[j];
          
          // Create sorted pair to ensure consistent ordering
          const pair = [topic1, topic2].sort();
          const pairKey = `${pair[0]}|${pair[1]}`;
          
          cooccurrence[pairKey] = (cooccurrence[pairKey] || 0) + 1;
        }
      }
    }
  });
  
  return cooccurrence;
}

/**
 * Identify trending topics
 * @param {Array} decisions - Array of court decisions
 * @param {number} months - Number of months to analyze
 * @returns {Object} Trending topics analysis
 */
function identifyTrendingTopics(decisions, months = 6) {
  // Calculate date threshold
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - months);
  
  // Split decisions into recent and older
  const recentDecisions = decisions.filter(decision => {
    if (!decision.decision_date) return false;
    const decisionDate = new Date(decision.decision_date);
    return decisionDate >= thresholdDate;
  });
  
  const olderDecisions = decisions.filter(decision => {
    if (!decision.decision_date) return false;
    const decisionDate = new Date(decision.decision_date);
    return decisionDate < thresholdDate;
  });
  
  // Count topics in each period
  const recentTopicCounts = {};
  const olderTopicCounts = {};
  
  recentDecisions.forEach(decision => {
    if (decision.topics) {
      decision.topics.forEach(topic => {
        recentTopicCounts[topic] = (recentTopicCounts[topic] || 0) + 1;
      });
    }
  });
  
  olderDecisions.forEach(decision => {
    if (decision.topics) {
      decision.topics.forEach(topic => {
        olderTopicCounts[topic] = (olderTopicCounts[topic] || 0) + 1;
      });
    }
  });
  
  // Calculate growth rates
  const growthRates = {};
  
  Object.keys(recentTopicCounts).forEach(topic => {
    const recentCount = recentTopicCounts[topic];
    const olderCount = olderTopicCounts[topic] || 0;
    
    // Avoid division by zero
    if (olderCount === 0) {
      growthRates[topic] = recentCount > 0 ? Infinity : 0;
    } else {
      growthRates[topic] = ((recentCount - olderCount) / olderCount) * 100;
    }
  });
  
  // Sort by growth rate
  const sortedGrowthRates = Object.entries(growthRates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    trendingTopics: sortedGrowthRates,
    recentTopicCounts,
    olderTopicCounts
  };
}

/**
 * Analyze topic sentiment (simplified)
 * @param {Array} decisions - Array of court decisions
 * @returns {Object} Sentiment analysis by topic
 */
function analyzeTopicSentiment(decisions) {
  const sentimentByTopic = {};
  
  decisions.forEach(decision => {
    if (decision.topics && decision.summary) {
      // Simplified sentiment analysis based on keywords
      const positiveKeywords = ['vorteil', 'gunst', 'zulässig', 'erfolg', 'angenommen'];
      const negativeKeywords = ['nachteil', 'ungünstig', 'unzulässig', 'abgewiesen', 'verworfen'];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      // Convert summary to lowercase for matching
      const summaryLower = decision.summary.toLowerCase();
      
      positiveKeywords.forEach(keyword => {
        const matches = summaryLower.match(new RegExp(keyword, 'g'));
        positiveScore += matches ? matches.length : 0;
      });
      
      negativeKeywords.forEach(keyword => {
        const matches = summaryLower.match(new RegExp(keyword, 'g'));
        negativeScore += matches ? matches.length : 0;
      });
      
      // Calculate sentiment score (-1 to 1)
      const totalMatches = positiveScore + negativeScore;
      const sentimentScore = totalMatches > 0 ? (positiveScore - negativeScore) / totalMatches : 0;
      
      // Assign sentiment to each topic
      decision.topics.forEach(topic => {
        if (!sentimentByTopic[topic]) {
          sentimentByTopic[topic] = { totalScore: 0, count: 0 };
        }
        
        sentimentByTopic[topic].totalScore += sentimentScore;
        sentimentByTopic[topic].count++;
      });
    }
  });
  
  // Calculate average sentiment for each topic
  const averageSentiment = {};
  
  Object.keys(sentimentByTopic).forEach(topic => {
    const { totalScore, count } = sentimentByTopic[topic];
    averageSentiment[topic] = count > 0 ? totalScore / count : 0;
  });
  
  // Sort by absolute sentiment value
  const sortedSentiment = Object.entries(averageSentiment)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 10);
  
  return {
    topicSentiment: sortedSentiment,
    sentimentDetails: averageSentiment
  };
}

/**
 * Generate topic network visualization data
 * @param {Object} cooccurrence - Topic co-occurrence matrix
 * @param {number} threshold - Minimum co-occurrence count to include
 * @returns {Object} Network data for visualization
 */
function generateTopicNetwork(cooccurrence, threshold = 2) {
  const nodes = new Set();
  const links = [];
  
  Object.entries(cooccurrence).forEach(([pairKey, count]) => {
    if (count >= threshold) {
      const [topic1, topic2] = pairKey.split('|');
      nodes.add(topic1);
      nodes.add(topic2);
      links.push({
        source: topic1,
        target: topic2,
        value: count
      });
    }
  });
  
  return {
    nodes: Array.from(nodes).map(node => ({ id: node })),
    links
  };
}

// Export functions
module.exports = {
  extractTopicCooccurrence,
  identifyTrendingTopics,
  analyzeTopicSentiment,
  generateTopicNetwork
};