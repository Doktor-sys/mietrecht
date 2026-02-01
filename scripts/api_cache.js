/**
 * API Cache
 * Einfacher Caching-Mechanismus für API-Antworten
 */

// Cache-Objekt
const cache = new Map();

// Standard-Cache-Gültigkeitsdauer (5 Minuten)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Speichert Daten im Cache
 * @param {String} key - Cache-Schlüssel
 * @param {Any} data - Zu speichernde Daten
 * @param {Number} ttl - Gültigkeitsdauer in Millisekunden (optional)
 */
function setCache(key, data, ttl = DEFAULT_TTL) {
  const expiry = Date.now() + ttl;
  cache.set(key, {
    data: data,
    expiry: expiry
  });
  console.log(`Daten für Schlüssel '${key}' im Cache gespeichert (läuft ab in ${ttl/1000} Sekunden)`);
}

/**
 * Ruft Daten aus dem Cache ab
 * @param {String} key - Cache-Schlüssel
 * @returns {Any|null} Daten oder null, wenn nicht gefunden/abgelaufen
 */
function getCache(key) {
  const entry = cache.get(key);
  
  // Wenn nichts im Cache ist
  if (!entry) {
    return null;
  }
  
  // Wenn der Eintrag abgelaufen ist
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    console.log(`Cache-Eintrag für '${key}' ist abgelaufen und wurde entfernt`);
    return null;
  }
  
  console.log(`Daten für Schlüssel '${key}' aus dem Cache abgerufen`);
  return entry.data;
}

/**
 * Entfernt einen Eintrag aus dem Cache
 * @param {String} key - Cache-Schlüssel
 */
function removeCache(key) {
  cache.delete(key);
  console.log(`Cache-Eintrag für '${key}' entfernt`);
}

/**
 * Bereinigt alle abgelaufenen Einträge
 */
function cleanupExpired() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`${cleaned} abgelaufene Cache-Einträge bereinigt`);
  }
}

/**
 * Gibt Cache-Statistiken zurück
 * @returns {Object} Statistiken über den Cache
 */
function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  
  for (const entry of cache.values()) {
    if (now > entry.expiry) {
      expired++;
    } else {
      active++;
    }
  }
  
  return {
    total: cache.size,
    active: active,
    expired: expired,
    size: cache.size
  };
}

/**
 * Löscht den gesamten Cache
 */
function clearCache() {
  const size = cache.size;
  cache.clear();
  console.log(`Cache mit ${size} Einträgen geleert`);
}

// Periodische Bereinigung alle 10 Minuten
setInterval(() => {
  cleanupExpired();
}, 10 * 60 * 1000);

// Funktionen exportieren
module.exports = {
  setCache,
  getCache,
  removeCache,
  cleanupExpired,
  getCacheStats,
  clearCache
};