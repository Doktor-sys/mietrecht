/**
 * Test script for contextual filtering
 * This script tests the contextual filtering functionality
 */

const { applyContextualFiltering, generateContext, enhanceWithContextualScores, combineScores, contextualFilter } = require('./contextual_filtering.js');

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
    gericht: "Landgericht",
    ort: "Hamburg",
    datum: "2025-11-05",
    az: "12 M 45/25",
    themen: ["Heizkosten", "Nebenkostenabrechnung"],
    zusammenfassung: "Pauschale Verteilung von Heizkosten nach Quadratmetern unzulässig",
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

async function testContextualFiltering() {
  console.log("Testing contextual filtering functionality...\n");
  
  try {
    // Test 1: Generate context
    console.log("Test 1: Generate context");
    const context = generateContext(mockLawyer);
    console.log("  Generated context:");
    console.log(`    Lawyer: ${context.lawyerName}`);
    console.log(`    Practice areas: ${context.practiceAreas.join(', ')}`);
    console.log(`    Regions: ${context.regions.join(', ')}`);
    if (context.seasonalTopics) {
      console.log(`    Seasonal topics: ${context.seasonalTopics.join(', ')}`);
    }
    
    // Test 2: Apply contextual filtering
    console.log("\nTest 2: Apply contextual filtering");
    const filteredDecisions = applyContextualFiltering(mockDecisions, {
      courtTypes: ["Landgericht"],
      regions: ["Berlin"],
      importanceLevels: ["hoch", "mittel"]
    });
    console.log(`  Found ${filteredDecisions.length} decisions after contextual filtering`);
    
    // Test 3: Enhance with contextual scores
    console.log("\nTest 3: Enhance with contextual scores");
    const scoredDecisions = enhanceWithContextualScores(mockDecisions, context);
    console.log("  Decisions with contextual scores:");
    scoredDecisions.forEach(decision => {
      console.log(`    ${decision.id}: ${decision.contextualScore.toFixed(3)} - ${decision.zusammenfassung}`);
    });
    
    // Test 4: Contextual filter
    console.log("\nTest 4: Contextual filter");
    const finalDecisions = contextualFilter(mockDecisions, mockLawyer, []);
    console.log("  Final filtered and scored decisions:");
    finalDecisions.forEach(decision => {
      const score = decision.combinedScore || decision.contextualScore || 0;
      console.log(`    ${decision.id}: ${score.toFixed(3)} - ${decision.zusammenfassung}`);
    });
    
    console.log("\nContextual filtering tests completed successfully!");
    return true;
  } catch (error) {
    console.error("Error testing contextual filtering:", error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testContextualFiltering().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testContextualFiltering };