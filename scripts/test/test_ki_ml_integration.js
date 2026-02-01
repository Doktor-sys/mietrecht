/**
 * Test suite for KI/ML Integration Module
 */

const {
  analyzeCourtDecision,
  generatePersonalizedRecommendations,
  analyzeTrends,
  assessCaseRisk,
  analyzeDocuments
} = require('../ki_ml_integration.js');

// Mock data for testing
const mockDecision = {
  id: "test_001",
  court: "Bundesgerichtshof",
  decision_date: "2025-06-15",
  caseNumber: "VIII ZR 123/24",
  fullText: "Der Bundesgerichtshof hat in seiner Entscheidung vom 15. Juni 2025 zur Mietminderung festgestellt, dass Mieter unter bestimmten Umständen auch bei geringfügigen Mängeln eine Mietminderung geltend machen können. Diese Entscheidung hat erhebliche Auswirkungen auf die Praxis des Mietrechts. Anwälte sollten bei der Beratung ihrer Mandanten diese neue Rechtsprechung unbedingt berücksichtigen.",
  topics: ["Mietminderung", "Bundesgerichtshof"],
  importance: "high"
};

const mockCaseData = {
  id: "case_001",
  type: "mietrecht",
  value: 5000,
  documents: [
    {
      id: "doc_001",
      content: "Mietvertrag zwischen Max Mustermann und Anna Schmidt. Die Mietparteien streiten sich über Mängel in der Wohnung."
    }
  ]
};

const mockClientData = {
  id: "client_001",
  name: "Max Mustermann",
  riskTolerance: "medium",
  preferences: {
    communication: "email",
    detailLevel: "high",
    involvement: "high"
  }
};

const mockLawyerData = {
  id: "lawyer_001",
  expertise: ["mietrecht", "vertragsrecht"]
};

const mockDecisions = [
  mockDecision,
  {
    id: "test_002",
    court: "Landgericht",
    decision_date: "2025-06-10",
    caseNumber: "3 S 456/25",
    fullText: "Das Landgericht hat in seiner Entscheidung über eine Kündigung durch den Vermieter entschieden. Die Kündigung wurde für unwirksam erklärt, da der Vermieter die ordentlichen Kündigungsfristen nicht eingehalten hatte.",
    topics: ["Kündigung", "Landgericht"],
    importance: "medium"
  }
];

const mockDocuments = [
  {
    id: "doc_001",
    content: "Mietvertrag mit allen relevanten Klauseln und Bedingungen."
  },
  {
    id: "doc_002",
    content: "Protokoll der Übergabe mit fotografischer Dokumentation der Mängel."
  }
];

/**
 * Test analyzeCourtDecision function
 */
async function testAnalyzeCourtDecision() {
  console.log("Testing analyzeCourtDecision...");
  
  try {
    const result = await analyzeCourtDecision(mockDecision);
    
    console.log("✓ analyzeCourtDecision executed successfully");
    console.log("  Decision ID:", result.decisionId);
    console.log("  Analysis timestamp:", result.analysisTimestamp);
    
    // Check if required properties exist
    if (result.nlpAnalysis && result.predictiveAnalysis) {
      console.log("✓ Required analysis properties present");
    } else {
      console.log("✗ Missing required analysis properties");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error in analyzeCourtDecision:", error.message);
    return false;
  }
}

/**
 * Test generatePersonalizedRecommendations function
 */
async function testGeneratePersonalizedRecommendations() {
  console.log("\nTesting generatePersonalizedRecommendations...");
  
  try {
    const result = await generatePersonalizedRecommendations(mockCaseData, mockClientData, mockLawyerData);
    
    console.log("✓ generatePersonalizedRecommendations executed successfully");
    console.log("  Case ID:", result.caseId);
    console.log("  Client ID:", result.clientId);
    console.log("  Lawyer ID:", result.lawyerId);
    
    // Check if required properties exist
    if (result.clientProfile && result.caseAnalysis && result.recommendations) {
      console.log("✓ Required recommendation properties present");
    } else {
      console.log("✗ Missing required recommendation properties");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error in generatePersonalizedRecommendations:", error.message);
    return false;
  }
}

/**
 * Test analyzeTrends function
 */
async function testAnalyzeTrends() {
  console.log("\nTesting analyzeTrends...");
  
  try {
    const result = await analyzeTrends(mockDecisions);
    
    console.log("✓ analyzeTrends executed successfully");
    console.log("  Total decisions analyzed:", result.totalDecisions);
    
    // Check if required properties exist
    if (result.hotTopics && result.sentimentTrends) {
      console.log("✓ Required trend analysis properties present");
    } else {
      console.log("✗ Missing required trend analysis properties");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error in analyzeTrends:", error.message);
    return false;
  }
}

/**
 * Test assessCaseRisk function
 */
async function testAssessCaseRisk() {
  console.log("\nTesting assessCaseRisk...");
  
  try {
    const result = await assessCaseRisk(mockCaseData, mockClientData);
    
    console.log("✓ assessCaseRisk executed successfully");
    console.log("  Case ID:", result.caseId);
    console.log("  Client ID:", result.clientId);
    console.log("  Risk level:", result.riskLevel);
    console.log("  Risk score:", result.riskScore.toFixed(2));
    
    // Check if risk score is within valid range
    if (result.riskScore >= 0 && result.riskScore <= 1) {
      console.log("✓ Risk score is within valid range");
    } else {
      console.log("✗ Risk score is outside valid range");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error in assessCaseRisk:", error.message);
    return false;
  }
}

/**
 * Test analyzeDocuments function
 */
async function testAnalyzeDocuments() {
  console.log("\nTesting analyzeDocuments...");
  
  try {
    const result = await analyzeDocuments(mockDocuments);
    
    console.log("✓ analyzeDocuments executed successfully");
    console.log("  Documents analyzed:", result.documentCount);
    
    // Check if required properties exist
    if (result.documentAnalyses && result.commonThemes) {
      console.log("✓ Required document analysis properties present");
    } else {
      console.log("✗ Missing required document analysis properties");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error in analyzeDocuments:", error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("Running KI/ML Integration Tests...\n");
  
  const tests = [
    testAnalyzeCourtDecision,
    testGeneratePersonalizedRecommendations,
    testAnalyzeTrends,
    testAssessCaseRisk,
    testAnalyzeDocuments
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const passed = await test();
      if (passed) {
        passedTests++;
      }
    } catch (error) {
      console.error("Unexpected error in test:", error);
    }
  }
  
  console.log(`\nTest Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log("🎉 All tests passed!");
    return true;
  } else {
    console.log("❌ Some tests failed.");
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("Test suite failed with error:", error);
      process.exit(1);
    });
}

// Export for use in other test files
module.exports = {
  runAllTests,
  testAnalyzeCourtDecision,
  testGeneratePersonalizedRecommendations,
  testAnalyzeTrends,
  testAssessCaseRisk,
  testAnalyzeDocuments
};