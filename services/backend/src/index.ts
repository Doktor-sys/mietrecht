import express, { Request, Response, Application, Express } from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { config } from './config/config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { advancedSecurity } from './middleware/advancedSecurity'
import { setupSwagger } from './config/swagger'
import { connectDatabase, prisma } from './config/database'
import { connectRedis } from './config/redis'
import { WebSocketService } from './services/WebSocketService'
import { createHTTPSOptions, getTLSConfig } from './config/tls'
import register, { httpRequestDurationMicroseconds, httpRequestsTotal } from './monitoring/metrics'
import { AuditService } from './services/AuditService'
import { SecurityMonitoringService } from './services/SecurityMonitoringService'
import { ComplianceReportingService } from './services/ComplianceReportingService'
import { AlertManager } from './services/kms/AlertManager'
import { MLService } from './services/MLService'
import { IntegrationService } from './services/IntegrationService'

// Import Routes
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import chatRoutes from './routes/chat'
import documentRoutes from './routes/document'
import lawyerRoutes from './routes/lawyer'
import knowledgeRoutes from './routes/knowledge'
import mietspiegelRoutes from './routes/mietspiegel'
import legalDataImportRoutes from './routes/legal-data-import'
import bookingRoutes from './routes/booking'
import paymentRoutes from './routes/payment'
import webhookRoutes from './routes/webhook'
import b2bRoutes from './routes/b2b'
import kmsRoutes, { initializeKMSServices } from './routes/kms'
import auditRoutes from './routes/audit'
import feedbackRoutes from './routes/feedback'
import securityDashboardRoutes from './routes/security-dashboard'
import employmentRoutes from './routes/employment'

const app: Application = express()

// TLS-Konfiguration laden
const tlsConfig = getTLSConfig()
const httpsOptions = tlsConfig.enabled ? createHTTPSOptions() : null

// Server erstellen (HTTPS wenn TLS aktiviert, sonst HTTP)
const httpServer = httpsOptions
  ? createHttpsServer(httpsOptions, app)
  : createServer(app)

// HTTP-Server für Redirect (wenn HTTPS aktiviert)
let httpRedirectServer: any = null

// Service-Instanzen
let auditService: AuditService
let securityMonitoring: SecurityMonitoringService
let complianceReporting: ComplianceReportingService
let alertManager: AlertManager
let mlService: MLService
let integrationService: IntegrationService

// WebSocket Service initialisieren
let wsService: WebSocketService

// HTTPS Redirect Middleware (nur wenn TLS aktiviert)
if (tlsConfig.enabled) {
  const { httpsRedirect } = require('./middleware/httpsRedirect')
  app.use(httpsRedirect)
  logger.info('HTTPS redirect middleware enabled')
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    },
  },
  // Disable powered by header to prevent leaking information
  hidePoweredBy: true,
  // Prevent MIME type sniffing
  noSniff: true,
  // Prevent cross-site scripting attacks
  xssFilter: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Enforce HTTPS
  hsts: {
    maxAge: 31536000, // 1 Jahr
    includeSubDomains: true,
    preload: true
  },
  // Prevent cross-site scripting
  referrerPolicy: { policy: 'no-referrer' },
  // Prevent DNS prefetching
  dnsPrefetchControl: { allow: false }
}))

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? config.cors.allowedOrigins
    : ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit auf 100 Requests pro IP
  message: {
    error: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Advanced Security Middleware
app.use(advancedSecurity.userAgentDetection)
app.use(advancedSecurity.rateLimit)
app.use(advancedSecurity.ipReputation)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Nur 5 Login-Versuche pro 15 Minuten
  message: {
    error: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.',
  },
})

// Rate limiting for sensitive endpoints
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10, // Maximal 10 Anfragen pro 15 Minuten
  message: {
    error: 'Zu viele Anfragen an diesen Endpunkt. Bitte warten Sie 15 Minuten.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting for API endpoints that handle file uploads
const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 20, // Maximal 20 Uploads pro Stunde
  message: {
    error: 'Zu viele Datei-Uploads. Bitte warten Sie eine Stunde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/users/password-reset', sensitiveEndpointLimiter)
app.use('/api/users/change-email', sensitiveEndpointLimiter)
app.use('/api/documents/upload', fileUploadLimiter)
app.use('/api/kms/encrypt', sensitiveEndpointLimiter)
app.use('/api/kms/decrypt', sensitiveEndpointLimiter)

// Webhook Route (muss vor Body Parser kommen für raw body)
app.use('/api/webhooks', webhookRoutes)

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Content Security Middleware (nach Body Parser)
app.use(advancedSecurity.contentSecurity);

// Metrics Middleware
app.use((req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  const route = req.path;

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(responseTime);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  next();
});

// Metrics Endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/lawyers', lawyerRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/mietspiegel', mietspiegelRoutes)
app.use('/api/legal-data', legalDataImportRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/b2b', b2bRoutes)
app.use('/api/kms', kmsRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/security-dashboard', securityDashboardRoutes)
app.use('/api/employment', employmentRoutes)

// Setup Swagger Documentation
setupSwagger(app as Express)

// Error Handler (muss als letztes Middleware registriert werden)
app.use(errorHandler)

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../../web-app/build');
  app.use(express.static(buildPath));

  app.get('*', (req: Request, res: Response, next: Function) => {
    // Falls die Anfrage an die API geht, weitergeben (sollte eigentlich durch Router davor abgefangen werden)
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
      return next();
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// 404 Handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint nicht gefunden',
    },
  })
})

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')

  httpServer.close(() => {
    logger.info('HTTP server closed')
    // Database connection will be closed by the database module's own handlers
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')

  httpServer.close(() => {
    logger.info('HTTP server closed')
    // Database connection will be closed by the database module's own handlers
    process.exit(0)
  })
})

// Database Connection and Server Start
// Database Connection and Server Start
if (process.env.NODE_ENV !== 'test') {
  connectDatabase()
    .then(async () => {
      // Use the prisma client from the database module instead of creating a new one
      logger.info('Database connected successfully')

      // Redis Connection
      const redis = await connectRedis()
      logger.info('Redis connected successfully')

      // Initialize KMS Services
      initializeKMSServices(redis)

      // Initialize WebSocket Service
      wsService = new WebSocketService(httpServer)
      app.set('wsService', wsService)

      // Initialize Services
      auditService = new AuditService(prisma)
      alertManager = new AlertManager()
      securityMonitoring = new SecurityMonitoringService(prisma, auditService, alertManager)
      complianceReporting = new ComplianceReportingService(prisma, auditService, securityMonitoring, alertManager)

      // Initialize ML Service
      mlService = new MLService(prisma)
      await mlService.initialize()
      logger.info('ML Service initialized successfully')

      // Initialize Integration Service
      integrationService = new IntegrationService(prisma)
      await integrationService.initializeIntegrations()
      logger.info('Integration Service initialized successfully')

      // Start Server
      const PORT = config.port
      httpServer.listen(PORT, config.host, () => {
        logger.info(`Server running on ${config.host}:${PORT}`)
        logger.info('Performance-Optimierungen aktiviert')
        if (tlsConfig.enabled) {
          logger.info(`HTTPS enabled`)
        }
      })
    })
    .catch((error) => {
      logger.error('Failed to start server', { error })
      process.exit(1)
    })
}

export { app }
export default app