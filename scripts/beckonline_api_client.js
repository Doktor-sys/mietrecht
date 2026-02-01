/**
 * Beck-online API Client
 * Client für die Abfrage von juristischen Artikeln und Entscheidungen aus Beck-online
 */

// Erforderliche Module importieren
const https = require('https');
const { setCache, getCache } = require('./api_cache.js');
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

/**
 * Ruft relevante Artikel aus Beck-online ab
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Array mit Artikeldaten
 */
async function getBeckOnlineArtikel(options = {}) {
  // Cache-Schlüssel generieren
  const cacheKey = `beckonline_mietrecht_${JSON.stringify(options)}`;
  
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
        datenbank: options.datenbank || 'njw',
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
      
      // Beck-online API-Endpunkt (Beispiel-URL)
      const apiUrl = `https://api.beck-online.de/v1/suche?${queryString}`;
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.BECKONLINE_API_KEY || 'dummy-api-key'}`,
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
            
            // Nur relevante Artikel zurückgeben
            const relevanteArtikel = response.artikel.filter(artikel => 
              artikel.themen.some(thema => thema.includes('Miete')) ||
              artikel.themen.some(thema => thema.includes('Wohnung')) ||
              artikel.themen.some(thema => thema.includes('Nebenkosten')) ||
              artikel.titel.toLowerCase().includes('miet') ||
              artikel.text.toLowerCase().includes('miet')
            );
            
            // Im Cache speichern (20 Minuten TTL)
            setCache(cacheKey, relevanteArtikel, 20 * 60 * 1000);
            
            resolve(relevanteArtikel);
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
 * Ruft detaillierte Informationen zu einem Artikel ab
 * @param {string} artikelId - ID des Artikels
 * @returns {Promise<Object>} Detaillierte Artikeldaten
 */
async function getBeckOnlineArtikelDetails(artikelId) {
  // Cache-Schlüssel generieren
  const cacheKey = `beckonline_artikel_${artikelId}`;
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // Beck-online API-Endpunkt für Einzelartikel
      const apiUrl = `https://api.beck-online.de/v1/artikel/${artikelId}`;
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.BECKONLINE_API_KEY || 'dummy-api-key'}`,
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
            const artikel = JSON.parse(data);
            
            // Im Cache speichern (30 Minuten TTL)
            setCache(cacheKey, artikel, 30 * 60 * 1000);
            
            resolve(artikel);
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
  const cacheKey = 'beckonline_datenbanken';
  
  // Prüfen, ob Daten im Cache sind
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  return fetchWithRetry(() => {
    return new Promise((resolve, reject) => {
      // API-Endpunkt für Datenbanken
      const apiUrl = 'https://api.beck-online.de/v1/datenbanken';
      
      // HTTPS-Anfrage mit Authentifizierung
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${process.env.BECKONLINE_API_KEY || 'dummy-api-key'}`,
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
 * Verarbeitet Beck-online-Artikel für den Newsletter
 * @param {Array} artikel - Array mit Artikeldaten
 * @returns {Array} Verarbeitete Artikel
 */
function verarbeiteBeckOnlineArtikel(artikel) {
  return artikel.map(artikel => {
    // Wichtigkeit basierend auf verschiedenen Faktoren bestimmen
    let wichtigkeit = 'mittel';
    
    // Hohe Wichtigkeit für bestimmte Themen
    if (artikel.themen.some(thema => thema.includes('Reform')) ||
        artikel.themen.some(thema => thema.includes('Novelle')) ||
        artikel.titel.toLowerCase().includes('wichtig')) {
      wichtigkeit = 'hoch';
    }
    
    // Geringe Wichtigkeit für Standardartikel
    if (artikel.themen.some(thema => thema.includes('Praxisnotiz')) ||
        artikel.themen.some(thema => thema.includes('Aktuelles'))) {
      wichtigkeit = 'niedrig';
    }
    
    return {
      id: artikel.id,
      quelle: "Beck-online",
      datenbank: artikel.datenbank,
      datum: artikel.veroeffentlichungsdatum,
      titel: artikel.titel,
      themen: artikel.themen,
      zusammenfassung: artikel.zusammenfassung || artikel.text.substring(0, 200) + '...',
      volltext: artikel.text,
      url: artikel.url,
      autoren: artikel.autoren || [],
      praxishinweise: generierePraxishinweise(artikel),
      wichtigkeit: wichtigkeit
    };
  });
}

/**
 * Generiert Praxishinweise basierend auf Artikelthemen
 * @param {Object} artikel - Artikeldaten
 * @returns {String} Praxishinweise
 */
function generierePraxishinweise(artikel) {
  const themen = artikel.themen;
  let hinweise = "";
  
  if (themen.some(thema => thema.includes('Reform'))) {
    hinweise = "Dieser Artikel behandelt eine wichtige Reform im Mietrecht. Prüfen Sie die Auswirkungen auf aktuelle Fälle.";
  } else if (themen.some(thema => thema.includes('Novelle'))) {
    hinweise = "Eine Novelle des Mietrechts wurde behandelt. Beachten Sie die neuen Regelungen.";
  } else if (themen.some(thema => thema.includes('BGH'))) {
    hinweise = "Der BGH hat sich zu einem wichtigen Thema geäußert. Überprüfen Sie die Auswirkungen auf Ihre Praxis.";
  } else if (themen.some(thema => thema.includes('Praxisnotiz'))) {
    hinweise = "Praxisnotiz mit wichtigen Hinweisen für die tägliche Arbeit.";
  } else {
    hinweise = "Lesen Sie den Artikel, um sich über aktuelle Entwicklungen im Mietrecht zu informieren.";
  }
  
  return hinweise;
}

/**
 * Hauptfunktion zum Abrufen und Verarbeiten von Beck-online-Artikeln
 * @param {Object} options - Abfrageoptionen
 * @returns {Promise<Array>} Verarbeitete Beck-online-Artikel
 */
async function abrufeUndVerarbeiteBeckOnlineArtikel(options = {}) {
  try {
    console.log("Rufe Beck-online-Artikel ab...");
    const artikel = await getBeckOnlineArtikel(options);
    console.log(`${artikel.length} Beck-online-Artikel abgerufen`);
    
    const verarbeiteteArtikel = verarbeiteBeckOnlineArtikel(artikel);
    return verarbeiteteArtikel;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Beck-online-Artikel: ${error.message}`);
    // Rückfall auf Mock-Daten bei API-Fehlern
    return [];
  }
}

// Funktionen für Tests exportieren
module.exports = {
  getBeckOnlineArtikel,
  getBeckOnlineArtikelDetails,
  getDatenbanken,
  verarbeiteBeckOnlineArtikel,
  generierePraxishinweise,
  abrufeUndVerarbeiteBeckOnlineArtikel
};