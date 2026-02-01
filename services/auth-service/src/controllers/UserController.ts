import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  location?: string;
}

interface UpdatePreferencesRequest {
  notifications?: object;
  privacy?: object;
}

export class UserController {
  /**
   * Ruft das Benutzerprofil ab
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      // Benutzerprofil abrufen
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true
        }
      });
      
      if (!user) {
        throw new ValidationError('Benutzer nicht gefunden');
      }
      
      logger.info('Benutzerprofil abgerufen', { userId });
      
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          profile: user.profile,
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Aktualisiert das Benutzerprofil
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, location } = req.body as UpdateProfileRequest;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      // Profil aktualisieren
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              firstName,
              lastName,
              location
            }
          }
        },
        include: {
          profile: true,
          preferences: true
        }
      });
      
      logger.info('Benutzerprofil aktualisiert', { userId });
      
      res.json({
        success: true,
        message: 'Profil erfolgreich aktualisiert',
        data: {
          profile: updatedUser.profile
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ruft die Benutzereinstellungen ab
   */
  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      // Benutzereinstellungen abrufen
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });
      
      if (!preferences) {
        throw new ValidationError('Einstellungen nicht gefunden');
      }
      
      logger.info('Benutzereinstellungen abgerufen', { userId });
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Aktualisiert die Benutzereinstellungen
   */
  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { notifications, privacy } = req.body as UpdatePreferencesRequest;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      // Einstellungen aktualisieren
      const updatedPreferences = await prisma.userPreferences.update({
        where: { userId },
        data: {
          notifications,
          privacy
        }
      });
      
      logger.info('Benutzereinstellungen aktualisiert', { userId });
      
      res.json({
        success: true,
        message: 'Einstellungen erfolgreich aktualisiert',
        data: updatedPreferences
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ruft aktive Benutzersitzungen ab
   */
  static async getActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      // Aktive Sitzungen abrufen
      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          expiresAt: {
            gte: new Date()
          }
        },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true
        }
      });
      
      logger.info('Aktive Sitzungen abgerufen', { userId, sessionCount: sessions.length });
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Beendet eine bestimmte Benutzersitzung
   */
  static async terminateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;
      
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }
      
      if (!sessionId) {
        throw new ValidationError('Sitzungs-ID ist erforderlich');
      }
      
      // Sitzung beenden
      const deletedSession = await prisma.userSession.delete({
        where: {
          id: sessionId,
          userId
        }
      });
      
      logger.info('Benutzersitzung beendet', { userId, sessionId });
      
      res.json({
        success: true,
        message: 'Sitzung erfolgreich beendet'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Datensatz nicht gefunden
        return next(new ValidationError('Sitzung nicht gefunden'));
      }
      next(error);
    }
  }
}