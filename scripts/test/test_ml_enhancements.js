/**
 * Test suite for ML enhancements
 * This script tests the new ML capabilities for predictive modeling, automatic categorization, and personalized recommendations.
 */

const { calculateEnhancedDecisionSimilarity, predictFutureTrends, predictEnhancedDecisionImportance, predictEnhancedPracticeImplications } = require('../ml/predictiveLegalModel.js');
const { extractEnhancedTopics, categorizeImportance, autoCategorizeDecision } = require('../ml/automaticCategorizer.js');
const { calculatePreferenceProfile, scoreDecisionForLawyer, generateRecommendations } = require('../ml/personalizedRecommender.js');

// Mock data for testing
const mockDecisions = [
  {
    id: 1,
    decision_id: 'BGH-I-ZB-123',
    court: 'Bundesgerichtshof',
    decision_date: '2023-01-15',
    case_number: 'I ZB 123/22',
    topics: ['Mietrecht', 'Kündigung'],
    summary: 'Wichtige Entscheidung zum Mietrecht betreffend die Kündigung von Mietverträgen durch Vermieter.',
    full_text: 'Der Bundesgerichtshof hat entschieden, dass Vermieter bei Mietverträgen bestimmte Voraussetzungen erfüllen müssen, um eine ordentliche Kündigung auszusprechen.',
    practice_implications: 'Vermieter müssen bei Kündigungen von Mietverträgen stets die gesetzlichen Voraussetzungen prüfen.',
    importance: 'high',
    source: 'bgh'
  },
  {
    id: 2,
    decision_id: 'BGH-II-ZB-456',
    court: 'Bundesgerichtshof',
    decision_date: '2023-02-20',
    case_number: 'II ZB 456/22',
    topics: ['Arbeitsrecht', 'Kündigung'],
    summary: 'Entscheidung zum Arbeitsrecht betreffend die Kündigung von Arbeitsverträgen.',
    full_text: 'Der Bundesgerichtshof hat klargestellt, unter welchen Umständen Arbeitgeber fristlose Kündigungen aussprechen können.',
    practice_implications: 'Arbeitgeber sollten vor fristlosen Kündigungen stets eine sorgfältige Prüfung durchführen.',
    importance: 'high',
    source: 'bgh'
  },
  {
    id: 3,
    decision_id: 'LG-789',
    court: 'Landgericht München',
    decision_date: '2023-03-10',
    case_number: '3 O 789/23',
    topics: ['Mietrecht', 'Nebenkosten'],
    summary: 'Entscheidung zu Nebenkosten im Mietrecht.',
    full_text: 'Das Landgericht München hat entschieden, wie Nebenkosten in Mietverträgen abgerechnet werden müssen.',
    practice_implications: 'Vermieter müssen bei der Abrechnung von Nebenkosten transparent und nachvollziehbar vorgehen.',
    importance: 'medium',
    source: 'landgerichte'
  }
];

const mockLawyers = [
  {
    id: 1,
    name: 'Max Mustermann',
    email: 'max@mustermann-law.de',
    law_firm: 'Mustermann & Partner',
    practice_areas: ['Mietrecht', 'Arbeitsrecht'],
    topics: ['Mietrecht', 'Kündigung'],
    court_levels: ['Bundesgerichtshof', 'Landgericht']
  },
  {
    id: 2,
    name: 'Erika Beispiel',
    email: 'erika@beispiel-law.de',
    law_firm: 'Beispiel Rechtsanwälte',
    practice_areas: ['Familienrecht'],
    topics: ['Scheidung', 'Unterhalt'],
    court_levels: ['Amtsgericht', 'Landgericht']
  }
];

const mockInteractions = [
  {
    id: 1,
    lawyer_id: 1,
    decision_id: 1,
    interaction_type: 'view',
    interaction_data: {},
    decision: mockDecisions[0],
    created_at: '2023-03-15T10:30:00Z'
  },
  {
    id: 2,
    lawyer_id: 1,
    decision_id: 1,
    interaction_type: 'download',
    interaction_data: {},
    decision: mockDecisions[0],
    created_at: '2023-03-15T10:35:00Z'
  }
];

console.log('Running ML Enhancement Tests...\n');

// Test 1: Enhanced Decision Similarity
console.log('Test 1: Enhanced Decision Similarity Calculation');
try {
  const similarity = calculateEnhancedDecisionSimilarity(mockDecisions[0], mockDecisions[1]);
  console.log(`✓ Similarity between decisions 1 and 2: ${similarity.toFixed(4)}`);
  
  const selfSimilarity = calculateEnhancedDecisionSimilarity(mockDecisions[0], mockDecisions[0]);
  console.log(`✓ Self-similarity (should be 1.0): ${selfSimilarity.toFixed(4)}`);
  
  if (similarity >= 0 && similarity <= 1 && selfSimilarity === 1) {
    console.log('✓ Decision similarity test passed\n');
  } else {
    console.log('✗ Decision similarity test failed\n');
  }
} catch (error) {
  console.log(`✗ Decision similarity test failed with error: ${error.message}\n`);
}

// Test 2: Future Trends Prediction
console.log('Test 2: Future Trends Prediction');
try {
  const trends = predictFutureTrends(mockDecisions);
  console.log(`✓ Trend prediction result: ${trends.trend}`);
  console.log(`✓ Number of predictions: ${Object.keys(trends.predictions).length}`);
  
  if (trends) {
    console.log('✓ Future trends prediction test passed\n');
  } else {
    console.log('✗ Future trends prediction test failed\n');
  }
} catch (error) {
  console.log(`✗ Future trends prediction test failed with error: ${error.message}\n`);
}

// Test 3: Enhanced Decision Importance Prediction
console.log('Test 3: Enhanced Decision Importance Prediction');
try {
  const similarDecisions = [
    { decision: mockDecisions[1], similarity: 0.7 },
    { decision: mockDecisions[2], similarity: 0.4 }
  ];
  
  const importancePrediction = predictEnhancedDecisionImportance(mockDecisions[0], similarDecisions);
  console.log(`✓ Predicted importance: ${importancePrediction.predictedImportance}`);
  console.log(`✓ Prediction confidence: ${importancePrediction.confidence.toFixed(4)}`);
  
  if (importancePrediction.predictedImportance && importancePrediction.confidence >= 0) {
    console.log('✓ Enhanced decision importance prediction test passed\n');
  } else {
    console.log('✗ Enhanced decision importance prediction test failed\n');
  }
} catch (error) {
  console.log(`✗ Enhanced decision importance prediction test failed with error: ${error.message}\n`);
}

// Test 4: Enhanced Practice Implications Prediction
console.log('Test 4: Enhanced Practice Implications Prediction');
try {
  const similarDecisions = [
    { decision: mockDecisions[1], similarity: 0.7 },
    { decision: mockDecisions[2], similarity: 0.4 }
  ];
  
  const implicationsPrediction = predictEnhancedPracticeImplications(mockDecisions[0], similarDecisions);
  console.log(`✓ Number of predicted implications: ${implicationsPrediction.predictedImplications.length}`);
  console.log(`✓ Prediction confidence: ${implicationsPrediction.confidence.toFixed(4)}`);
  
  if (implicationsPrediction.predictedImplications && implicationsPrediction.confidence >= 0) {
    console.log('✓ Enhanced practice implications prediction test passed\n');
  } else {
    console.log('✗ Enhanced practice implications prediction test failed\n');
  }
} catch (error) {
  console.log(`✗ Enhanced practice implications prediction test failed with error: ${error.message}\n`);
}

// Test 5: Enhanced Topic Extraction
console.log('Test 5: Enhanced Topic Extraction');
try {
  const extractedTopics = extractEnhancedTopics(mockDecisions[0]);
  console.log(`✓ Extracted topics: ${extractedTopics.join(', ')}`);
  
  if (Array.isArray(extractedTopics)) {
    console.log('✓ Enhanced topic extraction test passed\n');
  } else {
    console.log('✗ Enhanced topic extraction test failed\n');
  }
} catch (error) {
  console.log(`✗ Enhanced topic extraction test failed with error: ${error.message}\n`);
}

// Test 6: Importance Categorization
console.log('Test 6: Importance Categorization');
try {
  const importance = categorizeImportance(mockDecisions[0], mockLawyers);
  console.log(`✓ Categorized importance: ${importance}`);
  
  const validLevels = ['low', 'medium', 'high'];
  if (validLevels.includes(importance)) {
    console.log('✓ Importance categorization test passed\n');
  } else {
    console.log('✗ Importance categorization test failed\n');
  }
} catch (error) {
  console.log(`✗ Importance categorization test failed with error: ${error.message}\n`);
}

// Test 7: Auto Categorization
console.log('Test 7: Auto Categorization');
try {
  const categorizedDecision = autoCategorizeDecision(mockDecisions[0], mockLawyers);
  console.log(`✓ Categorized topics: ${categorizedDecision.topics.join(', ')}`);
  console.log(`✓ Categorized importance: ${categorizedDecision.importance}`);
  
  if (categorizedDecision.topics && categorizedDecision.importance) {
    console.log('✓ Auto categorization test passed\n');
  } else {
    console.log('✗ Auto categorization test failed\n');
  }
} catch (error) {
  console.log(`✗ Auto categorization test failed with error: ${error.message}\n`);
}

// Test 8: Preference Profile Calculation
console.log('Test 8: Preference Profile Calculation');
try {
  const profile = calculatePreferenceProfile(mockLawyers[0], mockInteractions);
  console.log(`✓ Profile has preferred topics: ${Object.keys(profile.preferredTopics).length > 0}`);
  console.log(`✓ Engagement score: ${profile.engagementScore}`);
  
  if (profile.preferredTopics && profile.engagementScore >= 0) {
    console.log('✓ Preference profile calculation test passed\n');
  } else {
    console.log('✗ Preference profile calculation test failed\n');
  }
} catch (error) {
  console.log(`✗ Preference profile calculation test failed with error: ${error.message}\n`);
}

// Test 9: Decision Scoring for Lawyer
console.log('Test 9: Decision Scoring for Lawyer');
try {
  const profile = calculatePreferenceProfile(mockLawyers[0], mockInteractions);
  const score = scoreDecisionForLawyer(mockDecisions[0], profile);
  console.log(`✓ Decision score for lawyer: ${score.toFixed(2)} (0-10 scale)`);
  
  if (score >= 0 && score <= 10) {
    console.log('✓ Decision scoring test passed\n');
  } else {
    console.log('✗ Decision scoring test failed\n');
  }
} catch (error) {
  console.log(`✗ Decision scoring test failed with error: ${error.message}\n`);
}

// Test 10: Recommendation Generation
console.log('Test 10: Recommendation Generation');
try {
  const recommendations = generateRecommendations(mockLawyers[0], mockDecisions, mockInteractions, 5);
  console.log(`✓ Generated ${recommendations.length} recommendations`);
  
  if (Array.isArray(recommendations)) {
    console.log('✓ Recommendation generation test passed\n');
  } else {
    console.log('✗ Recommendation generation test failed\n');
  }
} catch (error) {
  console.log(`✗ Recommendation generation test failed with error: ${error.message}\n`);
}

console.log('ML Enhancement Tests Completed!');