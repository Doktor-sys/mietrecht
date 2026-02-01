import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: string;
      };
    }
  }
}

/**
 * Middleware zur Authentifizierung von Benutzern
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token aus dem Authorization-Header extrahieren
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token missing'
        }
      });
    }
    
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      userId: string;
      email: string;
      userType: string;
    };
    
    // Benutzerinformationen an den Request anhängen
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      userType: decoded.userType
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid access token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token expired'
        }
      });
    }
    
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Middleware zur Überprüfung von Benutzerrollen
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated'
        }
      });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
};