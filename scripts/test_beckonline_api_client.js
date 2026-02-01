/**
 * Testskript für den Beck-online API Client
 * Dieses Skript testet die Funktionalität des Beck-online API Clients
 */

const { 
  getBeckOnlineArtikel,
  getBeckOnlineArtikelDetails,
  getDatenbanken,
  abrufeUndVerarbeiteBeckOnlineArtikel
} = require('./beckonline_api_client.js');

async function testeBeckOnlineApi() {
  console.log('Teste Beck-online API Client...\n');
  
  try {
    // Test 1: Grundlegende Artikelabfrage
    console.log('Test 1: Grundlegende Artikelabfrage');
    const artikel = await getBeckOnlineArtikel({ limit: 5 });
    console.log(`  ${artikel.length} Artikel abgerufen`);
    
    if (artikel.length > 0) {
      console.log(`  Erster Artikel: ${artikel[0].titel}`);
    }
    
    // Test 2: Erweiterte Abfrage mit Filtern
    console.log('\nTest 2: Erweiterte Abfrage mit Filtern');
    const erweiterteArtikel = await getBeckOnlineArtikel({
      suchbegriff: 'Mietpreisbremse',
      jahr: 2025,
      limit: 3
    });
    console.log(`  ${erweiterteArtikel.length} gefilterte Artikel abgerufen`);
    
    // Test 3: Datenbanken abrufen
    console.log('\nTest 3: Datenbanken abrufen');
    const datenbanken = await getDatenbanken();
    console.log(`  ${datenbanken.length} Datenbanken abgerufen`);
    if (datenbanken.length > 0) {
      console.log(`  Beispiel: ${datenbanken[0].name} (${datenbanken[0].beschreibung})`);
    }
    
    // Test 4: Artikel-Details abrufen (wenn Artikel vorhanden sind)
    if (artikel.length > 0) {
      console.log('\nTest 4: Artikel-Details abrufen');
      const artikelId = artikel[0].id;
      console.log(`  Abrufen von Details für Artikel ID: ${artikelId}`);
      // Dieser Test ist auskommentiert, da wir keine echte API haben
      // const details = await getBeckOnlineArtikelDetails(artikelId);
      // console.log(`  Details abgerufen: ${details.titel}`);
      console.log('  Test übersprungen (keine echte API verfügbar)');
    }
    
    // Test 5: Verarbeitete Artikel abrufen
    console.log('\nTest 5: Verarbeitete Artikel abrufen');
    const verarbeiteteArtikel = await abrufeUndVerarbeiteBeckOnlineArtikel({ limit: 3 });
    console.log(`  ${verarbeiteteArtikel.length} verarbeitete Artikel abgerufen`);
    
    if (verarbeiteteArtikel.length > 0) {
      const ersterArtikel = verarbeiteteArtikel[0];
      console.log(`  Erster verarbeiteter Artikel:`);
      console.log(`    Quelle: ${ersterArtikel.quelle}`);
      console.log(`    Datenbank: ${ersterArtikel.datenbank}`);
      console.log(`    Datum: ${ersterArtikel.datum}`);
      console.log(`    Titel: ${ersterArtikel.titel}`);
      console.log(`    Zusammenfassung: ${ersterArtikel.zusammenfassung.substring(0, 50)}...`);
    }
    
    console.log('\nAlle Beck-online API Tests erfolgreich abgeschlossen!');
    return true;
  } catch (error) {
    console.error('Fehler beim Testen des Beck-online API Clients:', error.message);
    return false;
  }
}

// Tests ausführen, wenn das Skript direkt gestartet wird
if (require.main === module) {
  testeBeckOnlineApi().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testeBeckOnlineApi };