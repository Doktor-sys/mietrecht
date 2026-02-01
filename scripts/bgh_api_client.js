/**
 * BGH API Client
 * Client für die BGH-API zur Abfrage von Mietrechtsurteilen
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

/**
 * Ruft aktuelle Mietrechtsurteile vom BGH ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Urteilsdaten
 */
async function getMietrechtsUrteile(options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `bgh_mietrecht_${JSON.stringify(options)}`;
  
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
        limit: options.limit || 20
      };
      
      // Query-String erstellen
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      
      // BGH API-Endpunkt (Beispiel-URL)
      const apiUrl = `https://api.bundesgerichtshof.de/v1/urteile?${queryString}`;
      
      // HTTPS-Anfrage an die BGH-API
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
            
            // Im Cache speichern (5 Minuten TTL)
            setCache(cacheKey, mietrechtsUrteile, 5 * 60 * 1000);
            
            resolve(mietrechtsUrteile);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage: ${error.message}`));
      });
      
      // Timeout hinzufügen
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Zeitüberschreitung bei der API-Anfrage'));
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
 * Verarbeitet BGH-Urteile für den Newsletter
 * @param {Array} urteile - Array mit Urteilsdaten
 * @returns {Array} Verarbeitete Urteile
 */
function verarbeiteBghUrteile(urteile) {
  return urteile.map(urteil => {
    // Wichtigkeit basierend auf Sachgebiet bestimmen
    let wichtigkeit = 'mittel';
    if (urteil.sachgebiet === 'Mietrecht' && urteil.themen.includes('Kündigung')) {
      wichtigkeit = 'hoch';
    } else if (urteil.themen.includes('Mietminderung') || urteil.themen.includes('Nebenkosten')) {
      wichtigkeit = 'hoch';
    }
    
    return {
      id: urteil.id,
      gericht: "Bundesgerichtshof",
      ort: "Karlsruhe",
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
    hinweise = "Diese Entscheidung erweitert den Schutz von Mietern bei Mietminderungsverlangen. Prüfen Sie in aktuellen Fällen die individuellen Umstände des Schadens.";
  } else if (themen.includes('Kündigung')) {
    hinweise = "Die Anforderungen für Eigenbedarfskündigungen wurden präzisiert. Überprüfen Sie Ihre Kündigungsgründe auf Vollständigkeit.";
  } else if (themen.includes('Nebenkosten')) {
    hinweise = "Neue Vorgaben für die Nebenkostenabrechnung. Aktualisieren Sie Ihre Standardbriefköpfe entsprechend.";
  } else if (themen.includes('Mietpreisbremse')) {
    hinweise = "Entscheidung zur Anwendung der Mietpreisbremse. Beachten Sie die geänderten Anforderungen an die Begründung.";
  } else {
    hinweise = "Überprüfen Sie die Auswirkungen dieser Entscheidung auf aktuelle Fälle in Ihrer Praxis.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von BGH-Urteilen
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete BGH-Urteile
 */
async function abrufeUndVerarbeiteBghUrteile(options = {}) {
  try {
    console.log("Rufe BGH-Urteile ab...");
    const urteile = await getMietrechtsUrteile(options);
    console.log(`${urteile.length} BGH-Urteile abgerufen`);
    
    const verarbeiteteUrteile = verarbeiteBghUrteile(urteile);
    return verarbeiteteUrteile;
  } catch (error) {
    console.error(`Fehler beim Abrufen der BGH-Urteile: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  getMietrechtsUrteile,
  verarbeiteBghUrteile,
  generierePraxishinweise,
  abrufeUndVerarbeiteBghUrteile
};