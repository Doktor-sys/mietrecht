"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const https_1 = require("https");
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const advancedSecurity_1 = require("./middleware/advancedSecurity");
const swagger_1 = require("./config/swagger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const WebSocketService_1 = require("./services/WebSocketService");
const tls_1 = require("./config/tls");
const metrics_1 = __importStar(require("./monitoring/metrics"));
const AuditService_1 = require("./services/AuditService");
const SecurityMonitoringService_1 = require("./services/SecurityMonitoringService");
const ComplianceReportingService_1 = require("./services/ComplianceReportingService");
const AlertManager_1 = require("./services/kms/AlertManager");
const MLService_1 = require("./services/MLService");
const IntegrationService_1 = require("./services/IntegrationService");
// Import Routes
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const chat_1 = __importDefault(require("./routes/chat"));
const document_1 = __importDefault(require("./routes/document"));
const lawyer_1 = __importDefault(require("./routes/lawyer"));
const knowledge_1 = __importDefault(require("./routes/knowledge"));
const mietspiegel_1 = __importDefault(require("./routes/mietspiegel"));
const legal_data_import_1 = __importDefault(require("./routes/legal-data-import"));
const booking_1 = __importDefault(require("./routes/booking"));
const payment_1 = __importDefault(require("./routes/payment"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const b2b_1 = __importDefault(require("./routes/b2b"));
const kms_1 = __importStar(require("./routes/kms"));
const audit_1 = __importDefault(require("./routes/audit"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const security_dashboard_1 = __importDefault(require("./routes/security-dashboard"));
const employment_1 = __importDefault(require("./routes/employment"));
const app = (0, express_1.default)();
exports.app = app;
// TLS-Konfiguration laden
const tlsConfig = (0, tls_1.getTLSConfig)();
const httpsOptions = tlsConfig.enabled ? (0, tls_1.createHTTPSOptions)() : null;
// Server erstellen (HTTPS wenn TLS aktiviert, sonst HTTP)
const httpServer = httpsOptions
    ? (0, https_1.createServer)(httpsOptions, app)
    : (0, http_1.createServer)(app);
// HTTP-Server für Redirect (wenn HTTPS aktiviert)
let httpRedirectServer = null;
// Service-Instanzen
let auditService;
let securityMonitoring;
let complianceReporting;
let alertManager;
let mlService;
let integrationService;
// WebSocket Service initialisieren
let wsService;
// HTTPS Redirect Middleware (nur wenn TLS aktiviert)
if (tlsConfig.enabled) {
    const { httpsRedirect } = require('./middleware/httpsRedirect');
    app.use(httpsRedirect);
    logger_1.logger.info('HTTPS redirect middleware enabled');
}
// Security Middleware
app.use((0, helmet_1.default)({
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
}));
// CORS Configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? config_1.config.cors.allowedOrigins
        : ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100, // Limit auf 100 Requests pro IP
    message: {
        error: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Advanced Security Middleware
app.use(advancedSecurity_1.advancedSecurity.userAgentDetection);
app.use(advancedSecurity_1.advancedSecurity.rateLimit);
app.use(advancedSecurity_1.advancedSecurity.ipReputation);
// Stricter rate limiting for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5, // Nur 5 Login-Versuche pro 15 Minuten
    message: {
        error: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.',
    },
});
// Rate limiting for sensitive endpoints
const sensitiveEndpointLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 10, // Maximal 10 Anfragen pro 15 Minuten
    message: {
        error: 'Zu viele Anfragen an diesen Endpunkt. Bitte warten Sie 15 Minuten.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiting for API endpoints that handle file uploads
const fileUploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 Stunde
    max: 20, // Maximal 20 Uploads pro Stunde
    message: {
        error: 'Zu viele Datei-Uploads. Bitte warten Sie eine Stunde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/users/password-reset', sensitiveEndpointLimiter);
app.use('/api/users/change-email', sensitiveEndpointLimiter);
app.use('/api/documents/upload', fileUploadLimiter);
app.use('/api/kms/encrypt', sensitiveEndpointLimiter);
app.use('/api/kms/decrypt', sensitiveEndpointLimiter);
// Webhook Route (muss vor Body Parser kommen für raw body)
app.use('/api/webhooks', webhook_1.default);
// Body Parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Content Security Middleware (nach Body Parser)
app.use(advancedSecurity_1.advancedSecurity.contentSecurity);
// Metrics Middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    const route = req.path;
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        metrics_1.httpRequestDurationMicroseconds
            .labels(req.method, route, res.statusCode.toString())
            .observe(responseTime);
        metrics_1.httpRequestsTotal
            .labels(req.method, route, res.statusCode.toString())
            .inc();
    });
    next();
});
// Metrics Endpoint
app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', metrics_1.default.contentType);
    res.send(await metrics_1.default.metrics());
});
// Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/documents', document_1.default);
app.use('/api/lawyers', lawyer_1.default);
app.use('/api/knowledge', knowledge_1.default);
app.use('/api/mietspiegel', mietspiegel_1.default);
app.use('/api/legal-data', legal_data_import_1.default);
app.use('/api/bookings', booking_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/b2b', b2b_1.default);
app.use('/api/kms', kms_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/feedback', feedback_1.default);
app.use('/api/security-dashboard', security_dashboard_1.default);
app.use('/api/employment', employment_1.default);
// Setup Swagger Documentation
(0, swagger_1.setupSwagger)(app);
// Error Handler (muss als letztes Middleware registriert werden)
app.use(errorHandler_1.errorHandler);
// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path_1.default.join(__dirname, '../../../web-app/build');
    app.use(express_1.default.static(buildPath));
    app.get('*', (req, res, next) => {
        // Falls die Anfrage an die API geht, weitergeben (sollte eigentlich durch Router davor abgefangen werden)
        if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
            return next();
        }
        res.sendFile(path_1.default.join(buildPath, 'index.html'));
    });
}
// 404 Handler
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint nicht gefunden',
        },
    });
});
// Graceful Shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
        // Database connection will be closed by the database module's own handlers
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
        // Database connection will be closed by the database module's own handlers
        process.exit(0);
    });
});
// Database Connection and Server Start
// Database Connection and Server Start
if (process.env.NODE_ENV !== 'test') {
    (0, database_1.connectDatabase)()
        .then(async () => {
        // Use the prisma client from the database module instead of creating a new one
        logger_1.logger.info('Database connected successfully');
        // Redis Connection
        const redis = await (0, redis_1.connectRedis)();
        logger_1.logger.info('Redis connected successfully');
        // Initialize KMS Services
        (0, kms_1.initializeKMSServices)(redis);
        // Initialize WebSocket Service
        wsService = new WebSocketService_1.WebSocketService(httpServer);
        app.set('wsService', wsService);
        // Initialize Services
        auditService = new AuditService_1.AuditService(database_1.prisma);
        alertManager = new AlertManager_1.AlertManager();
        securityMonitoring = new SecurityMonitoringService_1.SecurityMonitoringService(database_1.prisma, auditService, alertManager);
        complianceReporting = new ComplianceReportingService_1.ComplianceReportingService(database_1.prisma, auditService, securityMonitoring, alertManager);
        // Initialize ML Service
        mlService = new MLService_1.MLService(database_1.prisma);
        await mlService.initialize();
        logger_1.logger.info('ML Service initialized successfully');
        // Initialize Integration Service
        integrationService = new IntegrationService_1.IntegrationService(database_1.prisma);
        await integrationService.initializeIntegrations();
        logger_1.logger.info('Integration Service initialized successfully');
        // Start Server
        const PORT = config_1.config.port;
        httpServer.listen(PORT, config_1.config.host, () => {
            logger_1.logger.info(`Server running on ${config_1.config.host}:${PORT}`);
            logger_1.logger.info('Performance-Optimierungen aktiviert');
            if (tlsConfig.enabled) {
                logger_1.logger.info(`HTTPS enabled`);
            }
        });
    })
        .catch((error) => {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    });
}
exports.default = app;
