/**
 * Test script for NJW API Client
 */

const {
  fetchNJWArticles,
  parseNJWResponse,
  abrufeUndVerarbeiteNjwArtikel
} = require('./njw_api_client.js');

async function runTests() {
  console.log("🧪 Testing NJW API Client");
  console.log("========================");
  
  try {
    // Test 1: Fetch NJW articles
    console.log("\n1. Testing NJW articles fetch...");
    const njwArticles = await fetchNJWArticles({
      query: "mietrecht",
      limit: 5
    });
    console.log(`✅ Successfully fetched ${njwArticles.length} NJW articles`);
    console.log(`   Sample: ${njwArticles[0]?.title} - ${njwArticles[0]?.summary.substring(0, 50)}...`);
    
    // Test 2: Fetch and process NJW articles
    console.log("\n2. Testing fetch and process NJW articles...");
    const processedArticles = await abrufeUndVerarbeiteNjwArtikel({
      query: "kündigung",
      limit: 3
    });
    console.log(`✅ Successfully fetched and processed ${processedArticles.length} NJW articles`);
    console.log(`   Sample: ${processedArticles[0]?.title} (Type: ${processedArticles[0]?.type})`);
    
    // Test 3: Parse NJW response (with mock data)
    console.log("\n3. Testing parse NJW response...");
    const mockResponse = {
      results: [
        {
          id: "njw-2025-45-5678",
          titel: "Mietpreisbremse nach neuer Rechtsprechung",
          autoren: ["Rechtsanwalt Peter Müller"],
          veroeffentlichungsdatum: "2025-11-15",
          zusammenfassung: "Analyse der aktuellen BGH-Rechtsprechung zur Mietpreisbremse",
          link: "https://njw.beck.de/artikel/2025/45/5678",
          themen: ["Mietpreisbremse", "BGH", "Preisbildung"]
        }
      ]
    };
    
    const parsedArticles = parseNJWResponse(mockResponse);
    console.log(`✅ Successfully parsed ${parsedArticles.length} NJW articles`);
    console.log(`   Sample: ${parsedArticles[0]?.title} - ${parsedArticles[0]?.topics.join(", ")}`);
    
    console.log("\n🎉 All NJW API Client tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };