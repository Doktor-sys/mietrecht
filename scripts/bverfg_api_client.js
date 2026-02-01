/**
 * Bundesverfassungsgericht API Client
 * Client für die Abfrage von Entscheidungen des Bundesverfassungsgerichts
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

/**
 * Ruft relevante Entscheidungen des Bundesverfassungsgerichts ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Entscheidungsdaten
 */
async function getBverfgEntscheidungen(options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `bverfg_mietrecht_${JSON.stringify(options)}`;
  
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
      
      // Erweiterte Suchparameter
      if (options.verfahrensart) {
        queryParams.verfahrensart = options.verfahrensart;
      }
      
      if (options.spruchkoerper) {
        queryParams.spruchkoerper = options.spruchkoerper;
      }
      
      if (options.datum_von) {
        queryParams.datum_von = options.datum_von;
      }
      
      if (options.datum_bis) {
        queryParams.datum_bis = options.datum_bis;
      }
      
      // Query-String erstellen
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      
      // BVerfG API-Endpunkt (Beispiel-URL)
      const apiUrl = `https://api.bundesverfassungsgericht.de/v1/entscheidungen?${queryString}`;
      
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
            
            // Nur relevante Entscheidungen zurückgeben
            const relevanteEntscheidungen = response.entscheidungen.filter(entscheidung => 
              entscheidung.sachgebiet === 'Mietrecht' || 
              entscheidung.themen.some(thema => thema.includes('Miete')) ||
              entscheidung.themen.some(thema => thema.includes('Wohnung'))
            );
            
            // Im Cache speichern (10 Minuten TTL)
            setCache(cacheKey, relevanteEntscheidungen, 10 * 60 * 1000);
            
            resolve(relevanteEntscheidungen);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage: ${error.message}`));
      });
      
      // Timeout
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
 * Ruft detaillierte Informationen zu einer einzelnen Entscheidung ab
 * @param {string} entscheidungsId - ID der Entscheidung
 * @returns {Promise<Object>} Detaillierte Entscheidungsdaten
 */
async function getBverfgEntscheidungDetails(entscheidungsId) {
  // Cache-Schlüssel generieren
  const cacheKey = `bverfg_entscheidung_${entscheidungsId}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // BVerfG API-Endpunkt für Einzelentscheidung
      const apiUrl = `https://api.bundesverfassungsgericht.de/v1/entscheidungen/${entscheidungsId}`;
      
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
            const entscheidung = JSON.parse(data);
            
            // Im Cache speichern (30 Minuten TTL)
            setCache(cacheKey, entscheidung, 30 * 60 * 1000);
            
            resolve(entscheidung);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage: ${error.message}`));
      });
      
      // Timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Zeitüberschreitung bei der API-Anfrage'));
      });
      
      // Anfrage absenden
      req.end();
    });
  }, {
    maxRetries: 3,
    baseDelay: 1000
  });
}

/**
 * Ruft eine Liste aller verfügbaren Verfahrensarten ab
 * @returns {Promise<Array>} Liste der Verfahrensarten
 */
async function getVerfahrensarten() {
  const cacheKey = 'bverfg_verfahrensarten';
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // BVerfG API-Endpunkt für Verfahrensarten
      const apiUrl = 'https://api.bundesverfassungsgericht.de/v1/verfahrensarten';
      
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
            
            // Im Cache speichern (60 Minuten TTL)
            setCache(cacheKey, response.verfahrensarten, 60 * 60 * 1000);
            
            resolve(response.verfahrensarten);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage: ${error.message}`));
      });
      
      // Timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Zeitüberschreitung bei der API-Anfrage'));
      });
      
      // Anfrage absenden
      req.end();
    });
  }, {
    maxRetries: 3,
    baseDelay: 1000
  });
}

/**
 * Ruft eine Liste aller Spruchkörper ab
 * @returns {Promise<Array>} Liste der Spruchkörper
 */
async function getSpruchkoerper() {
  const cacheKey = 'bverfg_spruchkoerper';
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // BVerfG API-Endpunkt für Spruchkörper
      const apiUrl = 'https://api.bundesverfassungsgericht.de/v1/spruchkoerper';
      
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
            
            // Im Cache speichern (60 Minuten TTL)
            setCache(cacheKey, response.spruchkoerper, 60 * 60 * 1000);
            
            resolve(response.spruchkoerper);
          } catch (error) {
            reject(new Error(`Fehler beim Parsen der API-Antwort: ${error.message}`));
          }
        });
      });
      
      // Fehlerbehandlung
      req.on('error', (error) => {
        reject(new Error(`Fehler bei der API-Anfrage: ${error.message}`));
      });
      
      // Timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Zeitüberschreitung bei der API-Anfrage'));
      });
      
      // Anfrage absenden
      req.end();
    });
  }, {
    maxRetries: 3,
    baseDelay: 1000
  });
}

/**
 * Verarbeitet BVerfG-Entscheidungen für den Newsletter
 * @param {Array} entscheidungen - Array mit Entscheidungsdaten
 * @returns {Array} Verarbeitete Entscheidungen
 */
function verarbeiteBverfgEntscheidungen(entscheidungen) {
  return entscheidungen.map(entscheidung => {
    // Wichtigkeit basierend auf Sachgebiet bestimmen
    let wichtigkeit = 'mittel';
    if (entscheidung.themen.includes('Grundrecht auf Wohnung') || 
        entscheidung.themen.includes('Mietpreisbremse')) {
      wichtigkeit = 'hoch';
    }
    
    return {
      id: entscheidung.id,
      gericht: "Bundesverfassungsgericht",
      ort: "Karlsruhe",
      datum: entscheidung.datum,
      az: entscheidung.aktenzeichen,
      themen: entscheidung.themen,
      zusammenfassung: entscheidung.titel,
      volltext: entscheidung.text,
      url: entscheidung.url,
      richter: entscheidung.richter || [],
      praxishinweise: generierePraxishinweise(entscheidung),
      wichtigkeit: wichtigkeit
    };
  });
}

/**
 * Generiert Praxishinweise basierend auf Entscheidungsthemen
 * @param {Object} entscheidung - Entscheidungsdaten
 * @returns {String} Praxishinweise
 */
function generierePraxishinweise(entscheidung) {
  const themen = entscheidung.themen;
  let hinweise = "";
  
  if (themen.includes('Grundrecht auf Wohnung')) {
    hinweise = "Diese Entscheidung betrifft das Grundrecht auf Wohnung. Prüfen Sie die Auswirkungen auf aktuelle Fälle.";
  } else if (themen.includes('Mietpreisbremse')) {
    hinweise = "Die Verfassungsmäßigkeit der Mietpreisbremse wurde geprüft. Beachten Sie die neuen Anforderungen.";
  } else {
    hinweise = "Überprüfen Sie die Auswirkungen dieser Entscheidung auf aktuelle Fälle in Ihrer Praxis.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von BVerfG-Entscheidungen
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete BVerfG-Entscheidungen
 */
async function abrufeUndVerarbeiteBverfgEntscheidungen(options = {}) {
  try {
    console.log("Rufe BVerfG-Entscheidungen ab...");
    const entscheidungen = await getBverfgEntscheidungen(options);
    console.log(`${entscheidungen.length} BVerfG-Entscheidungen abgerufen`);
    
    const verarbeiteteEntscheidungen = verarbeiteBverfgEntscheidungen(entscheidungen);
    return verarbeiteteEntscheidungen;
  } catch (error) {
    console.error(`Fehler beim Abrufen der BVerfG-Entscheidungen: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  getBverfgEntscheidungen,
  getBverfgEntscheidungDetails,
  getVerfahrensarten,
  getSpruchkoerper,
  verarbeiteBverfgEntscheidungen,
  generierePraxishinweise,
  abrufeUndVerarbeiteBverfgEntscheidungen
};