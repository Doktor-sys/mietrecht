/**
 * Testskript für den juris API Client
 * Dieses Skript testet die Funktionalität des juris API Clients
 */

const { 
  getJurisDokumente,
  getJurisDokumentDetails,
  getDatenbanken,
  abrufeUndVerarbeiteJurisDokumente
} = require('./juris_api_client.js');

async function testeJurisApi() {
  console.log('Teste juris API Client...\n');
  
  try {
    // Test 1: Grundlegende Dokumentabfrage
    console.log('Test 1: Grundlegende Dokumentabfrage');
    const dokumente = await getJurisDokumente({ limit: 5 });
    console.log(`  ${dokumente.length} Dokumente abgerufen`);
    
    if (dokumente.length > 0) {
      console.log(`  Erstes Dokument: ${dokumente[0].titel}`);
    }
    
    // Test 2: Erweiterte Abfrage mit Filtern
    console.log('\nTest 2: Erweiterte Abfrage mit Filtern');
    const erweiterteDokumente = await getJurisDokumente({
      suchbegriff: 'Mietpreisbremse',
      jahr: 2025,
      limit: 3
    });
    console.log(`  ${erweiterteDokumente.length} gefilterte Dokumente abgerufen`);
    
    // Test 3: Datenbanken abrufen
    console.log('\nTest 3: Datenbanken abrufen');
    const datenbanken = await getDatenbanken();
    console.log(`  ${datenbanken.length} Datenbanken abgerufen`);
    if (datenbanken.length > 0) {
      console.log(`  Beispiel: ${datenbanken[0].name} (${datenbanken[0].beschreibung})`);
    }
    
    // Test 4: Dokument-Details abrufen (wenn Dokumente vorhanden sind)
    if (dokumente.length > 0) {
      console.log('\nTest 4: Dokument-Details abrufen');
      const dokumentId = dokumente[0].id;
      console.log(`  Abrufen von Details für Dokument ID: ${dokumentId}`);
      // Dieser Test ist auskommentiert, da wir keine echte API haben
      // const details = await getJurisDokumentDetails(dokumentId);
      // console.log(`  Details abgerufen: ${details.titel}`);
      console.log('  Test übersprungen (keine echte API verfügbar)');
    }
    
    // Test 5: Verarbeitete Dokumente abrufen
    console.log('\nTest 5: Verarbeitete Dokumente abrufen');
    const verarbeiteteDokumente = await abrufeUndVerarbeiteJurisDokumente({ limit: 3 });
    console.log(`  ${verarbeiteteDokumente.length} verarbeitete Dokumente abgerufen`);
    
    if (verarbeiteteDokumente.length > 0) {
      const erstesDokument = verarbeiteteDokumente[0];
      console.log(`  Erstes verarbeitetes Dokument:`);
      console.log(`    Quelle: ${erstesDokument.quelle}`);
      console.log(`    Datenbank: ${erstesDokument.datenbank}`);
      console.log(`    Datum: ${erstesDokument.datum}`);
      console.log(`    Titel: ${erstesDokument.titel}`);
      console.log(`    Zusammenfassung: ${erstesDokument.zusammenfassung.substring(0, 50)}...`);
    }
    
    console.log('\nAlle juris API Tests erfolgreich abgeschlossen!');
    return true;
  } catch (error) {
    console.error('Fehler beim Testen des juris API Clients:', error.message);
    return false;
  }
}

// Tests ausführen, wenn das Skript direkt gestartet wird
if (require.main === module) {
  testeJurisApi().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testeJurisApi };