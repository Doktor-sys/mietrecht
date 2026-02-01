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
exports.advancedAuthenticateToken = exports.advancedAuthenticateFlexible = exports.advancedAuthenticateApiKey = exports.advancedAuthenticatedRateLimit = exports.advancedOptionalAuth = exports.advancedRequireOwnership = exports.advancedRequireVerified = exports.advancedRequireAdmin = exports.advancedAuthorize = exports.advancedAuthenticate = void 0;
const AdvancedAuthService_1 = require("../services/AdvancedAuthService");
const database_1 = require("../config/database");
const errorHandler_1 = require("./errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const advancedAuthService = new AdvancedAuthService_1.AdvancedAuthService(database_1.prisma);
/**
 * Advanced authentication middleware with device and IP tracking
 */
const advancedAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const deviceId = req.headers['x-device-id'];
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AuthenticationError('Authorization Header fehlt oder ist ungültig');
        }
        const token = authHeader.substring(7); // Remove "Bearer "
        if (!token) {
            throw new errorHandler_1.AuthenticationError('Token fehlt');
        }
        // Verify token with device and IP tracking
        const payload = await advancedAuthService.verifyAdvancedToken(token, deviceId, ipAddress);
        // Set user information in request
        req.user = {
            id: payload.userId,
            email: payload.email,
            userType: payload.userType,
            sessionId: payload.sessionId,
            deviceId: payload.deviceId,
            scopes: payload.scopes
        };
        next();
    }
    catch (error) {
        // Log authentication failures
        logger_1.loggers.securityEvent('ADVANCED_AUTHENTICATION_FAILED', undefined, req.ip, {
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent'),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(error);
    }
};
exports.advancedAuthenticate = advancedAuthenticate;
/**
 * Enhanced authorization middleware with role-based access control
 */
const advancedAuthorize = (...allowedUserTypes) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
            }
            if (!allowedUserTypes.includes(req.user.userType)) {
                logger_1.loggers.securityEvent('ADVANCED_AUTHORIZATION_FAILED', req.user.id, req.ip, {
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
exports.advancedAuthorize = advancedAuthorize;
/**
 * Advanced admin authorization middleware
 */
const advancedRequireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
        }
        // Load current user from database
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht gefunden');
        }
        // Only BUSINESS users have admin rights for audit logs
        // In a real implementation, you would check for a separate admin role
        if (user.userType !== client_1.UserType.BUSINESS) {
            logger_1.loggers.securityEvent('ADVANCED_ADMIN_ACCESS_DENIED', req.user.id, req.ip, {
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
exports.advancedRequireAdmin = advancedRequireAdmin;
/**
 * Enhanced verified user middleware
 */
const advancedRequireVerified = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
        }
        // Load current user from database
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
exports.advancedRequireVerified = advancedRequireVerified;
/**
 * Enhanced ownership verification middleware
 */
const advancedRequireOwnership = (resourceUserIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht authentifiziert');
            }
            // BUSINESS users have extended rights
            if (req.user.userType === client_1.UserType.BUSINESS) {
                return next();
            }
            const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
            if (!resourceUserId) {
                throw new errorHandler_1.AuthorizationError('Ressourcen-Benutzer-ID nicht gefunden');
            }
            if (req.user.id !== resourceUserId) {
                logger_1.loggers.securityEvent('ADVANCED_OWNERSHIP_VIOLATION', req.user.id, req.ip, {
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
exports.advancedRequireOwnership = advancedRequireOwnership;
/**
 * Optional advanced authentication - sets req.user if token is present
 */
const advancedOptionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const deviceId = req.headers['x-device-id'];
        const ipAddress = req.ip || req.connection?.remoteAddress;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token) {
                try {
                    const payload = await advancedAuthService.verifyAdvancedToken(token, deviceId, ipAddress);
                    req.user = {
                        id: payload.userId,
                        email: payload.email,
                        userType: payload.userType,
                        sessionId: payload.sessionId,
                        deviceId: payload.deviceId,
                        scopes: payload.scopes
                    };
                }
                catch (error) {
                    // For optional auth, ignore token errors
                    logger_1.logger.debug('Optionale Authentifizierung fehlgeschlagen:', error);
                }
            }
        }
        next();
    }
    catch (error) {
        // For optional auth, errors should not block the request
        logger_1.logger.debug('Optionale Authentifizierung Fehler:', error);
        next();
    }
};
exports.advancedOptionalAuth = advancedOptionalAuth;
/**
 * Advanced rate limiting for authenticated users
 */
const advancedAuthenticatedRateLimit = (maxRequests = 1000, windowMinutes = 60) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next();
            }
            const key = `advanced_auth_rate_limit:${req.user.id}`;
            const windowSeconds = windowMinutes * 60;
            const { redis } = await Promise.resolve().then(() => __importStar(require('../config/redis')));
            const requests = await redis.incrementRateLimit(key, windowSeconds);
            if (requests > maxRequests) {
                logger_1.loggers.securityEvent('ADVANCED_AUTHENTICATED_RATE_LIMIT_EXCEEDED', req.user.id, req.ip, {
                    requests,
                    limit: maxRequests,
                    windowMinutes
                });
                throw new errorHandler_1.AuthorizationError(`Zu viele Anfragen. Limit: ${maxRequests} pro ${windowMinutes} Minuten`);
            }
            // Set rate limit headers
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
exports.advancedAuthenticatedRateLimit = advancedAuthenticatedRateLimit;
/**
 * Enhanced API key authentication for B2B customers
 */
const advancedAuthenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const deviceId = req.headers['x-device-id'];
        const ipAddress = req.ip || req.connection?.remoteAddress;
        if (!apiKey) {
            throw new errorHandler_1.AuthenticationError('API-Key fehlt');
        }
        // Validate API key from database
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
        // Check if API key is active
        if (!apiKeyRecord.isActive) {
            logger_1.loggers.securityEvent('ADVANCED_API_KEY_INACTIVE', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId
            });
            throw new errorHandler_1.AuthenticationError('API-Key ist deaktiviert');
        }
        // Check if API key is expired
        if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
            logger_1.loggers.securityEvent('ADVANCED_API_KEY_EXPIRED', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId,
                expiresAt: apiKeyRecord.expiresAt
            });
            throw new errorHandler_1.AuthenticationError('API-Key ist abgelaufen');
        }
        // Check quota
        if (apiKeyRecord.quotaLimit && apiKeyRecord.quotaUsed >= apiKeyRecord.quotaLimit) {
            logger_1.loggers.securityEvent('ADVANCED_API_KEY_QUOTA_EXCEEDED', undefined, req.ip, {
                apiKeyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId,
                quotaUsed: apiKeyRecord.quotaUsed,
                quotaLimit: apiKeyRecord.quotaLimit
            });
            throw new errorHandler_1.AuthorizationError('API-Key Quota überschritten');
        }
        // Update lastUsedAt and quotaUsed
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
        logger_1.loggers.securityEvent('ADVANCED_API_KEY_AUTHENTICATION_FAILED', undefined, req.ip, {
            url: req.url,
            method: req.method,
            apiKey: req.headers['x-api-key'] ? 'provided' : 'missing',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(error);
    }
};
exports.advancedAuthenticateApiKey = advancedAuthenticateApiKey;
/**
 * Combined authentication: JWT, API key, or device token
 */
const advancedAuthenticateFlexible = async (req, res, next) => {
    try {
        // Try API key authentication first
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            return (0, exports.advancedAuthenticateApiKey)(req, res, next);
        }
        // Try device token authentication
        const deviceToken = req.headers['x-device-token'];
        if (deviceToken) {
            // Device token authentication would be implemented here
            // For now, we'll fall back to JWT authentication
        }
        // Fallback to JWT authentication
        return (0, exports.advancedAuthenticate)(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.advancedAuthenticateFlexible = advancedAuthenticateFlexible;
// Alias for backward compatibility
exports.advancedAuthenticateToken = exports.advancedAuthenticate;
