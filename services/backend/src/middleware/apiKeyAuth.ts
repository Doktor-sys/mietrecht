import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    organizationId: string;
    permissions: string[];
    rateLimit: number;
    quotaLimit: number;
    quotaUsed: number;
  };
}

/**
 * Middleware für API-Key-basierte Authentifizierung für B2B-Kunden
 */
export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide a valid API key in the X-API-Key header',
      });
    }

    // API-Key in der Datenbank suchen
    const keyRecord = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
            isActive: true,
          },
        },
      },
    });

    if (!keyRecord) {
      logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 8) + '...' });
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked',
      });
    }

    // Überprüfe ob die Organisation aktiv ist
    if (!keyRecord.organization.isActive) {
      return res.status(403).json({
        error: 'Organization suspended',
        message: 'Your organization account has been suspended',
      });
    }

    // Überprüfe Ablaufdatum
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'The provided API key has expired',
      });
    }

    // Aktualisiere letzten Zugriff
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Füge API-Key-Informationen zur Request hinzu
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      organizationId: keyRecord.organizationId,
      permissions: keyRecord.permissions,
      rateLimit: keyRecord.rateLimit,
      quotaLimit: keyRecord.quotaLimit,
      quotaUsed: keyRecord.quotaUsed,
    };

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Middleware zur Überprüfung spezifischer Berechtigungen
 */
export const requirePermission = (permission: string) => {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key authentication is required',
      });
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes('*')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This API key does not have the required permission: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware für Rate Limiting basierend auf API-Key
 */
export const apiKeyRateLimit = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.apiKey) {
      return next();
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60000); // 1 Minute Fenster

    // Zähle Requests in der letzten Minute
    const requestCount = await prisma.apiRequest.count({
      where: {
        apiKeyId: req.apiKey.id,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (requestCount >= req.apiKey.rateLimit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Rate limit of ${req.apiKey.rateLimit} requests per minute exceeded`,
        retryAfter: 60,
      });
    }

    // Logge den Request
    await prisma.apiRequest.create({
      data: {
        apiKeyId: req.apiKey.id,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip,
      },
    });

    next();
  } catch (error) {
    logger.error('Rate limiting error:', error);
    next(); // Bei Fehlern nicht blockieren
  }
};

/**
 * Middleware für Quota Management
 */
export const checkQuota = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.apiKey) {
      return next();
    }

    if (req.apiKey.quotaUsed >= req.apiKey.quotaLimit) {
      return res.status(429).json({
        error: 'Quota exceeded',
        message: `Monthly quota of ${req.apiKey.quotaLimit} requests exceeded`,
        quotaUsed: req.apiKey.quotaUsed,
        quotaLimit: req.apiKey.quotaLimit,
      });
    }

    next();
  } catch (error) {
    logger.error('Quota check error:', error);
    next();
  }
};

/**
 * Middleware zum Aktualisieren der Quota nach erfolgreichem Request
 */
export const updateQuota = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Nur bei erfolgreichen Requests (2xx) die Quota erhöhen
    if (req.apiKey && res.statusCode >= 200 && res.statusCode < 300) {
      prisma.apiKey.update({
        where: { id: req.apiKey.id },
        data: { quotaUsed: { increment: 1 } },
      }).catch((error) => {
        logger.error('Error updating quota:', error);
      });
    }

    return originalSend.call(this, data);
  };

  next();
};