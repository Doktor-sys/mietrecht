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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authenticateFlexible = exports.authenticateApiKey = exports.authenticatedRateLimit = exports.optionalAuth = exports.requireOwnership = exports.requireVerified = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const AuthService_1 = require("../services/AuthService");
const database_1 = require("../config/database");
const errorHandler_1 = require("./errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const authService = new AuthService_1.AuthService(database_1.prisma);
/**
 * Middleware zur Authentifizierung von Requests
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AuthenticationError('Authorization Header fehlt oder ist ungültig');
        }
        const token = authHeader.substring(7); // Entferne "Bearer "
        if (!token) {
            throw new errorHandler_1.AuthenticationError('Token fehlt');
        }
        // Verifiziere Token
        const payload = await authService.verifyToken(token);
        // Setze Benutzerinformationen in Request
        req.user = {
            id: payload.userId,
            email: payload.email,
            userType: payload.userType,
            sessionId: payload.sessionId
        };
        next();
    }
    catch (error) {
        // Log Authentifizierungsfehler
        logger_1.loggers.securityEvent('AUTHENTICATION_FAILED', undefined, req.ip, {
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent'),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware zur Autorisierung basierend auf Benutzertyp
 */
const authorize = (...allowedUserTypes) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
            }
            if (!allowedUserTypes.includes(req.user.userType)) {
                logger_1.loggers.securityEvent('AUTHORIZATION_FAILED', req.user.id, req.ip, {
                    requiredTypes: allowedUserTypes,
                    userType: req.user.userType,
                    url: req.url,
                    method: req.method
                });
                throw new errorHandler_1.AuthorizationError('Nicht autorisiert für diese Aktion');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Middleware zur Überprüfung ob Benutzer Admin-Rechte hat
 * Für Audit-Logs und andere administrative Funktionen
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
        }
        // Lade aktuellen Benutzer aus Datenbank
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht gefunden');
        }
        // Nur Business-Benutzer haben Admin-Rechte für Audit-Logs
        // In einer echten Implementierung würde man hier eine separate Admin-Rolle prüfen
        if (user.userType !== client_1.UserType.BUSINESS) {
            logger_1.loggers.securityEvent('ADMIN_ACCESS_DENIED', req.user.id, req.ip, {
                url: req.url,
                method: req.method,
                userType: user.userType
            });
            throw new errorHandler_1.AuthorizationError('Admin-Rechte erforderlich');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware zur Überprüfung ob Benutzer verifiziert ist
 */
const requireVerified = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
        }
        // Lade aktuellen Benutzer aus Datenbank
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht gefunden');
        }
        if (!user.isVerified) {
            throw new errorHandler_1.AuthorizationError('E-Mail-Adresse muss verifiziert werden');
        }
        if (!user.isActive) {
            throw new errorHandler_1.AuthorizationError('Benutzerkonto ist deaktiviert');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireVerified = requireVerified;
/**
 * Middleware zur Überprüfung ob Benutzer Zugriff auf Ressource hat
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
            }
            // Business-Benutzer haben erweiterte Rechte
            if (req.user.userType === client_1.UserType.BUSINESS) {
                return next();
            }
            const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
            if (!resourceUserId) {
                throw new errorHandler_1.AuthorizationError('Ressourcen-Benutzer-ID nicht gefunden');
            }
            if (req.user.id !== resourceUserId) {
                logger_1.loggers.securityEvent('OWNERSHIP_VIOLATION', req.user.id, req.ip, {
                    resourceUserId,
                    url: req.url,
                    method: req.method
                });
                throw new errorHandler_1.AuthorizationError('Zugriff auf fremde Ressource nicht erlaubt');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnership = requireOwnership;
/**
 * Optionale Authentifizierung - setzt req.user wenn Token vorhanden
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token) {
                try {
                    const payload = await authService.verifyToken(token);
                    req.user = {
                        id: payload.userId,
                        email: payload.email,
                        userType: payload.userType,
                        sessionId: payload.sessionId
                    };
                }
                catch (error) {
                    // Bei optionaler Auth ignorieren wir Token-Fehler
                    logger_1.logger.debug('Optional auth failed:', error);
                }
            }
        }
        next();
    }
    catch (error) {
        // Bei optionaler Auth sollten Fehler nicht den Request blockieren
        logger_1.logger.debug('Optional auth error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Rate Limiting für authentifizierte Benutzer
 */
const authenticatedRateLimit = (maxRequests = 1000, windowMinutes = 60) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next();
            }
            const key = `auth_rate_limit:${req.user.id}`;
            const windowSeconds = windowMinutes * 60;
            const { redis } = await Promise.resolve().then(() => __importStar(require('../config/redis')));
            const requests = await redis.incrementRateLimit(key, windowSeconds);
            if (requests > maxRequests) {
                logger_1.loggers.securityEvent('AUTHENTICATED_RATE_LIMIT_EXCEEDED', req.user.id, req.ip, {
                    requests,
                    limit: maxRequests,
                    windowMinutes
                });
                throw new errorHandler_1.AuthorizationError(`Zu viele Anfragen. Limit: ${maxRequests} pro ${windowMinutes} Minuten`);
            }
            // Setze Rate Limit Headers
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, maxRequests - requests).toString(),
                'X-RateLimit-Reset': new Date(Date.now() + windowSeconds * 1000).toISOString()
            });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authenticatedRateLimit = authenticatedRateLimit;
/**
 * Middleware zur Überprüfung von API-Keys für B2B-Kunden
 */
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            throw new errorHandler_1.AuthenticationError('API-Key fehlt');
        }
        // Validiere API-Key aus Datenbank
        const apiKeyRecord = await database_1.prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        users: {
                            where: { userType: client_1.UserType.BUSINESS },
                            take: 1,
                            select: {
                                id: true,
                                email: true,
                                userType: true
                            }
                        }
                    }
                }
            }
        });
        if (!apiKeyRecord) {
            throw new errorHandler_1.AuthenticationError('Ungültiger API-Key');
        }
        // Prüfe ob API-Key aktiv ist
        if (!apiKeyRecord.isActive) {
            logger_1.loggers.securityEvent('API_KEY_INACTIVE', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId
            });
            throw new errorHandler_1.AuthenticationError('API-Key ist deaktiviert');
        }
        // Prüfe ob API-Key abgelaufen ist
        if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
            logger_1.loggers.securityEvent('API_KEY_EXPIRED', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId,
                expiresAt: apiKeyRecord.expiresAt
            });
            throw new errorHandler_1.AuthenticationError('API-Key ist abgelaufen');
        }
        // Prüfe Quota
        if (apiKeyRecord.quotaLimit && apiKeyRecord.quotaUsed >= apiKeyRecord.quotaLimit) {
            logger_1.loggers.securityEvent('API_KEY_QUOTA_EXCEEDED', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId,
                quotaUsed: apiKeyRecord.quotaUsed,
                quotaLimit: apiKeyRecord.quotaLimit
            });
            throw new errorHandler_1.AuthorizationError('API-Key Quota überschritten');
        }
        // Update lastUsedAt und quotaUsed
        await database_1.prisma.apiKey.update({
            where: { id: apiKeyRecord.id },
            data: {
                lastUsedAt: new Date(),
                quotaUsed: apiKeyRecord.quotaUsed + 1
            }
        });
        next();
    }
    catch (error) {
        logger_1.loggers.securityEvent('API_KEY_AUTHENTICATION_FAILED', undefined, req.ip, {
            url: req.url,
            method: req.method,
            apiKey: req.headers['x-api-key'] ? 'provided' : 'missing',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(error);
    }
};
exports.authenticateApiKey = authenticateApiKey;
/**
 * Kombinierte Authentifizierung: JWT oder API-Key
 */
const authenticateFlexible = async (req, res, next) => {
    try {
        // Versuche zuerst API-Key Authentifizierung
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            return (0, exports.authenticateApiKey)(req, res, next);
        }
        // Fallback auf JWT Authentifizierung
        return (0, exports.authenticate)(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateFlexible = authenticateFlexible;
// Alias für Backward Compatibility
exports.authenticateToken = exports.authenticate;
