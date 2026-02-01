/**
 * Landgericht API Client
 * Client für die Abfrage von Landgerichtsentscheidungen
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

// Liste der unterstützten Landgerichte
const unterstuetzteLandgerichte = [
  { name: "Landgericht Berlin", apiEndpoint: "https://api.berlin.landgericht.de/v1", region: "Berlin" },
  { name: "Landgericht Hamburg", apiEndpoint: "https://api.hamburg.landgericht.de/v1", region: "Hamburg" },
  { name: "Landgericht München", apiEndpoint: "https://api.muenchen.landgericht.de/v1", region: "Bayern" },
  { name: "Landgericht Frankfurt", apiEndpoint: "https://api.frankfurt.landgericht.de/v1", region: "Hessen" },
  { name: "Landgericht Köln", apiEndpoint: "https://api.koeln.landgericht.de/v1", region: "Nordrhein-Westfalen" }
];

/**
 * Ruft Mietrechtsurteile von einem bestimmten Landgericht ab
 * @param {Object} landgericht - Landgericht-Objekt
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Urteilsdaten
 */
async function getLandgerichtUrteile(landgericht, options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `landgericht_${landgericht.name}_${JSON.stringify(options)}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Verwende die retry-Funktion für die API-Anfrage
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // Standardoptionen
      const queryParams = {
        sachgebiet: 'Mietrecht',
        jahr: options.jahr || new Date().getFullYear(),
        limit: options.limit || 10
      };
      
      // Query-String erstellen
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      
      // API-Endpunkt
      const apiUrl = `${landgericht.apiEndpoint}/urteile?${queryString}`;
      
      // HTTPS-Anfrage
      const req = https.get(apiUrl, (res) => {
        let data = '';
        
        // Daten empfangen
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // Anfrage abgeschlossen
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            // Nur Mietrechtsurteile zurückgeben
            const mietrechtsUrteile = response.urteile.filter(urteil => 
              urteil.sachgebiet === 'Mietrecht' || 
              urteil.themen.some(thema => thema.includes('Miete'))
            );
            
            // Im Cache speichern (2 Minuten TTL)
            setCache(cacheKey, mietrechtsUrteile, 2 * 60 * 1000);
            
            resolve(mietrechtsUrteile);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort von ${landgericht.name}: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage an ${landgericht.name}: ${error.message}`));
      });
      
      // Timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error(`Timeout bei der API-Anfrage an ${landgericht.name}`));
      });
      
      // Anfrage absenden
      req.end();
    });
  }, {
    maxRetries: options.maxRetries || 3,
    baseDelay: options.baseDelay || 1000
  });
}

/**
 * Ruft Mietrechtsurteile von allen unterstützten Landgerichten ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Urteilsdaten von allen Landgerichten
 */
async function getAlleLandgerichtUrteile(options = {}) {
  console.log("Rufe Urteile von allen Landgerichten ab...");
  
  // Cache-Schlüssel generieren
  const cacheKey = `alle_landgerichte_${JSON.stringify(options)}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    console.log(`Daten für alle Landgerichte aus dem Cache abgerufen (${cachedData.length} Urteile)`);
    return cachedData;
  }
  
  // Promise für jedes Landgericht erstellen
  const promises = unterstuetzteLandgerichte.map(landgericht => 
    getLandgerichtUrteile(landgericht, options)
      .then(urteile => {
        console.log(`  ${urteile.length} Urteile von ${landgericht.name} abgerufen`);
        return urteile;
      })
      .catch(error => {
        console.error(`  Fehler beim Abrufen von ${landgericht.name}: ${error.message}`);
        return []; // Leeres Array zurückgeben, wenn ein Landgericht fehlschlt
      })
  );
  
  try {
    // Alle Promises ausführen
    const ergebnisse = await Promise.all(promises);
    
    // Ergebnisse zusammenführen
    const alleUrteile = ergebnisse.flat();
    
    console.log(`Insgesamt ${alleUrteile.length} Urteile von allen Landgerichten abgerufen`);
    
    // Im Cache speichern (2 Minuten TTL)
    setCache(cacheKey, alleUrteile, 2 * 60 * 1000);
    
    return alleUrteile;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Landgerichtsurteile: ${error.message}`);
    return [];
  }
}

/**
 * Verarbeitet Landgerichts-Urteile für den Newsletter
 * @param {Array} urteile - Array mit Urteilsdaten
 * @returns {Array} Verarbeitete Urteile
 */
function verarbeiteLandgerichtsUrteile(urteile) {
  return urteile.map(urteil => {
    // Wichtigkeit basierend auf Sachgebiet bestimmen
    let wichtigkeit = 'mittel';
    if (urteil.themen.includes('Kündigung') || urteil.themen.includes('Mietminderung')) {
      wichtigkeit = 'hoch';
    }
    
    return {
      id: urteil.id,
      gericht: urteil.gericht || "Landgericht",
      ort: urteil.ort || "Deutschland",
      datum: urteil.datum,
      az: urteil.aktenzeichen,
      themen: urteil.themen,
      zusammenfassung: urteil.titel,
      volltext: urteil.text,
      url: urteil.url,
      richter: urteil.richter || [],
      praxishinweise: generierePraxishinweise(urteil),
      wichtigkeit: wichtigkeit
    };
  });
}

/**
 * Generiert Praxishinweise basierend auf Urteilsthemen
 * @param {Object} urteil - Urteilsdaten
 * @returns {String} Praxishinweise
 */
function generierePraxishinweise(urteil) {
  const themen = urteil.themen;
  let hinweise = "";
  
  if (themen.includes('Mietminderung')) {
    hinweise = "Diese Entscheidung betrifft die Mietminderung. Prüfen Sie die individuellen Umstände des Falls.";
  } else if (themen.includes('Kündigung')) {
    hinweise = "Die Anforderungen für Kündigungen wurden präzisiert. Überprüfen Sie Ihre Kündigungsgründe.";
  } else if (themen.includes('Nebenkosten')) {
    hinweise = "Neue Vorgaben für die Nebenkostenabrechnung. Aktualisieren Sie Ihre Standardbriefköpfe.";
  } else if (themen.includes('Mietpreisbremse')) {
    hinweise = "Entscheidung zur Anwendung der Mietpreisbremse. Beachten Sie die geänderten Anforderungen.";
  } else {
    hinweise = "Überprüfen Sie die Auswirkungen dieser Entscheidung auf aktuelle Fälle in Ihrer Praxis.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von Landgerichts-Urteilen
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete Landgerichts-Urteile
 */
async function abrufeUndVerarbeiteLandgerichtsUrteile(options = {}) {
  try {
    const urteile = await getAlleLandgerichtUrteile(options);
    const verarbeiteteUrteile = verarbeiteLandgerichtsUrteile(urteile);
    return verarbeiteteUrteile;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Landgerichts-Urteile: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  unterstuetzteLandgerichte,
  getLandgerichtUrteile,
  getAlleLandgerichtUrteile,
  verarbeiteLandgerichtsUrteile,
  generierePraxishinweise,
  abrufeUndVerarbeiteLandgerichtsUrteile
};