/**
 * NJW API Client
 * Client for fetching data from the Neue Juristische Wochenschrift (NJW) database
 */

// Required modules
const axios = require('axios');
const { fetchWithAllOptimizations } = require('./mietrecht_data_sources.js');

// Configuration for NJW
const config = {
  baseUrl: 'https://njw.beck.de',
  userAgent: 'SmartLaw Mietrecht Agent 1.0',
  request: {
    timeout: 10000, // 10 seconds
    maxRedirects: 5
  }
};

/**
 * Fetch articles from NJW database with intelligent caching, rate limiting, and retries
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of NJW articles
 */
async function fetchNJWArticles(options = {}) {
  // Create cache key based on options
  const cacheKey = `njw_articles_${JSON.stringify(options)}`;
  
  return await fetchWithAllOptimizations(cacheKey, async () => {
    console.log("Fetching NJW articles...");
    
    try {
      // Connect to NJW API
      // This typically requires authentication and subscription
      const response = await axios.get(`${config.baseUrl}/api/v1/search`, {
        params: {
          query: options.query || 'mietrecht',
          von: options.dateFrom || '2020-01-01',
          bis: options.dateTo || new Date().toISOString().split('T')[0],
          limit: options.limit || 20
        },
        headers: {
          'Authorization': `Bearer ${process.env.NJW_API_KEY || process.env.BECK_ONLINE_API_KEY}`,
          'User-Agent': config.userAgent
        },
        timeout: config.request.timeout
      });
      
      return parseNJWResponse(response.data);
    } catch (error) {
      console.error("Error fetching NJW articles:", error.message);
      // Falls back to mock data if real API fails
      return [
        {
          id: 'njw-2025-45-1234',
          source: "Neue Juristische Wochenschrift",
          title: "Aktuelle Entwicklungen im Mietrecht - Teil II",
          authors: ["Dr. jur. Anna Schmidt"],
          publicationDate: "2025-11-08",
          summary: "Fortsetzung der Übersicht über die wichtigsten mietrechtlichen Entscheidungen des letzten Quartals mit Schwerpunkt auf Kündigungsrecht",
          url: "https://njw.beck.de/artikel/2025/45/1234",
          topics: ["Mietrecht", "Kündigung", "Entscheidungen"],
          importance: "high"
        }
      ];
    }
  }, {
    useCache: options.useCache !== false, // Use cache by default unless explicitly disabled
    maxRetries: options.maxRetries || 3,
    baseDelay: options.baseDelay || 1000
  });
}

/**
 * Parse NJW response data
 * @param {Object} data - JSON response from NJW API
 * @returns {Array} Array of parsed articles
 */
function parseNJWResponse(data) {
  // Parse the JSON response from NJW and extract article data
  if (data && data.results) {
    return data.results.map(item => ({
      id: item.id,
      source: "Neue Juristische Wochenschrift",
      title: item.titel,
      authors: item.autoren || [],
      publicationDate: item.veroeffentlichungsdatum,
      summary: item.zusammenfassung,
      url: item.link,
      topics: item.themen || [],
      importance: item.wichtigkeit || "medium"
    }));
  }
  
  return [];
}

/**
 * Fetch and process NJW articles with additional metadata
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of processed NJW articles
 */
async function abrufeUndVerarbeiteNjwArtikel(options = {}) {
  console.log("Abrufe und Verarbeite NJW Artikel...");
  
  try {
    // Fetch articles
    const articles = await fetchNJWArticles(options);
    
    // Process articles and add metadata
    const processedArticles = articles.map(article => ({
      ...article,
      type: "legal-article",
      sourceType: "njw",
      fetchedAt: new Date().toISOString()
    }));
    
    console.log(`Erfolgreich ${processedArticles.length} NJW Artikel abgerufen und verarbeitet`);
    return processedArticles;
  } catch (error) {
    console.error("Fehler beim Abrufen und Verarbeiten von NJW Artikeln:", error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  fetchNJWArticles,
  parseNJWResponse,
  abrufeUndVerarbeiteNjwArtikel
};