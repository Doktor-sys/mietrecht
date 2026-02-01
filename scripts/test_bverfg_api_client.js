/**
 * Testskript für den BVerfG API Client
 * Dieses Skript testet die Funktionalität des BVerfG API Clients
 */

const { 
  getBverfgEntscheidungen, 
  getBverfgEntscheidungDetails, 
  getVerfahrensarten, 
  getSpruchkoerper,
  abrufeUndVerarbeiteBverfgEntscheidungen 
} = require('./bverfg_api_client.js');

async function testeBverfgApi() {
  console.log('Teste BVerfG API Client...\n');
  
  try {
    // Test 1: Grundlegende Entscheidungsabfrage
    console.log('Test 1: Grundlegende Entscheidungsabfrage');
    const entscheidungen = await getBverfgEntscheidungen({ limit: 5 });
    console.log(`  ${entscheidungen.length} Entscheidungen abgerufen`);
    
    if (entscheidungen.length > 0) {
      console.log(`  Erste Entscheidung: ${entscheidungen[0].titel}`);
    }
    
    // Test 2: Erweiterte Abfrage mit Filtern
    console.log('\nTest 2: Erweiterte Abfrage mit Filtern');
    const erweiterteEntscheidungen = await getBverfgEntscheidungen({
      jahr: 2025,
      limit: 3,
      verfahrensart: 'Verfassungsbeschwerde'
    });
    console.log(`  ${erweiterteEntscheidungen.length} gefilterte Entscheidungen abgerufen`);
    
    // Test 3: Verfahrensarten abrufen
    console.log('\nTest 3: Verfahrensarten abrufen');
    const verfahrensarten = await getVerfahrensarten();
    console.log(`  ${verfahrensarten.length} Verfahrensarten abgerufen`);
    if (verfahrensarten.length > 0) {
      console.log(`  Beispiel: ${verfahrensarten[0]}`);
    }
    
    // Test 4: Spruchkörper abrufen
    console.log('\nTest 4: Spruchkörper abrufen');
    const spruchkoerper = await getSpruchkoerper();
    console.log(`  ${spruchkoerper.length} Spruchkörper abgerufen`);
    if (spruchkoerper.length > 0) {
      console.log(`  Beispiel: ${spruchkoerper[0]}`);
    }
    
    // Test 5: Einzelne Entscheidungsdetails abrufen (wenn Entscheidungen vorhanden sind)
    if (entscheidungen.length > 0) {
      console.log('\nTest 5: Einzelne Entscheidungsdetails abrufen');
      const entscheidungsId = entscheidungen[0].id;
      console.log(`  Abrufen von Details für Entscheidung ID: ${entscheidungsId}`);
      // Dieser Test ist auskommentiert, da wir keine echte API haben
      // const details = await getBverfgEntscheidungDetails(entscheidungsId);
      // console.log(`  Details abgerufen: ${details.titel}`);
      console.log('  Test übersprungen (keine echte API verfügbar)');
    }
    
    // Test 6: Verarbeitete Entscheidungen abrufen
    console.log('\nTest 6: Verarbeitete Entscheidungen abrufen');
    const verarbeiteteEntscheidungen = await abrufeUndVerarbeiteBverfgEntscheidungen({ limit: 3 });
    console.log(`  ${verarbeiteteEntscheidungen.length} verarbeitete Entscheidungen abgerufen`);
    
    if (verarbeiteteEntscheidungen.length > 0) {
      const ersteEntscheidung = verarbeiteteEntscheidungen[0];
      console.log(`  Erste verarbeitete Entscheidung:`);
      console.log(`    Gericht: ${ersteEntscheidung.gericht}`);
      console.log(`    Datum: ${ersteEntscheidung.datum}`);
      console.log(`    Aktenzeichen: ${ersteEntscheidung.az}`);
      console.log(`    Zusammenfassung: ${ersteEntscheidung.zusammenfassung.substring(0, 50)}...`);
    }
    
    console.log('\nAlle BVerfG API Tests erfolgreich abgeschlossen!');
    return true;
  } catch (error) {
    console.error('Fehler beim Testen des BVerfG API Clients:', error.message);
    return false;
  }
}

// Tests ausführen, wenn das Skript direkt gestartet wird
if (require.main === module) {
  testeBverfgApi().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testeBverfgApi };