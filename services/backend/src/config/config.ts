import dotenv from 'dotenv'

dotenv.config()

// Environment validation helper
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Environment validation with defaults
function getEnvVarWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

// Environment validation for numbers
function getEnvVarAsNumber(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (value === undefined) {
    return defaultValue
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${name}=${value}`)
  }
  return parsed
}

// Environment validation for booleans
function getEnvVarAsBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (value === undefined) {
    return defaultValue
  }
  return value.toLowerCase() === 'true'
}

export const config = {
  // Server Configuration
  port: getEnvVarAsNumber('PORT', 3001),
  nodeEnv: getEnvVarWithDefault('NODE_ENV', 'development'),
  host: getEnvVarWithDefault('HOST', 'localhost'),

  // Database Configuration
  database: {
    url: getEnvVar('DATABASE_URL', 'postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev'),
  },

  // Redis Configuration
  redis: {
    url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  },

  // JWT Configuration
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    expiresIn: getEnvVarWithDefault('JWT_EXPIRES_IN', '24h'),
    refreshExpiresIn: getEnvVarWithDefault('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // CORS Configuration
  cors: {
    allowedOrigins: getEnvVarWithDefault('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  },

  // Email Configuration
  email: {
    host: getEnvVarWithDefault('EMAIL_HOST', 'smtp.gmail.com'),
    port: getEnvVarAsNumber('EMAIL_PORT', 587),
    secure: getEnvVarAsBoolean('EMAIL_SECURE', false),
    user: getEnvVarWithDefault('EMAIL_USER', ''),
    password: getEnvVarWithDefault('EMAIL_PASSWORD', ''),
    from: getEnvVarWithDefault('EMAIL_FROM', 'noreply@smartlaw.de'),
  },

  // MinIO Configuration
  minio: {
    endpoint: getEnvVarWithDefault('MINIO_ENDPOINT', 'localhost'),
    port: getEnvVarAsNumber('MINIO_PORT', 9000),
    useSSL: getEnvVarAsBoolean('MINIO_USE_SSL', false),
    accessKey: getEnvVarWithDefault('MINIO_ACCESS_KEY', 'smartlaw_minio'),
    secretKey: getEnvVarWithDefault('MINIO_SECRET_KEY', 'smartlaw_minio_password'),
    bucketName: getEnvVarWithDefault('MINIO_BUCKET_NAME', 'smartlaw-documents'),
  },

  // Elasticsearch Configuration
  elasticsearch: {
    url: getEnvVarWithDefault('ELASTICSEARCH_URL', 'http://localhost:9200'),
    index: getEnvVarWithDefault('ELASTICSEARCH_INDEX', 'legal-knowledge'),
  },

  // File Upload Configuration
  upload: {
    maxFileSize: getEnvVarAsNumber('MAX_FILE_SIZE', 10485760), // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 Minuten
    max: getEnvVarAsNumber('RATE_LIMIT_MAX', 100),
    authMax: getEnvVarAsNumber('RATE_LIMIT_AUTH_MAX', 5),
  },

  // Key Management System (KMS) Configuration
  kms: {
    masterKey: getEnvVarWithDefault('MASTER_ENCRYPTION_KEY', ''),
    cacheTTL: getEnvVarAsNumber('KMS_CACHE_TTL', 300), // 5 Minuten
    cacheMaxKeys: getEnvVarAsNumber('KMS_CACHE_MAX_KEYS', 1000),
    autoRotationEnabled: getEnvVarAsBoolean('KMS_AUTO_ROTATION_ENABLED', true),
    defaultRotationDays: getEnvVarAsNumber('KMS_DEFAULT_ROTATION_DAYS', 90),
    auditRetentionDays: getEnvVarAsNumber('KMS_AUDIT_RETENTION_DAYS', 2555), // 7 Jahre
    auditHmacKey: getEnvVarWithDefault('KMS_AUDIT_HMAC_KEY', ''),
    hsmEnabled: getEnvVarAsBoolean('KMS_HSM_ENABLED', false),
    vaultUrl: getEnvVarWithDefault('KMS_VAULT_URL', ''),
    vaultToken: getEnvVarWithDefault('KMS_VAULT_TOKEN', ''),
  },

  // ClamAV Configuration
  clamav: {
    host: getEnvVarWithDefault('CLAMAV_HOST', 'localhost'),
    port: getEnvVarAsNumber('CLAMAV_PORT', 3310),
    timeout: getEnvVarAsNumber('CLAMAV_TIMEOUT', 60000), // 60 seconds
    enabled: getEnvVarAsBoolean('CLAMAV_ENABLED', true),
  },

  // TLS Configuration
  tls: {
    enabled: getEnvVarAsBoolean('TLS_ENABLED', false),
    certPath: getEnvVarWithDefault('TLS_CERT_PATH', 'certs/server-cert.pem'),
    keyPath: getEnvVarWithDefault('TLS_KEY_PATH', 'certs/server-key.pem'),
    caPath: getEnvVarWithDefault('TLS_CA_PATH', 'certs/ca-cert.pem'),
    minVersion: getEnvVarWithDefault('TLS_MIN_VERSION', 'TLSv1.2'),
  },

  // OpenAI Configuration
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY', ''),
  },
  
  // Advanced Monitoring Configuration
  monitoring: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    slackChannel: process.env.SLACK_CHANNEL || '',
    pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
    pagerDutyApiKey: process.env.PAGERDUTY_API_KEY || '',
    teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL || '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
    twilioCriticalAlertNumbers: process.env.TWILIO_CRITICAL_ALERT_NUMBERS ? process.env.TWILIO_CRITICAL_ALERT_NUMBERS.split(',') : [],
    customWebhookUrls: process.env.CUSTOM_WEBHOOK_URLS ? process.env.CUSTOM_WEBHOOK_URLS.split(',') : [],
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS ? process.env.ALERT_EMAIL_RECIPIENTS.split(',') : [],
    alertDeduplicationWindowMs: process.env.ALERT_DEDUPLICATION_WINDOW_MS ? parseInt(process.env.ALERT_DEDUPLICATION_WINDOW_MS, 10) : 300000, // 5 minutes
    correlationEnabled: process.env.ALERT_CORRELATION_ENABLED === 'true',
    correlationWindowMs: process.env.ALERT_CORRELATION_WINDOW_MS ? parseInt(process.env.ALERT_CORRELATION_WINDOW_MS, 10) : 300000, // 5 minutes
  }
}

// Validierung der kritischen Konfigurationswerte
export function validateConfig() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ]

  // KMS-Validierung nur in Produktion
  if (config.nodeEnv === 'production') {
    requiredEnvVars.push('MASTER_ENCRYPTION_KEY')
    requiredEnvVars.push('KMS_AUDIT_HMAC_KEY')
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`)
  }

  if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production' && config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET muss in der Produktionsumgebung gesetzt werden')
  }

  // Validiere Master Key Format
  if (config.kms.masterKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(config.kms.masterKey)) {
      throw new Error('MASTER_ENCRYPTION_KEY muss 64 hexadezimale Zeichen sein (256 bits)')
    }
  }

  // Validiere HMAC Key Format
  if (config.kms.auditHmacKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(config.kms.auditHmacKey)) {
      throw new Error('KMS_AUDIT_HMAC_KEY muss 64 hexadezimale Zeichen sein (256 bits)')
    }
  }

  // Warne bei fehlenden KMS-Keys in Entwicklung
  if (config.nodeEnv === 'development' && !config.kms.masterKey) {
    console.warn('⚠️  WARNUNG: MASTER_ENCRYPTION_KEY nicht gesetzt. KMS-Funktionen sind deaktiviert.')
  }
  
  // Validate OpenAI API Key
  if (!config.openai.apiKey && config.nodeEnv === 'production') {
    throw new Error('OPENAI_API_KEY muss in der Produktionsumgebung gesetzt werden')
  }
}