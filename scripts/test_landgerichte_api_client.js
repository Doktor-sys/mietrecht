/**
 * Testskript für den Landgerichte API Client
 * Dieses Skript testet die Funktionalität des Landgerichte API Clients
 */

const { 
  getLandgerichtsEntscheidungen,
  getLandgerichte,
  getBundeslaender,
  abrufeUndVerarbeiteLandgerichtsEntscheidungen
} = require('./landgerichte_api_client.js');

async function testeLandgerichteApi() {
  console.log('Teste Landgerichte API Client...\n');
  
  try {
    // Test 1: Grundlegende Entscheidungsabfrage
    console.log('Test 1: Grundlegende Entscheidungsabfrage');
    const entscheidungen = await getLandgerichtsEntscheidungen({ limit: 5 });
    console.log(`  ${entscheidungen.length} Entscheidungen abgerufen`);
    
    if (entscheidungen.length > 0) {
      console.log(`  Erste Entscheidung: ${entscheidungen[0].titel}`);
    }
    
    // Test 2: Erweiterte Abfrage mit Filtern
    console.log('\nTest 2: Erweiterte Abfrage mit Filtern');
    const erweiterteEntscheidungen = await getLandgerichtsEntscheidungen({
      jahr: 2025,
      limit: 3,
      bundesland: 'Bayern'
    });
    console.log(`  ${erweiterteEntscheidungen.length} gefilterte Entscheidungen abgerufen`);
    
    // Test 3: Landgerichte abrufen
    console.log('\nTest 3: Landgerichte abrufen');
    const landgerichte = await getLandgerichte({ bundesland: 'Nordrhein-Westfalen' });
    console.log(`  ${landgerichte.length} Landgerichte abgerufen`);
    if (landgerichte.length > 0) {
      console.log(`  Beispiel: ${landgerichte[0].name} in ${landgerichte[0].ort}`);
    }
    
    // Test 4: Bundesländer abrufen
    console.log('\nTest 4: Bundesländer abrufen');
    const bundeslaender = await getBundeslaender();
    console.log(`  ${bundeslaender.length} Bundesländer abgerufen`);
    if (bundeslaender.length > 0) {
      console.log(`  Beispiel: ${bundeslaender[0].name}`);
    }
    
    // Test 5: Verarbeitete Entscheidungen abrufen
    console.log('\nTest 5: Verarbeitete Entscheidungen abrufen');
    const verarbeiteteEntscheidungen = await abrufeUndVerarbeiteLandgerichtsEntscheidungen({ limit: 3 });
    console.log(`  ${verarbeiteteEntscheidungen.length} verarbeitete Entscheidungen abgerufen`);
    
    if (verarbeiteteEntscheidungen.length > 0) {
      const ersteEntscheidung = verarbeiteteEntscheidungen[0];
      console.log(`  Erste verarbeitete Entscheidung:`);
      console.log(`    Gericht: ${ersteEntscheidung.gericht}`);
      console.log(`    Ort: ${ersteEntscheidung.ort}`);
      console.log(`    Datum: ${ersteEntscheidung.datum}`);
      console.log(`    Aktenzeichen: ${ersteEntscheidung.az}`);
      console.log(`    Zusammenfassung: ${ersteEntscheidung.zusammenfassung.substring(0, 50)}...`);
    }
    
    console.log('\nAlle Landgerichte API Tests erfolgreich abgeschlossen!');
    return true;
  } catch (error) {
    console.error('Fehler beim Testen des Landgerichte API Clients:', error.message);
    return false;
  }
}

// Tests ausführen, wenn das Skript direkt gestartet wird
if (require.main === module) {
  testeLandgerichteApi().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testeLandgerichteApi };