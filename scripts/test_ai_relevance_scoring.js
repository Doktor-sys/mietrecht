/**
 * Test script for AI relevance scoring
 * This script tests the AI-based relevance scoring functionality
 */

const { calculateRelevanceScore, filterAndRankDecisions, generatePersonalizedRecommendations, updateLawyerPreferences } = require('./ai_relevance_scoring.js');

// Mock data for testing
const mockDecisions = [
  {
    id: 1,
    gericht: "Bundesgerichtshof",
    ort: "Karlsruhe",
    datum: "2025-11-15",
    az: "VIII ZR 121/24",
    themen: ["Mietminderung", "Schimmelbefall"],
    zusammenfassung: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
    wichtigkeit: "hoch"
  },
  {
    id: 2,
    gericht: "Landgericht",
    ort: "Berlin",
    datum: "2025-11-10",
    az: "34 M 12/25",
    themen: ["Kündigung", "Modernisierung"],
    zusammenfassung: "Kündigung wegen Eigenbedarf unzulässig",
    wichtigkeit: "mittel"
  },
  {
    id: 3,
    gericht: "Bundesverfassungsgericht",
    ort: "Karlsruhe",
    datum: "2025-10-28",
    az: "1 BvR 1234/23",
    themen: ["Verfassungsrecht", "Mietvertragsrecht"],
    zusammenfassung: "Kündigung durch Mieter wegen erheblicher Beeinträchtigung",
    wichtigkeit: "hoch"
  }
];

const mockLawyer = {
  id: 1,
  name: "Max Mustermann",
  email: "max.mustermann@kanzlei.de",
  kanzlei: "Mustermann & Partner",
  schwerpunkte: ["Mietrecht", "Wohnungsrecht"],
  regionen: ["Berlin", "Brandenburg"],
  einstellungen: {
    gerichtsarten: ["Bundesgerichtshof", "Landgericht"],
    themengebiete: ["Mietminderung", "Kündigung", "Nebenkosten"],
    frequenz: "woechentlich"
  }
};

const mockInteractions = [
  {
    type: "view_decision",
    decision: mockDecisions[0],
    timestamp: "2025-11-16T10:00:00Z"
  },
  {
    type: "click_link",
    decision: mockDecisions[0],
    timestamp: "2025-11-16T10:05:00Z"
  },
  {
    type: "view_decision",
    decision: mockDecisions[1],
    timestamp: "2025-11-16T11:00:00Z"
  }
];

async function testAIRelevanceScoring() {
  console.log("Testing AI-based relevance scoring...\n");
  
  try {
    // Test 1: Calculate relevance scores
    console.log("Test 1: Calculate relevance scores");
    mockDecisions.forEach(decision => {
      const score = calculateRelevanceScore(decision, mockLawyer);
      console.log(`  Decision ${decision.id}: ${score.toFixed(3)}`);
    });
    
    // Test 2: Filter and rank decisions
    console.log("\nTest 2: Filter and rank decisions");
    const filteredDecisions = filterAndRankDecisions(mockDecisions, mockLawyer, 0.5);
    console.log(`  Found ${filteredDecisions.length} relevant decisions:`);
    filteredDecisions.forEach(decision => {
      console.log(`    - ${decision.id} (${decision.relevanceScore.toFixed(3)}): ${decision.zusammenfassung}`);
    });
    
    // Test 3: Generate personalized recommendations
    console.log("\nTest 3: Generate personalized recommendations");
    const recommendations = generatePersonalizedRecommendations(mockDecisions, mockLawyer);
    console.log("  Recommendations:");
    console.log(`    Recommended decisions: ${recommendations.recommendedDecisions.length}`);
    console.log(`    Suggested topics: ${recommendations.suggestedTopics.join(', ')}`);
    
    // Test 4: Update lawyer preferences
    console.log("\nTest 4: Update lawyer preferences");
    const updatedLawyer = updateLawyerPreferences(mockLawyer, mockInteractions);
    console.log("  Updated lawyer preferences:");
    console.log(`    Topics: ${updatedLawyer.einstellungen.themengebiete.join(', ')}`);
    
    console.log("\nAI relevance scoring tests completed successfully!");
    return true;
  } catch (error) {
    console.error("Error testing AI relevance scoring:", error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAIRelevanceScoring().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testAIRelevanceScoring };