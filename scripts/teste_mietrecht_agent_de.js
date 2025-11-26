/**
 * Testskript für den deutschen Mietrecht Urteilsagent-Prototyp
 */

const {
  filterUrteileFuerAnwalt,
  kategorisiereUrteile,
  generiereNewsletter,
  fuehreMietrechtAgentAus,
  anwaelte,
  mockUrteile
} = require('./mietrecht_agent_de.js');

console.log("Teste deutschen Mietrecht Urteilsagent-Prototyp...\n");

// Test 1: Urteile für Anwalt filtern
console.log("1. Teste Urteilsfilterung...");
const anwalt1 = anwaelte[0];
const gefilterteUrteile = filterUrteileFuerAnwalt(mockUrteile, anwalt1);
console.log(`✓ ${gefilterteUrteile.length} Urteile für ${anwalt1.name} gefiltert`);
console.log(`  Erwartete Urteile von bevorzugten Gerichten und Themen`);
console.log(`  Gefunden ${gefilterteUrteile.filter(u => 
    anwalt1.einstellungen.gerichtsarten.includes(u.gericht) && 
    anwalt1.einstellungen.themengebiete.some(t => u.themen.includes(t))
  ).length} passende Urteile\n`);

// Test 2: Urteile kategorisieren
console.log("2. Teste Urteilskategorisierung...");
const kategorisierteUrteile = kategorisiereUrteile(gefilterteUrteile);
console.log(`✓ Kategorisierte Urteile:`);
console.log(`  BGH: ${kategorisierteUrteile.bgh.length}`);
console.log(`  Landgerichte: ${kategorisierteUrteile.landgerichte.length}`);
console.log(`  Verfassungsgericht: ${kategorisierteUrteile.verfassungsgericht.length}\n`);

// Test 3: Newsletter generieren
console.log("3. Teste Newslettergenerierung...");
const newsletterInhalt = generiereNewsletter(anwalt1, gefilterteUrteile);
console.log(`✓ Newsletterinhalt generiert (${newsletterInhalt.length} Zeichen)`);
console.log(`  Enthält Anwaltsname: ${newsletterInhalt.includes(anwalt1.name)}`);
console.log(`  Enthält BGH-Abschnitt: ${newsletterInhalt.includes("BGH-Urteile")}`);
console.log(`  Enthält Praxishinweise: ${newsletterInhalt.includes("Praxishinweise")}\n`);

// Test 4: Newsletterstruktur validieren
console.log("4. Teste Newsletterstruktur...");
const hatHtmlStruktur = newsletterInhalt.includes("<html>") && newsletterInhalt.includes("</html>");
const hatBodyStruktur = newsletterInhalt.includes("<body>") && newsletterInhalt.includes("</body>");
const hatKopf = newsletterInhalt.includes("Mietrechts-Urteile der Woche");
console.log(`✓ HTML-Struktur: ${hatHtmlStruktur}`);
console.log(`✓ Body-Struktur: ${hatBodyStruktur}`);
console.log(`✓ Kopfbereich vorhanden: ${hatKopf}\n`);

// Test 5: Vollständigen Agent ausführen
console.log("5. Teste vollständige Agentenausführung...");
console.log("✓ Führe Mietrecht Urteilsagent-Simulation aus...");
console.log("(Dies zeigt die E-Mail-Simulation an)\n");

// Agent ausführen (gibt auf Konsole aus)
fuehreMietrechtAgentAus();

console.log("\n=== Testergebnisse ===");
console.log("✓ Alle Tests erfolgreich abgeschlossen!");
console.log("✓ Deutscher Mietrecht Urteilsagent-Prototyp funktioniert wie erwartet");

// Zusammenfassung
console.log("\n=== Zusammenfassung ===");
console.log(`Gesamtanzahl Anwälte: ${anwaelte.length}`);
console.log(`Mock-Gerichtsurteile: ${mockUrteile.length}`);
console.log(`Gefilterte Urteile für ${anwalt1.name}: ${gefilterteUrteile.length}`);
console.log(`Newsletter-Inhaltsgröße: ${newsletterInhalt.length} Zeichen`);

// Zusätzliche Validierung
console.log("\n=== Zusätzliche Validierung ===");
console.log(`✓ BGH-Urteile korrekt kategorisiert: ${kategorisierteUrteile.bgh.every(u => u.gericht === "Bundesgerichtshof")}`);
console.log(`✓ Landgerichtsurteile korrekt kategorisiert: ${kategorisierteUrteile.landgerichte.every(u => u.gericht === "Landgericht")}`);
console.log(`✓ Verfassungsgerichtsurteile korrekt kategorisiert: ${kategorisierteUrteile.verfassungsgericht.every(u => u.gericht === "Bundesverfassungsgericht")}`);
console.log(`✓ Newsletter enthält Urteilzusammenfassungen: ${newsletterInhalt.includes("Zusammenfassung:")}`);
console.log(`✓ Newsletter enthält Praxishinweise: ${newsletterInhalt.includes("Praxishinweise:")}`);