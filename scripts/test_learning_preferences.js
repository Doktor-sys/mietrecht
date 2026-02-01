/**
 * Test script for learning preferences
 * This script tests the learning preferences functionality
 */

const { updateLawyerPreferences, learnFromInteractions } = require('./ai_relevance_scoring.js');
const { createInteraction, getInteractionsByLawyerId, getTopicInterestsByLawyerId } = require('./database/dao/userInteractionDao.js');

// Mock data for testing
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
  }
];

const mockInteractions = [
  {
    lawyer_id: 1,
    decision_id: 1,
    type: "view_decision",
    decision: mockDecisions[0],
    timestamp: "2025-11-16T10:00:00Z"
  },
  {
    lawyer_id: 1,
    decision_id: 1,
    type: "click_link",
    decision: mockDecisions[0],
    timestamp: "2025-11-16T10:05:00Z"
  },
  {
    lawyer_id: 1,
    decision_id: 2,
    type: "view_decision",
    decision: mockDecisions[1],
    timestamp: "2025-11-16T11:00:00Z"
  }
];

async function testLearningPreferences() {
  console.log("Testing learning preferences functionality...\n");
  
  try {
    // Test 1: Update lawyer preferences
    console.log("Test 1: Update lawyer preferences");
    const updatedLawyer = updateLawyerPreferences(mockLawyer, mockInteractions);
    console.log("  Updated lawyer preferences:");
    console.log(`    Topics: ${updatedLawyer.einstellungen.themengebiete.join(', ')}`);
    
    // Test 2: Learn from interactions
    console.log("\nTest 2: Learn from interactions");
    const insights = learnFromInteractions(mockInteractions);
    console.log("  Learning insights:");
    console.log(`    Total interactions: ${insights.totalInteractions}`);
    console.log(`    Interaction types: ${JSON.stringify(insights.interactionTypes)}`);
    console.log(`    Popular topics: ${JSON.stringify(insights.popularTopics)}`);
    
    console.log("\nLearning preferences tests completed successfully!");
    return true;
  } catch (error) {
    console.error("Error testing learning preferences:", error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testLearningPreferences().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testLearningPreferences };