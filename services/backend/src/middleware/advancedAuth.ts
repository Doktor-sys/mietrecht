import { Request, Response, NextFunction } from 'express';
import { AdvancedAuthService } from '../services/AdvancedAuthService';
import { prisma } from '../config/database';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { UserType } from '@prisma/client';
import { logger, loggers } from '../utils/logger';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: UserType;
        sessionId: string;
        deviceId?: string;
        scopes?: string[];
      }
    }
  }
}

const advancedAuthService = new AdvancedAuthService(prisma);

/**
 * Advanced authentication middleware with device and IP tracking
 */
export const advancedAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const deviceId = req.headers['x-device-id'] as string;
    const ipAddress = req.ip || (req.connection?.remoteAddress as string);
    const userAgent = req.get('User-Agent');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization Header fehlt oder ist ungültig');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    if (!token) {
      throw new AuthenticationError('Token fehlt');
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
  } catch (error) {
    // Log authentication failures
    loggers.securityEvent('ADVANCED_AUTHENTICATION_FAILED', undefined, req.ip, {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    next(error);
  }
};

/**
 * Enhanced authorization middleware with role-based access control
 */
export const advancedAuthorize = (...allowedUserTypes: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Benutzer nicht authentifiziert');
      }

      if (!allowedUserTypes.includes(req.user.userType)) {
        loggers.securityEvent('ADVANCED_AUTHORIZATION_FAILED', req.user.id, req.ip, {
          requiredTypes: allowedUserTypes,
          userType: req.user.userType,
          url: req.url,
          method: req.method
        });

        throw new AuthorizationError('Nicht autorisiert für diese Aktion');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Advanced admin authorization middleware
 */
export const advancedRequireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Benutzer nicht authentifiziert');
    }

    // Load current user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AuthenticationError('Benutzer nicht gefunden');
    }

    // Only BUSINESS users have admin rights for audit logs
    // In a real implementation, you would check for a separate admin role
    if (user.userType !== UserType.BUSINESS) {
      loggers.securityEvent('ADVANCED_ADMIN_ACCESS_DENIED', req.user.id, req.ip, {
        url: req.url,
        method: req.method,
        userType: user.userType
      });

      throw new AuthorizationError('Admin-Rechte erforderlich');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enhanced verified user middleware
 */
export const advancedRequireVerified = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Benutzer nicht authentifiziert');
    }

    // Load current user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AuthenticationError('Benutzer nicht gefunden');
    }

    if (!user.isVerified) {
      throw new AuthorizationError('E-Mail-Adresse muss verifiziert werden');
    }

    if (!user.isActive) {
      throw new AuthorizationError('Benutzerkonto ist deaktiviert');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enhanced ownership verification middleware
 */
export const advancedRequireOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Benutzer nicht authentifiziert');
      }

      // BUSINESS users have extended rights
      if (req.user.userType === UserType.BUSINESS) {
        return next();
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      if (!resourceUserId) {
        throw new AuthorizationError('Ressourcen-Benutzer-ID nicht gefunden');
      }

      if (req.user.id !== resourceUserId) {
        loggers.securityEvent('ADVANCED_OWNERSHIP_VIOLATION', req.user.id, req.ip, {
          resourceUserId,
          url: req.url,
          method: req.method
        });

        throw new AuthorizationError('Zugriff auf fremde Ressource nicht erlaubt');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional advanced authentication - sets req.user if token is present
 */
export const advancedOptionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const deviceId = req.headers['x-device-id'] as string;
    const ipAddress = req.ip || (req.connection?.remoteAddress as string);

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
        } catch (error) {
          // For optional auth, ignore token errors
          logger.debug('Optionale Authentifizierung fehlgeschlagen:', error);
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, errors should not block the request
    logger.debug('Optionale Authentifizierung Fehler:', error);
    next();
  }
};

/**
 * Advanced rate limiting for authenticated users
 */
export const advancedAuthenticatedRateLimit = (maxRequests: number = 1000, windowMinutes: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next();
      }

      const key = `advanced_auth_rate_limit:${req.user.id}`;
      const windowSeconds = windowMinutes * 60;

      const { redis } = await import('../config/redis');
      const requests = await redis.incrementRateLimit(key, windowSeconds);

      if (requests > maxRequests) {
        loggers.securityEvent('ADVANCED_AUTHENTICATED_RATE_LIMIT_EXCEEDED', req.user.id, req.ip, {
          requests,
          limit: maxRequests,
          windowMinutes
        });

        throw new AuthorizationError(`Zu viele Anfragen. Limit: ${maxRequests} pro ${windowMinutes} Minuten`);
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requests).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowSeconds * 1000).toISOString()
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Enhanced API key authentication for B2B customers
 */
export const advancedAuthenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const deviceId = req.headers['x-device-id'] as string;
    const ipAddress = req.ip || (req.connection?.remoteAddress as string);

    if (!apiKey) {
      throw new AuthenticationError('API-Key fehlt');
    }

    // Validate API key from database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            users: {
              where: { userType: UserType.BUSINESS },
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
      throw new AuthenticationError('Ungültiger API-Key');
    }

    // Check if API key is active
    if (!apiKeyRecord.isActive) {
      loggers.securityEvent('ADVANCED_API_KEY_INACTIVE', undefined, req.ip, {
        apiKeyId: apiKeyRecord.id,
        organizationId: apiKeyRecord.organizationId
      });
      throw new AuthenticationError('API-Key ist deaktiviert');
    }

    // Check if API key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      loggers.securityEvent('ADVANCED_API_KEY_EXPIRED', undefined, req.ip, {
        apiKeyId: apiKeyRecord.id,
        organizationId: apiKeyRecord.organizationId,
        expiresAt: apiKeyRecord.expiresAt
      });
      throw new AuthenticationError('API-Key ist abgelaufen');
    }

    // Check quota
    if (apiKeyRecord.quotaLimit && apiKeyRecord.quotaUsed >= apiKeyRecord.quotaLimit) {
      loggers.securityEvent('ADVANCED_API_KEY_QUOTA_EXCEEDED', undefined, req.ip, {
        apiKeyId: apiKeyRecord.id,
        organizationId: apiKeyRecord.organizationId,
        quotaUsed: apiKeyRecord.quotaUsed,
        quotaLimit: apiKeyRecord.quotaLimit
      });
      throw new AuthorizationError('API-Key Quota überschritten');
    }

    // Update lastUsedAt and quotaUsed
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        quotaUsed: apiKeyRecord.quotaUsed + 1
      }
    });

    next();
  } catch (error) {
    loggers.securityEvent('ADVANCED_API_KEY_AUTHENTICATION_FAILED', undefined, req.ip, {
      url: req.url,
      method: req.method,
      apiKey: req.headers['x-api-key'] ? 'provided' : 'missing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    next(error);
  }
};

/**
 * Combined authentication: JWT, API key, or device token
 */
export const advancedAuthenticateFlexible = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try API key authentication first
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return advancedAuthenticateApiKey(req, res, next);
    }

    // Try device token authentication
    const deviceToken = req.headers['x-device-token'];
    if (deviceToken) {
      // Device token authentication would be implemented here
      // For now, we'll fall back to JWT authentication
    }

    // Fallback to JWT authentication
    return advancedAuthenticate(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Alias for backward compatibility
export const advancedAuthenticateToken = advancedAuthenticate;