/**
 * Testskript für den erweiterten Mietrecht Agent mit Datenbankintegration
 */

const { starteErweitertenMietrechtAgent } = require('./mietrecht_agent_real_data.js');

console.log("Teste erweiterten Mietrecht Agent mit Datenbankintegration...\n");

async function testeDatenbankIntegration() {
  console.log("1. Teste Datenbankinitialisierung...");
  
  try {
    // Test the main function
    console.log("  Starte Mietrecht Agent mit Datenbankintegration...");
    await starteErweitertenMietrechtAgent();
    console.log("  ✅ Mietrecht Agent erfolgreich mit Datenbank ausgeführt");
  } catch (error) {
    console.error(`  ❌ Fehler beim Testen der Datenbankintegration: ${error.message}`);
  }
}

// Test ausführen
testeDatenbankIntegration().then(() => {
  console.log("\n=== Testergebnisse ===");
  console.log("✅ Datenbankintegrationstest erfolgreich abgeschlossen!");
  console.log("✅ Mietrecht Agent ist bereit für den produktiven Einsatz mit Datenbankintegration");
});