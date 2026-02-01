/**
 * Test script for Legal Precedent Predictor
 * This script tests the predictive modeling functionality for legal precedents
 */

const { 
  calculateDecisionSimilarity,
  predictDecisionImportance,
  predictPracticeImplications,
  findSimilarDecisions,
  generatePredictiveAnalysis,
  getTopicTrendPredictions,
  performPredictiveAnalysis
} = require('../analytics/legalPrecedentPredictor.js');

console.log("=== Legal Precedent Predictor Test ===\n");

async function runPredictiveModelTests() {
  try {
    console.log("1. Testing decision similarity calculation...");
    
    // Test decision similarity
    const decision1 = {
      id: 1,
      topics: ['Mietminderung', 'Schimmelbefall', 'Heizung'],
      court: 'Bundesgerichtshof'
    };
    
    const decision2 = {
      id: 2,
      topics: ['Mietminderung', 'Heizung', 'Modernisierung'],
      court: 'Bundesgerichtshof'
    };
    
    const decision3 = {
      id: 3,
      topics: ['Kündigung', 'Prozesskostenhilfe'],
      court: 'Landgericht Berlin'
    };
    
    const similarity12 = calculateDecisionSimilarity(decision1, decision2);
    const similarity13 = calculateDecisionSimilarity(decision1, decision3);
    
    console.log(`  Similarity between decision 1 and 2: ${similarity12.toFixed(3)}`);
    console.log(`  Similarity between decision 1 and 3: ${similarity13.toFixed(3)}`);
    
    console.log("\n2. Testing importance prediction...");
    
    // Test importance prediction
    const newDecision = {
      id: 4,
      topics: ['Mietminderung', 'Schimmelbefall'],
      court: 'Bundesgerichtshof'
    };
    
    const similarDecisions = [
      { id: 1, importance: 'high', topics: ['Mietminderung'], court: 'Bundesgerichtshof' },
      { id: 2, importance: 'high', topics: ['Schimmelbefall'], court: 'Bundesgerichtshof' },
      { id: 3, importance: 'medium', topics: ['Mietminderung'], court: 'Landgericht' },
      { id: 4, importance: 'high', topics: ['Mietminderung', 'Schimmelbefall'], court: 'Oberlandesgericht' }
    ];
    
    const importancePrediction = predictDecisionImportance(newDecision, similarDecisions);
    console.log(`  Predicted importance: ${importancePrediction.predictedImportance}`);
    console.log(`  Confidence: ${(importancePrediction.confidence * 100).toFixed(1)}%`);
    console.log(`  Similar decisions analyzed: ${importancePrediction.similarCount}`);
    
    console.log("\n3. Testing practice implications prediction...");
    
    // Test practice implications prediction
    const implicationsDecisions = [
      { 
        id: 1, 
        practice_implications: 'Mieter sollten bei Schimmelbefall unverzüglich handeln. Dokumentation ist entscheidend.' 
      },
      { 
        id: 2, 
        practice_implications: 'Schriftliche Beanstandung ist notwendig. Fachgutachten sollten erstellt werden.' 
      },
      { 
        id: 3, 
        practice_implications: 'Mieter sollten bei Schimmelbefall unverzüglich handeln. Fachgutachten sind wichtig.' 
      }
    ];
    
    const implicationsPrediction = predictPracticeImplications(newDecision, implicationsDecisions);
    console.log(`  Confidence: ${(implicationsPrediction.confidence * 100).toFixed(1)}%`);
    console.log(`  Predicted implications count: ${implicationsPrediction.predictedImplications.length}`);
    console.log(`  Sample implications: ${implicationsPrediction.predictedImplications.slice(0, 2).join('; ')}`);
    
    console.log("\n4. Testing similar decisions search...");
    
    // Test finding similar decisions
    const allDecisions = [
      decision1, decision2, decision3,
      { id: 5, topics: ['Mietminderung', 'Schimmelbefall'], court: 'Oberlandesgericht' },
      { id: 6, topics: ['Kündigung'], court: 'Bundesgerichtshof' }
    ];
    
    const similarDecisionsResult = findSimilarDecisions(newDecision, allDecisions, 3);
    console.log(`  Found ${similarDecisionsResult.length} similar decisions`);
    similarDecisionsResult.forEach((item, index) => {
      console.log(`    ${index + 1}. Decision ${item.decision.id} (similarity: ${item.similarity.toFixed(3)})`);
    });
    
    console.log("\n✓ Legal precedent predictor tests completed successfully!");
    console.log("\nNote: Database-dependent tests (generatePredictiveAnalysis, getTopicTrendPredictions, performPredictiveAnalysis)");
    console.log("would require a running database and are not executed in this simple test.");
    
  } catch (error) {
    console.error("❌ Legal precedent predictor test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runPredictiveModelTests();