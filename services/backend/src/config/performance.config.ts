// Performance-Konfiguration
export const PERFORMANCE_CONFIG = {
  // Datenbank-Caching
  DATABASE_CACHE: {
    ENABLED: true,
    TTL_SECONDS: 300, // 5 Minuten
    MAX_ITEMS: 1000,
  },
  
  // API-Rate Limiting
  RATE_LIMITING: {
    WINDOW_MS: 15 * 60 * 1000, // 15 Minuten
    MAX_REQUESTS: 100, // Max 100 Requests pro Fenster
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  // Timeout-Einstellungen
  TIMEOUTS: {
    DATABASE_QUERY: 5000, // 5 Sekunden
    API_CALL: 10000, // 10 Sekunden
    FILE_PROCESSING: 30000, // 30 Sekunden
  },
  
  // Memory-Optimierung
  MEMORY_OPTIMIZATION: {
    ENABLED: true,
    GC_INTERVAL: 30000, // 30 Sekunden
  },
  
  // Connection Pooling
  CONNECTION_POOL: {
    MIN_CONNECTIONS: 5,
    MAX_CONNECTIONS: 20,
    ACQUIRE_TIMEOUT: 30000, // 30 Sekunden
    IDLE_TIMEOUT: 10000, // 10 Sekunden
  },
};