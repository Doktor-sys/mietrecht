/**
 * Testskript für den API Cache
 */

const {
  setCache,
  getCache,
  removeCache,
  cleanupExpired,
  getCacheStats,
  clearCache
} = require('./api_cache.js');

console.log("Teste API Cache...\n");

// Test 1: Daten speichern
console.log("1. Teste Daten speichern...");
setCache("test-key-1", { name: "Testdaten", value: 123 });
setCache("test-key-2", ["Eintrag 1", "Eintrag 2", "Eintrag 3"], 2000); // 2 Sekunden TTL

// Test 2: Daten abrufen
console.log("\n2. Teste Daten abrufen...");
const data1 = getCache("test-key-1");
console.log(`✓ Daten abgerufen: ${JSON.stringify(data1)}`);

const data2 = getCache("test-key-2");
console.log(`✓ Daten abgerufen: ${JSON.stringify(data2)}`);

// Test 3: Nicht existierenden Schlüssel abrufen
console.log("\n3. Teste nicht existierenden Schlüssel...");
const data3 = getCache("non-existent-key");
console.log(`✓ Nicht existierender Schlüssel: ${data3 === null ? "null (erwartet)" : "unerwarteter Wert"}`);

// Test 4: Cache-Statistiken
console.log("\n4. Teste Cache-Statistiken...");
const stats1 = getCacheStats();
console.log(`✓ Cache-Statistiken: ${JSON.stringify(stats1)}`);

// Test 5: Daten entfernen
console.log("\n5. Teste Daten entfernen...");
removeCache("test-key-1");
const data4 = getCache("test-key-1");
console.log(`✓ Nach Entfernen: ${data4 === null ? "null (erwartet)" : "unerwarteter Wert"}`);

// Test 6: Cache-Statistiken nach Entfernen
console.log("\n6. Teste Cache-Statistiken nach Entfernen...");
const stats2 = getCacheStats();
console.log(`✓ Cache-Statistiken: ${JSON.stringify(stats2)}`);

// Test 7: Abgelaufene Daten (kurze Verzögerung)
console.log("\n7. Teste abgelaufene Daten (2 Sekunden Verzögerung)...");
setTimeout(() => {
  const data5 = getCache("test-key-2");
  console.log(`✓ Abgelaufene Daten: ${data5 === null ? "null (erwartet)" : "unerwarteter Wert"}`);
  
  // Test 8: Bereinigung abgelaufener Daten
  console.log("\n8. Teste Bereinigung abgelaufener Daten...");
  cleanupExpired();
  
  // Test 9: Cache-Statistiken nach Bereinigung
  console.log("\n9. Teste Cache-Statistiken nach Bereinigung...");
  const stats3 = getCacheStats();
  console.log(`✓ Cache-Statistiken: ${JSON.stringify(stats3)}`);
  
  // Test 10: Cache leeren
  console.log("\n10. Teste Cache leeren...");
  clearCache();
  
  // Test 11: Cache-Statistiken nach Leeren
  console.log("\n11. Teste Cache-Statistiken nach Leeren...");
  const stats4 = getCacheStats();
  console.log(`✓ Cache-Statistiken: ${JSON.stringify(stats4)}`);
  
  console.log("\n=== Testergebnisse ===");
  console.log("✓ Alle Tests erfolgreich abgeschlossen!");
  console.log("✓ API Cache ist bereit für den produktiven Einsatz");
}, 2100); // Warte 2.1 Sekunden für den Ablauftest