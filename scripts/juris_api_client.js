/**
 * juris API Client
 * Client für die Abfrage von juristischen Dokumenten aus der juris-Datenbank
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

/**
 * Ruft relevante Dokumente aus juris ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Dokumentdaten
 */
async function getJurisDokumente(options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `juris_mietrecht_${JSON.stringify(options)}`;
  
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
        suchbegriff: options.suchbegriff || 'Mietrecht',
        datenbank: options.datenbank || 'juris',
        jahr: options.jahr || new Date().getFullYear(),
        limit: options.limit || 10
      };
      
      // Zusätzliche Filter
      if (options.zeitraum_von) {
        queryParams.zeitraum_von = options.zeitraum_von;
      }
      
      if (options.zeitraum_bis) {
        queryParams.zeitraum_bis = options.zeitraum_bis;
      }
      
      if (options.sortierung) {
        queryParams.sortierung = options.sortierung;
      }
      
      // Query-String erstellen
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      
      // juris API-Endpunkt (Beispiel-URL)
      const apiUrl = `https://api.juris.de/v1/suche?${queryString}`;
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.JURIS_API_KEY || 'dummy-api-key'}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.get(apiUrl, requestOptions, (res) => {
        let data = '';
        
        // Daten empfangen
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // Anfrage abgeschlossen
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            // Nur relevante Dokumente zurückgeben
            const relevanteDokumente = response.dokumente.filter(dokument => 
              dokument.themen.some(thema => thema.includes('Miete')) ||
              dokument.themen.some(thema => thema.includes('Wohnung')) ||
              dokument.themen.some(thema => thema.includes('Nebenkosten')) ||
              dokument.titel.toLowerCase().includes('miet') ||
              dokument.text.toLowerCase().includes('miet')
            );
            
            // Im Cache speichern (20 Minuten TTL)
            setCache(cacheKey, relevanteDokumente, 20 * 60 * 1000);
            
            resolve(relevanteDokumente);
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
      req.setTimeout(15000, () => {
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
 * Ruft detaillierte Informationen zu einem Dokument ab
 * @param {string} dokumentId - ID des Dokuments
 * @returns {Promise<Object>} Detaillierte Dokumentdaten
 */
async function getJurisDokumentDetails(dokumentId) {
  // Cache-Schlüssel generieren
  const cacheKey = `juris_dokument_${dokumentId}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // juris API-Endpunkt für Einzeldokument
      const apiUrl = `https://api.juris.de/v1/dokumente/${dokumentId}`;
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.JURIS_API_KEY || 'dummy-api-key'}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.get(apiUrl, requestOptions, (res) => {
        let data = '';
        
        // Daten empfangen
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // Anfrage abgeschlossen
        res.on('end', () => {
          try {
            const dokument = JSON.parse(data);
            
            // Im Cache speichern (30 Minuten TTL)
            setCache(cacheKey, dokument, 30 * 60 * 1000);
            
            resolve(dokument);
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
 * Ruft eine Liste der verfügbaren Datenbanken ab
 * @returns {Promise<Array>} Liste der Datenbanken
 */
async function getDatenbanken() {
  const cacheKey = 'juris_datenbanken';
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // API-Endpunkt für Datenbanken
      const apiUrl = 'https://api.juris.de/v1/datenbanken';
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.JURIS_API_KEY || 'dummy-api-key'}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.get(apiUrl, requestOptions, (res) => {
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
            setCache(cacheKey, response.datenbanken, 120 * 60 * 1000);
            
            resolve(response.datenbanken);
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
 * Verarbeitet juris-Dokumente für den Newsletter
 * @param {Array} dokumente - Array mit Dokumentdaten
 * @returns {Array} Verarbeitete Dokumente
 */
function verarbeiteJurisDokumente(dokumente) {
  return dokumente.map(dokument => {
    // Wichtigkeit basierend auf verschiedenen Faktoren bestimmen
    let wichtigkeit = 'mittel';
    
    // Hohe Wichtigkeit für bestimmte Themen
    if (dokument.themen.some(thema => thema.includes('Reform')) ||
        dokument.themen.some(thema => thema.includes('Novelle')) ||
        dokument.titel.toLowerCase().includes('wichtig')) {
      wichtigkeit = 'hoch';
    }
    
    // Geringe Wichtigkeit für Standardartikel
    if (dokument.themen.some(thema => thema.includes('Praxisnotiz')) ||
        dokument.themen.some(thema => thema.includes('Aktuelles'))) {
      wichtigkeit = 'niedrig';
    }
    
    return {
      id: dokument.id,
      quelle: "juris",
      datenbank: dokument.datenbank,
      datum: dokument.veroeffentlichungsdatum,
      titel: dokument.titel,
      themen: dokument.themen,
      zusammenfassung: dokument.zusammenfassung || dokument.text.substring(0, 200) + '...',
      volltext: dokument.text,
      url: dokument.url,
      autoren: dokument.autoren || [],
      praxishinweise: generierePraxishinweise(dokument),
      wichtigkeit: wichtigkeit
    };
  });
}

/**
 * Generiert Praxishinweise basierend auf Dokumentthemen
 * @param {Object} dokument - Dokumentdaten
 * @returns {String} Praxishinweise
 */
function generierePraxishinweise(dokument) {
  const themen = dokument.themen;
  let hinweise = "";
  
  if (themen.some(thema => thema.includes('Reform'))) {
    hinweise = "Dieses Dokument behandelt eine wichtige Reform im Mietrecht. Prüfen Sie die Auswirkungen auf aktuelle Fälle.";
  } else if (themen.some(thema => thema.includes('Novelle'))) {
    hinweise = "Eine Novelle des Mietrechts wurde behandelt. Beachten Sie die neuen Regelungen.";
  } else if (themen.some(thema => thema.includes('BGH'))) {
    hinweise = "Der BGH hat sich zu einem wichtigen Thema geäußert. Überprüfen Sie die Auswirkungen auf Ihre Praxis.";
  } else if (themen.some(thema => thema.includes('Praxisnotiz'))) {
    hinweise = "Praxisnotiz mit wichtigen Hinweisen für die tägliche Arbeit.";
  } else {
    hinweise = "Lesen Sie das Dokument, um sich über aktuelle Entwicklungen im Mietrecht zu informieren.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von juris-Dokumenten
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete juris-Dokumente
 */
async function abrufeUndVerarbeiteJurisDokumente(options = {}) {
  try {
    console.log("Rufe juris-Dokumente ab...");
    const dokumente = await getJurisDokumente(options);
    console.log(`${dokumente.length} juris-Dokumente abgerufen`);
    
    const verarbeiteteDokumente = verarbeiteJurisDokumente(dokumente);
    return verarbeiteteDokumente;
  } catch (error) {
    console.error(`Fehler beim Abrufen der juris-Dokumente: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  getJurisDokumente,
  getJurisDokumentDetails,
  getDatenbanken,
  verarbeiteJurisDokumente,
  generierePraxishinweise,
  abrufeUndVerarbeiteJurisDokumente
};