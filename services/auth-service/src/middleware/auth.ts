import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticationError } from './errorHandler';

const prisma = new PrismaClient();

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
      throw new AuthenticationError('Zugriffstoken fehlt');
    }
    
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      userId: string;
      email: string;
      userType: string;
    };
    
    // Benutzer in der Datenbank suchen
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || !user.isActive) {
      throw new AuthenticationError('Benutzer nicht gefunden oder deaktiviert');
    }
    
    // Benutzerinformationen an den Request anhängen
    req.user = {
      id: user.id,
      email: user.email,
      userType: user.userType
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Ungültiges Zugriffstoken'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Zugriffstoken abgelaufen'));
    }
    
    next(error);
  }
};

/**
 * Middleware zur Überprüfung von Benutzerrollen
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Benutzer nicht authentifiziert'));
    }
    
    if (!roles.includes(req.user.userType)) {
      return next(new AuthenticationError('Unzureichende Berechtigungen'));
    }
    
    next();
  };
};