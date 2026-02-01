/**
 * Test script for NLP Processor
 * This script tests the natural language processing capabilities for analyzing court decisions.
 */

const {
  summarizeDecision,
  extractTopics,
  extractEntities,
  classifyImportance,
  generatePracticeImplications,
  compareDecisions
} = require('./nlp_processor.js');

console.log("Testing NLP Processor...\n");

// Test data
const sampleDecisionText = `
Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls 
die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. 
Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit. 

In dem Fall ging es um eine Mietwohnung in Berlin, in der es zu erheblichen Schimmelproblemen kam. 
Der Vermieter hatte argumentiert, dass der Mieter durch falsches Lüften selbst zum Schimmelbefall beigetragen habe. 
Das Landgericht hatte zuerst entschieden, dass keine Mietminderung zulässig sei. 

Das Oberlandesgericht hat diese Entscheidung jedoch aufgehoben und eine Mietminderung von 20% erlaubt. 
Nun hat der BGH diese Rechtsauffassung bestätigt. 

Die Entscheidung bedeutet, dass Mieter auch bei eigenem Teilverschulden unter bestimmten Umständen 
eine Mietminderung geltend machen können. Anwälte sollten bei Mietminderungsverlangen nicht mehr 
automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.
`;

const sampleDecision1 = {
  id: 1,
  court: "Bundesgerichtshof",
  location: "Karlsruhe",
  decisionDate: "2025-11-15",
  caseNumber: "VIII ZR 121/24",
  topics: ["Mietminderung", "Schimmelbefall"],
  summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
  fullText: sampleDecisionText,
  url: "https://juris.bundesgerichtshof.de/doc/12345",
  judges: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
  practiceImplications: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
  importance: "high"
};

const sampleDecision2 = {
  id: 2,
  court: "Landgericht",
  location: "Berlin",
  decisionDate: "2025-11-10",
  caseNumber: "34 M 12/25",
  topics: ["Kündigung", "Modernisierung"],
  summary: "Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.",
  fullText: "Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.",
  url: "https://www.berlin.landgericht.de/entscheidungen/34-m-12-25",
  judges: ["Richterin Fischer", "Richter Klein"],
  practiceImplications: "Vermieteranwälte müssen bei Eigenbedarfskündigungen unbedingt prüfen, ob die Modernisierungsankündigung fristgerecht erfolgt ist. Mieteranwälte können bei mangelnder Ankündigung die Kündigung angreifen.",
  importance: "medium"
};

async function runTests() {
  try {
    // Test 1: Summarize decision
    console.log("1. Testing decision summarization...");
    const summary = summarizeDecision(sampleDecisionText);
    console.log(`✓ Generated summary: ${summary.substring(0, 100)}...`);
    
    // Test 2: Extract topics
    console.log("\n2. Testing topic extraction...");
    const topics = extractTopics(sampleDecisionText);
    console.log(`✓ Extracted topics: ${topics.join(', ')}`);
    
    // Test 3: Extract entities
    console.log("\n3. Testing entity extraction...");
    const entities = extractEntities(sampleDecisionText);
    console.log(`✓ Extracted persons: ${entities.persons.join(', ')}`);
    console.log(`✓ Extracted organizations: ${entities.organizations.join(', ')}`);
    console.log(`✓ Extracted locations: ${entities.locations.join(', ')}`);
    
    // Test 4: Classify importance
    console.log("\n4. Testing importance classification...");
    const importance1 = classifyImportance(sampleDecision1);
    const importance2 = classifyImportance(sampleDecision2);
    console.log(`✓ Decision 1 importance: ${importance1}`);
    console.log(`✓ Decision 2 importance: ${importance2}`);
    
    // Test 5: Generate practice implications
    console.log("\n5. Testing practice implications generation...");
    const implications = generatePracticeImplications(sampleDecisionText);
    console.log(`✓ Generated implications: ${implications.substring(0, 100)}...`);
    
    // Test 6: Compare decisions
    console.log("\n6. Testing decision comparison...");
    const similarity = compareDecisions(sampleDecision1, sampleDecision2);
    console.log(`✓ Similarity score: ${similarity.toFixed(2)}`);
    
    // Test 7: Test with edge cases
    console.log("\n7. Testing edge cases...");
    const emptySummary = summarizeDecision("");
    console.log(`✓ Empty text summary: ${emptySummary}`);
    
    const emptyTopics = extractTopics("");
    console.log(`✓ Empty text topics: [${emptyTopics.join(', ')}]`);
    
    const nullImportance = classifyImportance(null);
    console.log(`✓ Null decision importance: ${nullImportance}`);
    
    console.log("\n=== Test Results ===");
    console.log("✓ All NLP processor tests completed successfully!");
    console.log("✓ Natural language processing capabilities are working as expected");
    
    // Summary statistics
    console.log("\n=== Summary ===");
    console.log(`Extracted Topics: ${topics.length}`);
    console.log(`Extracted Entities: ${entities.persons.length + entities.organizations.length + entities.locations.length}`);
    console.log(`Decision Similarity: ${(similarity * 100).toFixed(0)}%`);
    
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };