import express, { Request, Response, Application, Express } from 'express'
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
import { connectDatabase } from './config/database'
import { connectRedis } from './config/redis'
import { WebSocketService } from './services/WebSocketService'
import { createHTTPSOptions, getTLSConfig } from './config/tls'
import register, { httpRequestDurationMicroseconds, httpRequestsTotal } from './monitoring/metrics'
import { PrismaClient } from '@prisma/client'
import { AuditService } from './services/AuditService'
import { SecurityMonitoringService } from './services/SecurityMonitoringService'
import { ComplianceReportingService } from './services/ComplianceReportingService'
import { AlertManager } from './services/kms/AlertManager'

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

const app: Application = express()

// TLS-Konfiguration laden
const tlsConfig = getTLSConfig()
const httpsOptions = tlsConfig.enabled ? createHTTPSOptions() : null

// Server erstellen (HTTPS wenn TLS aktiviert, sonst HTTP)
const httpServer = httpsOptions
  ? createHttpsServer(httpsOptions, app)
  : createServer(app)

// HTTP-Server für Redirect (wenn HTTPS aktiviert)
let httpRedirectServer: ReturnType<typeof createServer> | null = null

// Service-Instanzen
let prisma: PrismaClient
let auditService: AuditService
let securityMonitoring: SecurityMonitoringService
let complianceReporting: ComplianceReportingService
let alertManager: AlertManager

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
    },
  },
  hsts: {
    maxAge: 31536000, // 1 Jahr
    includeSubDomains: true,
    preload: true
  }
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
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

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

// Setup Swagger Documentation
setupSwagger(app as Express)

// Error Handler (muss als letztes Middleware registriert werden)
app.use(errorHandler)

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

async function startServer() {
  try {
    // Verbinde zur Datenbank
    await connectDatabase()
    prisma = new PrismaClient()
    logger.info('Datenbankverbindung hergestellt')

    // Verbinde zu Redis
    const redis = await connectRedis()
    logger.info('Redis-Verbindung hergestellt')

    // Initialisiere Services
    auditService = new AuditService(prisma);
    alertManager = new AlertManager({
      enabled: true,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      slackChannel: process.env.SLACK_CHANNEL,
      pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
      pagerDutyApiKey: process.env.PAGERDUTY_API_KEY
    });
    securityMonitoring = new SecurityMonitoringService(prisma, auditService, alertManager);
    complianceReporting = new ComplianceReportingService(prisma, auditService, securityMonitoring, alertManager);
    
    // Initialisiere KMS Services
    initializeKMSServices(redis)
    logger.info('KMS Services initialisiert')

    // Initialisiere WebSocket Service
    wsService = new WebSocketService(httpServer)
    logger.info('WebSocket Service initialisiert')

    // Mache WebSocket Service global verfügbar
    app.set('wsService', wsService)

    // Starte Security Monitoring
    await securityMonitoring.startMonitoring(5) // Alle 5 Minuten
    logger.info('Security Monitoring gestartet')

    // Starte Server
    const port = config.port
    const protocol = tlsConfig.enabled ? 'https' : 'http'

    httpServer.listen(port, () => {
      logger.info(`🚀 SmartLaw Backend läuft auf Port ${port}`)
      logger.info(`🔒 Protokoll: ${protocol.toUpperCase()}`)
      if (tlsConfig.enabled) {
        logger.info(`🔐 TLS Version: ${tlsConfig.minVersion}`)
      }
      logger.info(`📚 API Dokumentation: ${protocol}://localhost:${port}/api-docs`)
      logger.info(`🏥 Health Check: ${protocol}://localhost:${port}/health`)
      logger.info(`🔌 WebSocket Server läuft`)
    })

    // Starte HTTP-Redirect-Server wenn HTTPS aktiviert ist
    if (tlsConfig.enabled && process.env.HTTP_REDIRECT_PORT) {
      const httpRedirectPort = parseInt(process.env.HTTP_REDIRECT_PORT, 10)
      const redirectApp = express()

      redirectApp.use((req: Request, res: Response) => {
        const httpsUrl = `https://${req.hostname}:${port}${req.url}`
        res.redirect(301, httpsUrl)
      })

      httpRedirectServer = createServer(redirectApp)
      httpRedirectServer.listen(httpRedirectPort, () => {
        logger.info(`🔀 HTTP Redirect Server läuft auf Port ${httpRedirectPort}`)
      })
    }
  } catch (error) {
    logger.error('Fehler beim Starten des Servers:', error)
    process.exit(1)
  }
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM empfangen, Server wird heruntergefahren...')
  httpServer.close(() => {
    logger.info('HTTPS Server geschlossen')
    if (httpRedirectServer) {
      httpRedirectServer.close(() => {
        logger.info('HTTP Redirect Server geschlossen')
        process.exit(0)
      })
    } else {
      process.exit(0)
    }
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT empfangen, Server wird heruntergefahren...')
  httpServer.close(() => {
    logger.info('HTTPS Server geschlossen')
    if (httpRedirectServer) {
      httpRedirectServer.close(() => {
        logger.info('HTTP Redirect Server geschlossen')
        process.exit(0)
      })
    } else {
      process.exit(0)
    }
  })
})

startServer()

export { app }
export default app