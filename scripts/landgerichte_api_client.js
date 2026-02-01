/**
 * Landgerichte API Client
 * Client für die Abfrage von Entscheidungen der Landgerichte
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

/**
 * Ruft relevante Entscheidungen der Landgerichte ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Entscheidungsdaten
 */
async function getLandgerichtsEntscheidungen(options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `landgerichte_mietrecht_${JSON.stringify(options)}`;
  
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
        rechtsgebiet: 'Mietrecht',
        jahr: options.jahr || new Date().getFullYear(),
        limit: options.limit || 20
      };
      
      // Regionale Filter
      if (options.bundesland) {
        queryParams.bundesland = options.bundesland;
      }
      
      if (options.gericht) {
        queryParams.gericht = options.gericht;
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
      
      // Landgerichte API-Endpunkt (Beispiel-URL)
      const apiUrl = `https://api.landgerichte.de/v1/entscheidungen?${queryString}`;
      
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
              entscheidung.rechtsgebiet === 'Mietrecht' || 
              entscheidung.themen.some(thema => thema.includes('Miete')) ||
              entscheidung.themen.some(thema => thema.includes('Wohnung')) ||
              entscheidung.themen.some(thema => thema.includes('Nebenkosten'))
            );
            
            // Im Cache speichern (15 Minuten TTL)
            setCache(cacheKey, relevanteEntscheidungen, 15 * 60 * 1000);
            
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
 * Ruft eine Liste aller verfügbaren Landgerichte ab
 * @param {Object} options - Filteroptionen
 * @returns {Promise<Array>} Liste der Landgerichte
 */
async function getLandgerichte(options = {}) {
  const cacheKey = `landgerichte_liste_${JSON.stringify(options)}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // API-Endpunkt für Landgerichte
      let apiUrl = 'https://api.landgerichte.de/v1/gerichte?type=landgericht';
      
      // Filterparameter hinzufügen
      if (options.bundesland) {
        apiUrl += `&bundesland=${encodeURIComponent(options.bundesland)}`;
      }
      
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
            setCache(cacheKey, response.gerichte, 60 * 60 * 1000);
            
            resolve(response.gerichte);
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
 * Ruft eine Liste aller Bundesländer mit Gerichten ab
 * @returns {Promise<Array>} Liste der Bundesländer
 */
async function getBundeslaender() {
  const cacheKey = 'bundeslaender_mit_gerichten';
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // API-Endpunkt für Bundesländer
      const apiUrl = 'https://api.landgerichte.de/v1/bundeslaender';
      
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
            
            // Im Cache speichern (120 Minuten TTL)
            setCache(cacheKey, response.bundeslaender, 120 * 60 * 1000);
            
            resolve(response.bundeslaender);
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
 * Verarbeitet Landgerichtsentscheidungen für den Newsletter
 * @param {Array} entscheidungen - Array mit Entscheidungsdaten
 * @returns {Array} Verarbeitete Entscheidungen
 */
function verarbeiteLandgerichtsEntscheidungen(entscheidungen) {
  return entscheidungen.map(entscheidung => {
    // Wichtigkeit basierend auf verschiedenen Faktoren bestimmen
    let wichtigkeit = 'mittel';
    
    // Hohe Wichtigkeit für bestimmte Themen
    if (entscheidung.themen.some(thema => thema.includes('Kündigung')) ||
        entscheidung.themen.some(thema => thema.includes('Mietpreisbremse')) ||
        entscheidung.themen.some(thema => thema.includes('Modernisierung'))) {
      wichtigkeit = 'hoch';
    }
    
    // Geringe Wichtigkeit für Standardfälle
    if (entscheidung.themen.some(thema => thema.includes('Nebenkosten')) ||
        entscheidung.themen.some(thema => thema.includes('Kaution'))) {
      wichtigkeit = 'niedrig';
    }
    
    return {
      id: entscheidung.id,
      gericht: entscheidung.gericht,
      ort: entscheidung.ort,
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
  
  if (themen.some(thema => thema.includes('Kündigung'))) {
    hinweise = "Diese Entscheidung betrifft Mieterkündigungen. Prüfen Sie die Auswirkungen auf aktuelle Fälle.";
  } else if (themen.some(thema => thema.includes('Mietpreisbremse'))) {
    hinweise = "Die Anwendung der Mietpreisbremse wurde konkretisiert. Beachten Sie die neuen Anforderungen.";
  } else if (themen.some(thema => thema.includes('Modernisierung'))) {
    hinweise = "Die Regelungen zu Modernisierungen wurden interpretiert. Überprüfen Sie Ihre aktuelle Praxis.";
  } else if (themen.some(thema => thema.includes('Nebenkosten'))) {
    hinweise = "Die Abrechnung von Nebenkosten wurde thematisiert. Prüfen Sie Ihre Abrechnungspraxis.";
  } else {
    hinweise = "Überprüfen Sie die Auswirkungen dieser Entscheidung auf aktuelle Fälle in Ihrer Praxis.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von Landgerichtsentscheidungen
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete Landgerichtsentscheidungen
 */
async function abrufeUndVerarbeiteLandgerichtsEntscheidungen(options = {}) {
  try {
    console.log("Rufe Landgerichtsentscheidungen ab...");
    const entscheidungen = await getLandgerichtsEntscheidungen(options);
    console.log(`${entscheidungen.length} Landgerichtsentscheidungen abgerufen`);
    
    const verarbeiteteEntscheidungen = verarbeiteLandgerichtsEntscheidungen(entscheidungen);
    return verarbeiteteEntscheidungen;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Landgerichtsentscheidungen: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  getLandgerichtsEntscheidungen,
  getLandgerichte,
  getBundeslaender,
  verarbeiteLandgerichtsEntscheidungen,
  generierePraxishinweise,
  abrufeUndVerarbeiteLandgerichtsEntscheidungen
};