export const gatewayConfig = {
  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    document: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3002',
    legalAi: process.env.LEGAL_AI_SERVICE_URL || 'http://localhost:3003',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3004',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    knowledge: process.env.KNOWLEDGE_SERVICE_URL || 'http://localhost:3006',
    communication: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3007',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
    compliance: process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3009',
    b2b: process.env.B2B_SERVICE_URL || 'http://localhost:3010',
    dataSources: process.env.DATA_SOURCES_SERVICE_URL || 'http://localhost:3011'
  },
  
  // Rate limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100') // limit each IP to 100 requests per windowMs
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  // Health check
  health: {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000') // 5 seconds
  }
};