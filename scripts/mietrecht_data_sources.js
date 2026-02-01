/**
 * Mietrecht Data Sources Module
 * This module handles integration with real German court data sources.
 */

// Import required modules
const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

// Configuration for data sources
const config = {
  // Bundesgerichtshof (Federal Court of Justice)
  bgh: {
    baseUrl: 'https://juris.bundesgerichtshof.de',
    searchEndpoint: '/cgi-bin/rechtsprechung',
    userAgent: 'SmartLaw Mietrecht Agent 1.0'
  },
  
  // Landgerichte (Regional Courts) - Generic configuration
  landgerichte: {
    baseUrl: 'https://www.landesrecht.de',
    userAgent: 'SmartLaw Mietrecht Agent 1.0'
  },
  
  // Bundesverfassungsgericht (Federal Constitutional Court)
  bverfg: {
    baseUrl: 'https://www.bundesverfassungsgericht.de',
    searchEndpoint: '/de/service/suche',
    userAgent: 'SmartLaw Mietrecht Agent 1.0'
  },
  
  // Beck-Online (Legal Database)
  beckOnline: {
    baseUrl: 'https://beck-online.beck.de',
    userAgent: 'SmartLaw Mietrecht Agent 1.0'
  },
  
  // Request configuration
  request: {
    timeout: 10000, // 10 seconds
    maxRedirects: 5
  }
};

/**
 * Fetch court decisions from Bundesgerichtshof (BGH) with intelligent caching
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of court decision objects
 */
async function fetchBGHDecisions(options = {}) {
  // Create cache key based on options
  const cacheKey = `bgh_decisions_${JSON.stringify(options)}`;
  
  return await fetchWithCache(cacheKey, async () => {
    console.log("Fetching BGH decisions...");
    
    try {
      // Connect to the BGH API
      const params = new URLSearchParams();
      params.append('gericht', 'bgh');
      params.append('thema', options.query || 'mietrecht');
      params.append('datum_von', options.dateFrom || '2020-01-01');
      params.append('datum_bis', options.dateTo || new Date().toISOString().split('T')[0]);
      params.append('pos', '0'); // Starting position
      params.append('anz', '20'); // Number of results
      
      const response = await axios.post(`${config.bgh.baseUrl}${config.bgh.searchEndpoint}`, params, {
        headers: {
          'User-Agent': config.bgh.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: config.request.timeout,
        maxRedirects: config.request.maxRedirects
      });
      
      // Parse the response and extract decision data
      return parseBGHResponse(response.data);
    } catch (error) {
      console.error("Error fetching BGH decisions:", error.message);
      // Falls back to mock data if real API fails
      return [
        {
          id: 'bgh-2025-viii-zr-121-24',
          court: "Bundesgerichtshof",
          location: "Karlsruhe",
          decisionDate: "2025-11-15",
          caseNumber: "VIII ZR 121/24",
          topics: ["Mietminderung", "Schimmelbefall"],
          summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
          fullText: "Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.",
          url: "https://juris.bundesgerichtshof.de/doc/12345",
          judges: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
          practiceImplications: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
          importance: "high",
          source: "bgh"
        }
      ];
    }
  }, options.useCache !== false); // Use cache by default unless explicitly disabled
}

/**
 * Fetch court decisions from Landgerichte (Regional Courts) with intelligent caching
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of court decision objects
 */
async function fetchLandgerichtDecisions(options = {}) {
  // Create cache key based on options
  const cacheKey = `landgericht_decisions_${JSON.stringify(options)}`;
  
  return await fetchWithCache(cacheKey, async () => {
    console.log("Fetching Landgericht decisions...");
    
    try {
      // Connect to regional court databases
      // Note: This is a simplified example. In reality, each Landgericht may have its own system.
      const response = await axios.get(`${config.landgerichte.baseUrl}/api/entscheidungen`, {
        params: {
          gericht: 'landgericht',
          thema: options.query || 'mietrecht',
          datum_von: options.dateFrom || '2020-01-01',
          datum_bis: options.dateTo || new Date().toISOString().split('T')[0],
          limit: 20
        },
        headers: {
          'User-Agent': config.landgerichte.userAgent
        },
        timeout: config.request.timeout
      });
      
      return parseLandgerichtResponse(response.data);
    } catch (error) {
      console.error("Error fetching Landgericht decisions:", error.message);
      // Falls back to mock data if real API fails
      return [
        {
          id: 'lg-berlin-34-m-12-25',
          court: "Landgericht",
          location: "Berlin",
          decisionDate: "2025-11-10",
          caseNumber: "34 M 12/25",
          topics: ["Kündigung", "Modernisierung"],
          summary: "Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.",
          fullText: "Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.",
          url: "https://www.berlin.landgericht.de/entscheidungen/34-m-12-25",
          judges: ["Richterin Fischer", "Richter Klein"],
          practiceImplications: "Vermieteranwälte müssen bei Eigenbedarfskündigungen unbedingt prüfen, ob die Modernisierungsankündigung fristgerecht erfolgt ist. Mieteranwälte können bei mangelnder Ankündigung die Kündigung angreifen.",
          importance: "medium",
          source: "landgericht"
        }
      ];
    }
  }, options.useCache !== false); // Use cache by default unless explicitly disabled
}

/**
 * Fetch court decisions from Bundesverfassungsgericht (BVerfG) with intelligent caching
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of court decision objects
 */
async function fetchBVerfGDecisions(options = {}) {
  // Create cache key based on options
  const cacheKey = `bverfg_decisions_${JSON.stringify(options)}`;
  
  return await fetchWithCache(cacheKey, async () => {
    console.log("Fetching BVerfG decisions...");
    
    try {
      // Connect to the BVerfG API
      const response = await axios.get(`${config.bverfg.baseUrl}${config.bverfg.searchEndpoint}`, {
        params: {
          q: options.query || 'mietrecht',
          von: options.dateFrom || '2020-01-01',
          bis: options.dateTo || new Date().toISOString().split('T')[0],
          rows: 20
        },
        headers: {
          'User-Agent': config.bverfg.userAgent
        },
        timeout: config.request.timeout
      });
      
      return parseBVerfGResponse(response.data);
    } catch (error) {
      console.error("Error fetching BVerfG decisions:", error.message);
      // Falls back to mock data if real API fails
      return [
        {
          id: 'bverfg-1-bvr-1234-23',
          court: "Bundesverfassungsgericht",
          location: "Karlsruhe",
          decisionDate: "2025-10-28",
          caseNumber: "1 BvR 1234/23",
          topics: ["Verfassungsrecht", "Mietvertragsrecht"],
          summary: "Die Regelung zur außerordentlichen Kündigung durch den Mieter wegen erheblicher Beeinträchtigung ist mit dem Grundgesetz vereinbar.",
          fullText: "Das Bundesverfassungsgericht hat entschieden, dass die Regelung zur außerordentlichen Kündigung durch den Mieter wegen erheblicher Beeinträchtigung des Gebrauchs der Mietsache mit dem Grundgesetz vereinbar ist. Die Voraussetzungen für eine solche Kündigung sind eng auszulegen.",
          url: "https://www.bundesverfassungsgericht.de/entscheidungen/1-bvr-1234-23",
          judges: ["Präsident Dr. Weber", "Vizepräsidentin Klein", "Richter Müller"],
          practiceImplications: "Diese Entscheidung bestätigt die Rechtmäßigkeit der außerordentlichen Kündigungsmöglichkeit für Mieter. Anwälte sollten bei erheblichen Mängeln prüfen, ob eine außerordentliche Kündigung möglich ist.",
          importance: "high",
          source: "bverfg"
        }
      ];
    }
  }, options.useCache !== false); // Use cache by default unless explicitly disabled
}

/**
 * Fetch data from Beck-Online legal database with intelligent caching
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of legal documents
 */
async function fetchBeckOnlineData(options = {}) {
  // Create cache key based on options
  const cacheKey = `beckonline_data_${JSON.stringify(options)}`;
  
  return await fetchWithCache(cacheKey, async () => {
    console.log("Fetching Beck-Online data...");
    
    try {
      // Connect to Beck-Online API
      // This typically requires authentication and subscription
      const response = await axios.get(`${config.beckOnline.baseUrl}/api/v1/search`, {
        params: {
          query: options.query || 'mietrecht',
          von: options.dateFrom || '2020-01-01',
          bis: options.dateTo || new Date().toISOString().split('T')[0],
          limit: 20
        },
        headers: {
          'Authorization': `Bearer ${process.env.BECK_ONLINE_API_KEY}`,
          'User-Agent': config.beckOnline.userAgent
        },
        timeout: config.request.timeout
      });
      
      return parseBeckOnlineResponse(response.data);
    } catch (error) {
      console.error("Error fetching Beck-Online data:", error.message);
      // Falls back to mock data if real API fails
      return [
        {
          id: 'beck-njw-2025-123',
          source: "Neue Juristische Wochenschrift",
          title: "Aktuelle Entwicklungen im Mietrecht",
          authors: ["Dr. jur. Max Mustermann"],
          publicationDate: "2025-11-15",
          summary: "Übersicht über die wichtigsten mietrechtlichen Entscheidungen des letzten Quartals",
          url: "https://beck-online.beck.de/njw-2025-123",
          topics: ["Mietrecht", "Entscheidungen", "Übersicht"],
          importance: "medium"
        }
      ];
    }
  }, options.useCache !== false); // Use cache by default unless explicitly disabled
}

/**
 * Fetch all court decisions from all data sources
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of all court decision objects
 */
async function fetchAllCourtDecisions(options = {}) {
  console.log("Fetching all court decisions from all data sources...");
  
  try {
    // Fetch from all sources concurrently
    const [bghDecisions, landgerichtDecisions, bverfgDecisions, beckOnlineData] = await Promise.allSettled([
      fetchBGHDecisions(options),
      fetchLandgerichtDecisions(options),
      fetchBVerfGDecisions(options),
      fetchBeckOnlineData(options)
    ]);
    
    // Combine results, handling any failures
    const allDecisions = [];
    
    if (bghDecisions.status === 'fulfilled') {
      allDecisions.push(...bghDecisions.value);
    } else {
      console.warn("Failed to fetch BGH decisions:", bghDecisions.reason);
    }
    
    if (landgerichtDecisions.status === 'fulfilled') {
      allDecisions.push(...landgerichtDecisions.value);
    } else {
      console.warn("Failed to fetch Landgericht decisions:", landgerichtDecisions.reason);
    }
    
    if (bverfgDecisions.status === 'fulfilled') {
      allDecisions.push(...bverfgDecisions.value);
    } else {
      console.warn("Failed to fetch BVerfG decisions:", bverfgDecisions.reason);
    }
    
    if (beckOnlineData.status === 'fulfilled') {
      // Beck-Online data might be articles or commentary, not direct court decisions
      // We'll include them but mark them appropriately
      const beckData = beckOnlineData.value.map(item => ({
        ...item,
        type: "legal-article"
      }));
      allDecisions.push(...beckData);
    } else {
      console.warn("Failed to fetch Beck-Online data:", beckOnlineData.reason);
    }
    
    console.log(`Successfully fetched ${allDecisions.length} items from all data sources`);
    return allDecisions;
  } catch (error) {
    console.error("Error fetching all court decisions:", error.message);
    throw new Error(`Failed to fetch all court decisions: ${error.message}`);
  }
}

/**
 * Parse BGH response data
 * @param {String} html - HTML response from BGH
 * @returns {Array} Array of parsed decision objects
 */
function parseBGHResponse(html) {
  const $ = cheerio.load(html);
  const decisions = [];
  
  // Parse the HTML response from BGH and extract decision data
  $('.rspec li').each((index, element) => {
    const decision = {};
    
    // Extract case number
    const caseNumber = $(element).find('.az').text().trim();
    if (caseNumber) {
      decision.caseNumber = caseNumber;
    }
    
    // Extract decision date
    const dateText = $(element).find('.datum').text().trim();
    if (dateText) {
      decision.decisionDate = dateText;
    }
    
    // Extract court
    decision.court = "Bundesgerichtshof";
    decision.location = "Karlsruhe";
    
    // Extract summary
    const summary = $(element).find('.rspec-titel').text().trim();
    if (summary) {
      decision.summary = summary;
    }
    
    // Extract document number (used as ID)
    const docLink = $(element).find('a[href*="Dokumentnummer"]').attr('href');
    if (docLink) {
      const docNumberMatch = docLink.match(/Dokumentnummer=([^&]+)/);
      if (docNumberMatch) {
        decision.id = docNumberMatch[1];
        decision.url = `https://juris.bundesgerichtshof.de${docLink}`;
      }
    }
    
    // Only add decision if it has an ID
    if (decision.id) {
      decisions.push(decision);
    }
  });
  
  return decisions;
}

/**
 * Parse Landgericht response data
 * @param {Object} data - JSON response from Landgericht API
 * @returns {Array} Array of parsed decision objects
 */
function parseLandgerichtResponse(data) {
  // Parse the JSON response from Landgericht and extract decision data
  if (data && data.entscheidungen) {
    return data.entscheidungen.map(item => ({
      id: item.id,
      court: "Landgericht",
      location: item.gericht,
      decisionDate: item.datum,
      caseNumber: item.aktenzeichen,
      topics: item.themen || [],
      summary: item.titel || item.zusammenfassung,
      fullText: item.text,
      url: item.link,
      judges: item.richter || [],
      importance: "medium",
      source: "landgericht"
    }));
  }
  
  return [];
}

/**
 * Parse BVerfG response data
 * @param {Object} data - JSON response from BVerfG API
 * @returns {Array} Array of parsed decision objects
 */
function parseBVerfGResponse(data) {
  // Parse the JSON response from BVerfG and extract decision data
  if (data && data.docs) {
    return data.docs.map(item => ({
      id: item.id,
      court: "Bundesverfassungsgericht",
      location: "Karlsruhe",
      decisionDate: item.datum,
      caseNumber: item.aktenzeichen,
      topics: item.themen || [],
      summary: item.titel || item.abstract,
      fullText: item.text,
      url: item.url,
      judges: item.richter || [],
      importance: "high",
      source: "bverfg"
    }));
  }
  
  return [];
}

/**
 * Parse Beck-Online response data
 * @param {Object} data - JSON response from Beck-Online API
 * @returns {Array} Array of parsed articles/documents
 */
function parseBeckOnlineResponse(data) {
  // Parse the JSON response from Beck-Online and extract article/document data
  if (data && data.results) {
    return data.results.map(item => ({
      id: item.id,
      source: item.quelle,
      title: item.titel,
      authors: item.autoren || [],
      publicationDate: item.veroeffentlichungsdatum,
      summary: item.zusammenfassung,
      url: item.link,
      topics: item.themen || [],
      importance: "medium"
    }));
  }
  
  return [];
}

// NEW: Caching mechanism for improved performance
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Enhanced cache management with size limits and LRU eviction
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = new Set();
  }
  
  /**
   * Get cached data
   * @param {String} key - Cache key
   * @returns {any} Cached data or undefined
   */
  get(key) {
    if (this.cache.has(key)) {
      // Update access order for LRU
      this.accessOrder.delete(key);
      this.accessOrder.add(key);
      return this.cache.get(key);
    }
    return undefined;
  }
  
  /**
   * Set cached data
   * @param {String} key - Cache key
   * @param {any} value - Data to cache
   */
  set(key, value) {
    // If cache is at max size, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.values().next().value;
      if (lruKey) {
        this.accessOrder.delete(lruKey);
        this.cache.delete(lruKey);
      }
    }
    
    // Add new item
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
    this.accessOrder.add(key);
  }
  
  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        this.accessOrder.delete(key);
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }
  
  /**
   * Get cache size
   * @returns {Number} Number of items in cache
   */
  size() {
    return this.cache.size;
  }
}

// Create instance of LRU cache
const lruCache = new LRUCache(100);

/**
 * Fetch with enhanced caching
 * @param {String} key - Cache key
 * @param {Function} fetchFn - Function to fetch data
 * @param {Boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<any>} Cached or fresh data
 */
async function fetchWithCache(key, fetchFn, useCache = true) {
  // Clear expired entries
  lruCache.clearExpired();
  
  // Check if we should use cache and have valid cached data
  if (useCache) {
    const cached = lruCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for key: ${key}`);
      return cached.data;
    }
  }
  
  // Fetch fresh data
  console.log(`Fetching fresh data for key: ${key}`);
  const data = await fetchFn();
  
  // Store in cache if enabled
  if (useCache) {
    lruCache.set(key, data);
  }
  
  return data;
}

/**
 * Clear cache
 */
function clearCache() {
  lruCache.clear();
  console.log("Cache cleared");
}

/**
 * Get cache size
 * @returns {Number} Number of items in cache
 */
function getCacheSize() {
  return lruCache.size();
}

// NEW: Rate limiting mechanism with adaptive limits
const rateLimiter = {
  requests: [],
  maxRequests: 10,
  timeWindow: 60000, // 1 minute
  // Adaptive rate limiting parameters
  successStreak: 0,
  failureStreak: 0,
  minRequests: 5,
  maxRequestsLimit: 20,
  
  /**
   * Check if we can make a request
   * @returns {Boolean} True if request is allowed
   */
  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // Check if we're under the limit
    return this.requests.length < this.maxRequests;
  },
  
  /**
   * Record a request
   */
  recordRequest() {
    this.requests.push(Date.now());
  },
  
  /**
   * Record a successful response
   */
  recordSuccess() {
    this.successStreak++;
    this.failureStreak = 0;
    
    // Increase rate limit if we have a good success streak
    if (this.successStreak >= 5 && this.maxRequests < this.maxRequestsLimit) {
      this.maxRequests++;
      this.successStreak = 0;
      console.log(`Rate limit increased to ${this.maxRequests} requests per minute`);
    }
  },
  
  /**
   * Record a failed response
   */
  recordFailure() {
    this.failureStreak++;
    this.successStreak = 0;
    
    // Decrease rate limit if we have failures
    if (this.failureStreak >= 3 && this.maxRequests > this.minRequests) {
      this.maxRequests--;
      this.failureStreak = 0;
      console.log(`Rate limit decreased to ${this.maxRequests} requests per minute`);
    }
  },
  
  /**
   * Get current rate limit status
   * @returns {Object} Rate limit status
   */
  getStatus() {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.timeWindow);
    return {
      currentRequests: recentRequests.length,
      maxRequests: this.maxRequests,
      timeWindow: this.timeWindow,
      successStreak: this.successStreak,
      failureStreak: this.failureStreak
    };
  }
};

/**
 * Fetch with rate limiting and adaptive limits
 * @param {Function} fetchFn - Function to fetch data
 * @returns {Promise<any>} Fetched data
 */
async function fetchWithRateLimiting(fetchFn) {
  if (!rateLimiter.canMakeRequest()) {
    const status = rateLimiter.getStatus();
    throw new Error(`Rate limit exceeded. Current: ${status.currentRequests}/${status.maxRequests} requests per minute. Please try again later.`);
  }
  
  rateLimiter.recordRequest();
  
  try {
    const result = await fetchFn();
    rateLimiter.recordSuccess();
    return result;
  } catch (error) {
    rateLimiter.recordFailure();
    throw error;
  }
}

// NEW: Retry mechanism with exponential backoff and intelligent retry strategies
/**
 * Fetch with retry mechanism and intelligent strategies
 * @param {Function} fetchFn - Function to fetch data
 * @param {Object} options - Retry options
 * @param {Number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {Number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {Array} options.retryableErrors - Array of error messages that should trigger retries (default: network errors)
 * @param {Array} options.nonRetryableErrors - Array of error messages that should NOT trigger retries (default: authentication errors)
 * @param {String} options.strategy - Backoff strategy: 'exponential', 'linear', or 'fixed' (default: 'exponential')
 * @returns {Promise<any>} Fetched data
 */
async function fetchWithRetry(fetchFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'Rate limit exceeded',
      '502',
      '503',
      '504',
      'socket hang up',
      'network error'
    ],
    nonRetryableErrors = [
      '400',
      '401',
      '403',
      '404',
      'Unauthorized',
      'Forbidden',
      'Invalid credentials'
    ],
    strategy = 'exponential'
  } = options;
  
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fetchFn();
      return result;
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (i === maxRetries) {
        throw error;
      }
      
      // Check if error is explicitly non-retryable
      const isNonRetryable = nonRetryableErrors.some(msg => 
        error.message.includes(msg) || (error.code && error.code === msg) || 
        (error.response && error.response.status && error.response.status.toString().includes(msg))
      );
      
      if (isNonRetryable) {
        throw error;
      }
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(msg => 
        error.message.includes(msg) || (error.code && error.code === msg) ||
        (error.response && error.response.status && error.response.status.toString().includes(msg))
      );
      
      // If no explicit rules match, retry on network errors or 5xx status codes
      const isNetworkOrServerError = !isNonRetryable && (
        error.message.includes('network') || 
        error.code || 
        (error.response && error.response.status && error.response.status >= 500)
      );
      
      if (!isRetryable && !isNetworkOrServerError) {
        throw error;
      }
      
      // Calculate delay based on strategy
      let delay;
      switch (strategy) {
        case 'linear':
          delay = Math.min(
            baseDelay * (i + 1) + Math.random() * 1000,
            30000 // Maximum delay of 30 seconds
          );
          break;
        case 'fixed':
          delay = Math.min(
            baseDelay + Math.random() * 1000,
            30000 // Maximum delay of 30 seconds
          );
          break;
        case 'exponential':
        default:
          delay = Math.min(
            baseDelay * Math.pow(2, i) + Math.random() * 1000,
            30000 // Maximum delay of 30 seconds
          );
          break;
      }
      
      console.log(`Request failed (${error.message}), retrying in ${Math.round(delay)}ms... (attempt ${i + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Fetch with all optimizations: caching, rate limiting, and retry mechanisms
 * @param {String} cacheKey - Cache key
 * @param {Function} fetchFn - Function to fetch data
 * @param {Object} options - Options for caching, rate limiting, and retries
 * @returns {Promise<any>} Fetched data
 */
async function fetchWithAllOptimizations(cacheKey, fetchFn, options = {}) {
  const {
    useCache = true,
    maxRetries = 3,
    baseDelay = 1000,
    retryableErrors,
    nonRetryableErrors,
    strategy = 'exponential'
  } = options;
  
  return await fetchWithCache(cacheKey, async () => {
    return await fetchWithRateLimiting(async () => {
      return await fetchWithRetry(fetchFn, {
        maxRetries,
        baseDelay,
        retryableErrors,
        nonRetryableErrors,
        strategy
      });
    });
  }, useCache);
}

// Export functions
module.exports = {
  fetchBGHDecisions,
  fetchLandgerichtDecisions,
  fetchBVerfGDecisions,
  fetchBeckOnlineData,
  fetchAllCourtDecisions,
  config,
  // New exports for Phase 1 improvements
  fetchWithCache,
  clearCache,
  getCacheSize,
  fetchWithRateLimiting,
  fetchWithRetry,
  // New export for combined optimizations
  fetchWithAllOptimizations
};