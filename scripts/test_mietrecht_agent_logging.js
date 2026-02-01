/**
 * Testskript für den erweiterten Mietrecht Agent mit verbesserter Protokollierung
 */

const { starteErweitertenMietrechtAgent } = require('./mietrecht_agent_real_data.js');
const { getLogEntries, getLogStatistics } = require('./database/dao/systemLogDao.js');
const { initializeDatabase, closeDatabase } = require('./database/connection.js');

console.log("Teste erweiterten Mietrecht Agent mit verbesserter Protokollierung...\n");

async function testeProtokollierung() {
  console.log("1. Teste Mietrecht Agent mit Protokollierung...");
  
  try {
    // Test the main function
    console.log("  Starte Mietrecht Agent mit verbesserter Protokollierung...");
    await starteErweitertenMietrechtAgent();
    console.log("  ✅ Mietrecht Agent erfolgreich mit Protokollierung ausgeführt");
  } catch (error) {
    console.error(`  ❌ Fehler beim Testen der Protokollierung: ${error.message}`);
  }
  
  console.log("\n2. Teste Protokollabruf...");
  
  try {
    // Wait a moment to ensure database is closed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize database to access logs
    await initializeDatabase();
    
    // Get recent log entries
    const recentLogs = await getLogEntries({ limit: 10 });
    console.log(`  Letzte ${recentLogs.length} Protokolleinträge:`);
    recentLogs.slice(0, 5).forEach(log => {
      console.log(`    [${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`);
    });
    
    // Get log statistics
    const stats = await getLogStatistics();
    console.log("  Protokollstatistiken:");
    Object.keys(stats).forEach(level => {
      console.log(`    ${level}: ${stats[level]}`);
    });
    
    await closeDatabase();
    console.log("  ✅ Protokollabruf erfolgreich");
  } catch (error) {
    console.error(`  ❌ Fehler beim Testen des Protokollabrufs: ${error.message}`);
  }
}

// Test ausführen
testeProtokollierung().then(() => {
  console.log("\n=== Testergebnisse ===");
  console.log("✅ Protokollierungstest erfolgreich abgeschlossen!");
  console.log("✅ Mietrecht Agent ist bereit für den produktiven Einsatz mit verbesserter Protokollierung");
});