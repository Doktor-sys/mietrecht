// Datenbank-Replika-Konfiguration
export const DATABASE_REPLICA_CONFIG = {
  // Primäre Datenbank (für Schreiboperationen)
  primary: {
    host: process.env.DB_PRIMARY_HOST || 'localhost',
    port: parseInt(process.env.DB_PRIMARY_PORT || '5432'),
    database: process.env.DB_PRIMARY_NAME || 'jurismind_primary',
    username: process.env.DB_PRIMARY_USER || 'postgres',
    password: process.env.DB_PRIMARY_PASSWORD || 'postgres',
    ssl: process.env.DB_PRIMARY_SSL === 'true'
  },
  
  // Read-Replikas (für Leseoperationen)
  replicas: [
    {
      id: 'replica-1',
      host: process.env.DB_REPLICA1_HOST || 'localhost',
      port: parseInt(process.env.DB_REPLICA1_PORT || '5433'),
      database: process.env.DB_REPLICA1_NAME || 'jurismind_replica1',
      username: process.env.DB_REPLICA1_USER || 'postgres',
      password: process.env.DB_REPLICA1_PASSWORD || 'postgres',
      ssl: process.env.DB_REPLICA1_SSL === 'true',
      weight: 1 // Gewichtung für Load-Balancing
    },
    {
      id: 'replica-2',
      host: process.env.DB_REPLICA2_HOST || 'localhost',
      port: parseInt(process.env.DB_REPLICA2_PORT || '5434'),
      database: process.env.DB_REPLICA2_NAME || 'jurismind_replica2',
      username: process.env.DB_REPLICA2_USER || 'postgres',
      password: process.env.DB_REPLICA2_PASSWORD || 'postgres',
      ssl: process.env.DB_REPLICA2_SSL === 'true',
      weight: 1
    }
  ],
  
  // Load-Balancing-Einstellungen
  loadBalancing: {
    strategy: 'round-robin', // round-robin, weighted, least-connections
    healthCheckInterval: 30000, // 30 Sekunden
    failoverTimeout: 5000, // 5 Sekunden
    maxRetries: 3
  },
  
  // Connection Pooling
  connectionPool: {
    minConnections: 5,
    maxConnections: 20,
    acquireTimeout: 30000, // 30 Sekunden
    idleTimeout: 10000, // 10 Sekunden
    maxUses: 1000 // Nach 1000 Verwendungen neu erstellen
  }
};