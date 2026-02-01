/**
 * Automatic Decision Categorizer
 * This module provides enhanced automatic categorization of court decisions to legal domains.
 */

const { getAllCourtDecisions } = require('../database/dao/courtDecisionDao.js');
const { updateCourtDecision } = require('../database/dao/courtDecisionDao.js');

// Neue Abhängigkeiten für verbesserte NLP
const tf = require('@tensorflow/tfjs-node');

/**
 * Enhanced topic extraction using keyword analysis and pattern matching
 * @param {Object} decision - Court decision object
 * @returns {Array} Array of extracted topics
 */
function extractEnhancedTopics(decision) {
  const topics = new Set();
  
  // Combine all text fields for analysis
  const fullText = `
    ${decision.summary || ''}
    ${decision.full_text || ''}
    ${decision.practice_implications || ''}
  `.toLowerCase();
  
  // Define topic keywords and patterns
  const topicKeywords = {
    'Mietrecht': [
      'mietvertrag', 'mieter', 'vermieter', 'miete', 'mietpreis', 'mietminderung', 'kündigung',
      'wohnung', 'raum', 'nebenkosten', 'betriebskosten', 'heizkosten', 'wasser', 'strom',
      'mietkaution', 'anzahlung', 'rückzahlung', 'verzugszinsen'
    ],
    'Arbeitsrecht': [
      'arbeitsvertrag', 'arbeitnehmer', 'arbeitgeber', 'kündigung', 'fristlose kündigung',
      'abmahnung', 'arbeitszeit', 'überstunden', 'urlaub', 'lohn', 'gehalt', 'tarifvertrag',
      'betriebsrat', 'arbeitsgericht', 'beschäftigungsverbot'
    ],
    'Familienrecht': [
      'scheidung', 'unterhalt', 'sorgerecht', 'umsorg', 'elterngeld', 'elternteil',
      'eheschließung', 'eheliche gemeinschaft', 'güterstand', 'ehescheidungsfolgen',
      'anfechtung', 'vaterschaft', 'mutterschaft'
    ],
    'Verkehrsrecht': [
      'verkehrsunfall', 'haftpflicht', 'kasko', 'fahrerlaubnis', 'führerschein',
      'verkehrsverstoß', 'bußgeld', 'punkte', 'einziehung', 'widerstand',
      'gebietsfremder', 'alkohol', 'drogen'
    ],
    'Strafrecht': [
      'strafrecht', 'strafe', 'freiheitsstrafe', 'geldstrafe', 'bewährung',
      'delikt', 'tatbestand', 'rechtswidrigkeit', 'schuld', 'versuch',
      'mittelbare täterschaft', 'mittelbarer vorsatz'
    ],
    'Handelsrecht': [
      'handelsgesetzbuch', 'aktiengesellschaft', 'gesellschaft bürgerlichen rechts',
      'kommanditgesellschaft', 'offene handelsgesellschaft', 'geschäftsführung',
      'vertretungsbefugnis', 'prokura', 'vollmacht'
    ],
    'Steuerrecht': [
      'steuer', 'einkommensteuer', 'umsatzsteuer', 'gewerbesteuer', 'körperschaftsteuer',
      'veranlagung', 'bescheid', 'festsetzung', 'verjährung', 'steuervermeidung',
      'steuerhinterziehung', 'steueroptimierung'
    ],
    'Versicherungsrecht': [
      'versicherung', 'versicherungsvertrag', 'versicherungsnehmer', 'versicherer',
      'versicherungssumme', 'selbstbeteiligung', 'deckung', 'leistung',
      'beitrag', 'risiko', 'versicherungsfall'
    ]
  };
  
  // Extract topics based on keyword matching
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    const matches = keywords.filter(keyword => fullText.includes(keyword));
    if (matches.length >= 2) { // Require at least 2 matches for confidence
      topics.add(topic);
    }
  });
  
  // Handle special cases and combinations
  if (fullText.includes('bgh') || fullText.includes('bundesgerichtshof')) {
    topics.add('Rechtsprechung');
  }
  
  if (fullText.includes('eu') || fullText.includes('europäische union')) {
    topics.add('EU-Recht');
  }
  
  // If no topics were identified, fall back to basic categorization
  if (topics.size === 0) {
    // Look for specific phrases in case number or court
    if (decision.case_number) {
      const caseNumber = decision.case_number.toLowerCase();
      if (caseNumber.includes('zbbb')) topics.add('Mietrecht');
      else if (caseNumber.includes('arb')) topics.add('Arbeitsrecht');
      else if (caseNumber.includes('fam')) topics.add('Familienrecht');
    }
    
    if (decision.court) {
      const court = decision.court.toLowerCase();
      if (court.includes('ag') && court.includes('miet')) topics.add('Mietrecht');
    }
  }
  
  return Array.from(topics);
}

/**
 * NEW: Advanced topic extraction using transformer-based NLP model
 * @param {String} text - Text to analyze
 * @returns {Array} Array of extracted topics with confidence scores
 */
async function extractAdvancedTopics(text) {
  // In a real implementation, this would use a pre-trained transformer model
  // For now, we'll simulate the behavior with keyword-based extraction enhanced with confidence scoring
  
  const topics = [];
  const lowerText = text.toLowerCase();
  
  // Define topic keywords with weights
  const topicKeywords = {
    'Mietrecht': {
      keywords: [
        'mietvertrag', 'mieter', 'vermieter', 'miete', 'mietpreis', 'mietminderung', 'kündigung',
        'wohnung', 'raum', 'nebenkosten', 'betriebskosten', 'heizkosten', 'wasser', 'strom'
      ],
      weight: 1.0
    },
    'Arbeitsrecht': {
      keywords: [
        'arbeitsvertrag', 'arbeitnehmer', 'arbeitgeber', 'kündigung', 'fristlose kündigung',
        'abmahnung', 'arbeitszeit', 'überstunden', 'urlaub', 'lohn', 'gehalt'
      ],
      weight: 1.0
    },
    'Familienrecht': {
      keywords: [
        'scheidung', 'unterhalt', 'sorgerecht', 'umsorg', 'elterngeld', 'elternteil',
        'eheschließung', 'eheliche gemeinschaft', 'güterstand'
      ],
      weight: 1.0
    },
    'Verkehrsrecht': {
      keywords: [
        'verkehrsunfall', 'haftpflicht', 'kasko', 'fahrerlaubnis', 'führerschein',
        'verkehrsverstoß', 'bußgeld', 'punkte'
      ],
      weight: 1.0
    },
    'Strafrecht': {
      keywords: [
        'strafrecht', 'strafe', 'freiheitsstrafe', 'geldstrafe', 'bewährung',
        'delikt', 'tatbestand', 'rechtswidrigkeit', 'schuld'
      ],
      weight: 1.0
    }
  };
  
  // Calculate confidence scores for each topic
  Object.entries(topicKeywords).forEach(([topic, data]) => {
    const matches = data.keywords.filter(keyword => lowerText.includes(keyword));
    const matchRatio = matches.length / data.keywords.length;
    
    // Only include topics with at least 10% keyword matches
    if (matchRatio >= 0.1) {
      topics.push({
        topic,
        confidence: matchRatio * data.weight,
        matches: matches.length
      });
    }
  });
  
  // Sort by confidence and return top topics
  return topics
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Top 5 topics
}

/**
 * NEW: Neural network model for topic classification
 * @param {Array} trainingData - Training data for the model
 * @returns {Object} Trained model
 */
async function trainTopicClassificationModel(trainingData) {
  // Prepare training data
  const xs = trainingData.map(item => [
    item.wordCount || 0,
    item.sentenceCount || 0,
    item.uniqueWords || 0,
    item.keywordDensity || 0
  ]);
  
  const ys = trainingData.map(item => {
    // Convert topics to numerical labels
    const topicLabels = {
      'Mietrecht': 0,
      'Arbeitsrecht': 1,
      'Familienrecht': 2,
      'Verkehrsrecht': 3,
      'Strafrecht': 4
    };
    
    // For multi-label classification, we'll use the primary topic
    const primaryTopic = item.topics && item.topics.length > 0 ? item.topics[0] : 'Other';
    return [topicLabels[primaryTopic] || 5]; // 5 for 'Other'
  });
  
  // Create tensors
  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys);
  
  // Create model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 6, activation: 'softmax' })); // 6 classes including 'Other'
  
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
 * NEW: Classify topics using trained neural network
 * @param {Object} model - Trained neural network model
 * @param {Object} decision - Decision to classify
 * @returns {Array} Classified topics with confidence scores
 */
async function classifyTopicsWithNN(model, decision) {
  // Extract text features
  const text = `
    ${decision.summary || ''}
    ${decision.full_text || ''}
  `;
  
  const features = [
    text.split(' ').length, // word count
    text.split('.').length, // sentence count
    new Set(text.split(/\s+/)).size, // unique words
    calculateKeywordDensity(text) // keyword density
  ];
  
  // Make prediction
  const prediction = model.predict(tf.tensor2d([features]));
  const probabilities = await prediction.data();
  
  // Convert probabilities to topics
  const topicLabels = ['Mietrecht', 'Arbeitsrecht', 'Familienrecht', 'Verkehrsrecht', 'Strafrecht', 'Other'];
  const topics = [];
  
  probabilities.forEach((prob, index) => {
    if (prob > 0.1) { // Only include topics with >10% confidence
      topics.push({
        topic: topicLabels[index],
        confidence: prob
      });
    }
  });
  
  // Sort by confidence
  return topics.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Helper function to calculate keyword density
 * @param {String} text - Text to analyze
 * @returns {Number} Keyword density
 */
function calculateKeywordDensity(text) {
  const words = text.split(/\s+/);
  const legalKeywords = [
    'vertrag', 'kündigung', 'recht', 'gericht', 'urteil', 'beschluss', 'antrag',
    'klage', 'antwort', 'beweis', 'zeugen', 'schriftsätze', 'frist', 'kosten'
  ];
  
  const legalWordCount = words.filter(word => 
    legalKeywords.some(keyword => word.toLowerCase().includes(keyword))
  ).length;
  
  return words.length > 0 ? legalWordCount / words.length : 0;
}

/**
 * Categorize decision importance using enhanced heuristics
 * @param {Object} decision - Court decision object
 * @param {Array} lawyers - Array of lawyer objects
 * @returns {string} Importance level ('low', 'medium', 'high')
 */
function categorizeImportance(decision, lawyers) {
  let score = 0;
  
  // Court factor (higher courts = higher importance)
  if (decision.court) {
    const court = decision.court.toLowerCase();
    if (court.includes('bundesgerichtshof') || court.includes('bgh')) {
      score += 3;
    } else if (court.includes('oberlandesgericht') || court.includes('olg')) {
      score += 2;
    } else if (court.includes('landgericht') || court.includes('lg')) {
      score += 1;
    }
  }
  
  // Topics factor
  if (decision.topics && decision.topics.length > 0) {
    // More topics = potentially more significant
    score += Math.min(decision.topics.length / 2, 2);
    
    // Certain topics are inherently more important
    const importantTopics = ['Mietrecht', 'Arbeitsrecht', 'Strafrecht'];
    const hasImportantTopic = decision.topics.some(topic => importantTopics.includes(topic));
    if (hasImportantTopic) score += 1;
  }
  
  // Summary/full text length factor (longer = more detailed = more important)
  const textLength = (decision.summary?.length || 0) + (decision.full_text?.length || 0);
  if (textLength > 5000) score += 2;
  else if (textLength > 2000) score += 1;
  
  // Lawyer relevance factor
  if (lawyers && lawyers.length > 0) {
    // Check if decision topics match lawyer practice areas
    const relevantLawyers = lawyers.filter(lawyer => {
      if (!lawyer.practice_areas || !decision.topics) return false;
      return lawyer.practice_areas.some(area => decision.topics.includes(area));
    });
    
    // More relevant lawyers = higher importance
    score += Math.min(relevantLawyers.length, 3);
  }
  
  // Determine importance level based on score
  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Automatically categorize a decision with enhanced ML techniques
 * @param {Object} decision - Court decision object
 * @param {Array} lawyers - Array of lawyer objects
 * @returns {Object} Categorized decision with topics and importance
 */
async function autoCategorizeDecision(decision, lawyers) {
  // Extract topics using enhanced methods
  const keywordTopics = extractEnhancedTopics(decision);
  
  // Extract advanced topics with confidence scores
  const textToAnalyze = `
    ${decision.summary || ''}
    ${decision.full_text || ''}
    ${decision.practice_implications || ''}
  `;
  
  const advancedTopics = await extractAdvancedTopics(textToAnalyze);
  
  // Combine topics (prefer advanced topics with higher confidence)
  const combinedTopics = new Set([...keywordTopics]);
  advancedTopics.forEach(topicObj => {
    if (topicObj.confidence > 0.3) { // Only include topics with >30% confidence
      combinedTopics.add(topicObj.topic);
    }
  });
  
  // Categorize importance
  const importance = categorizeImportance(decision, lawyers);
  
  return {
    ...decision,
    topics: [...combinedTopics], // Merge with existing topics
    importance: decision.importance || importance // Only set if not already set
  };
}

/**
 * Batch categorize multiple decisions
 * @param {Array} decisions - Array of court decision objects
 * @param {Array} lawyers - Array of lawyer objects
 * @returns {Promise<Array>} Array of categorized decisions
 */
async function batchAutoCategorize(decisions, lawyers) {
  const categorizedDecisions = [];
  
  // Process decisions in batches to avoid memory issues
  const batchSize = 10;
  for (let i = 0; i < decisions.length; i += batchSize) {
    const batch = decisions.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(decision => autoCategorizeDecision(decision, lawyers))
    );
    categorizedDecisions.push(...batchResults);
  }
  
  return categorizedDecisions;
}

/**
 * Continuously improve categorization based on user feedback
 * @param {Object} decision - Court decision object
 * @param {Array} userCorrectedTopics - Array of topics corrected by user
 * @returns {Object} Updated categorization model
 */
function improveCategorization(decision, userCorrectedTopics) {
  // In a more advanced implementation, this would update a machine learning model
  // For now, we'll just log the corrections for manual analysis
  
  console.log('Categorization improvement opportunity:', {
    decisionId: decision.id,
    originalTopics: decision.topics,
    correctedTopics: userCorrectedTopics,
    difference: userCorrectedTopics.filter(topic => !(decision.topics || []).includes(topic))
  });
  
  // Return the corrected topics for immediate use
  return userCorrectedTopics;
}

// Export functions
module.exports = {
  extractEnhancedTopics,
  extractAdvancedTopics,
  trainTopicClassificationModel,
  classifyTopicsWithNN,
  calculateKeywordDensity,
  categorizeImportance,
  autoCategorizeDecision,
  batchAutoCategorize,
  improveCategorization
};