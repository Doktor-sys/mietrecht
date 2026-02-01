import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface RegisterRequest {
  email: string;
  password: string;
  userType: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthController {
  /**
   * Registriert einen neuen Benutzer
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, userType } = req.body as RegisterRequest;
      
      // Validierung der Eingabedaten
      if (!email || !password || !userType) {
        throw new ValidationError('Email, Passwort und Benutzertyp sind erforderlich');
      }
      
      // Überprüfung, ob der Benutzer bereits existiert
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new ValidationError('Ein Benutzer mit dieser E-Mail existiert bereits');
      }
      
      // Passwort hashen
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Benutzer erstellen
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          userType,
          isVerified: false,
          isActive: true
        }
      });
      
      // Verifizierungstoken generieren
      const verificationToken = uuidv4();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profile: {
            create: {
              firstName: '',
              lastName: '',
              language: 'de'
            }
          },
          preferences: {
            create: {
              notifications: {
                email: true,
                push: true,
                sms: false
              },
              privacy: {
                dataSharing: false,
                analytics: true,
                marketing: false
              }
            }
          }
        }
      });
      
      // TODO: E-Mail mit Verifizierungslink senden
      
      logger.info('Neuer Benutzer registriert', { userId: user.id, email });
      
      res.status(201).json({
        success: true,
        message: 'Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mail für die Verifizierung.',
        data: {
          userId: user.id,
          email: user.email,
          userType: user.userType
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Authentifiziert einen Benutzer
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as LoginRequest;
      
      // Validierung der Eingabedaten
      if (!email || !password) {
        throw new ValidationError('Email und Passwort sind erforderlich');
      }
      
      // Benutzer suchen
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          preferences: true
        }
      });
      
      if (!user) {
        throw new AuthenticationError('Ungültige Anmeldedaten');
      }
      
      // Überprüfung, ob der Benutzer aktiv ist
      if (!user.isActive) {
        throw new AuthenticationError('Benutzerkonto ist deaktiviert');
      }
      
      // Passwort überprüfen
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Ungültige Anmeldedaten');
      }
      
      // JWT-Token generieren
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          userType: user.userType
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '15m' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Refresh-Token in der Datenbank speichern
      await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
        }
      });
      
      // Letzten Login aktualisieren
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      
      logger.info('Benutzer erfolgreich angemeldet', { userId: user.id, email });
      
      res.json({
        success: true,
        message: 'Authentifizierung erfolgreich',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            userType: user.userType,
            profile: user.profile,
            preferences: user.preferences
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Erneuert ein abgelaufenes JWT-Token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ValidationError('Refresh-Token ist erforderlich');
      }
      
      // Refresh-Token überprüfen
      const session = await prisma.userSession.findUnique({
        where: { sessionToken: refreshToken }
      });
      
      if (!session || session.expiresAt < new Date()) {
        throw new AuthenticationError('Ungültiges oder abgelaufenes Refresh-Token');
      }
      
      // Benutzer abrufen
      const user = await prisma.user.findUnique({
        where: { id: session.userId }
      });
      
      if (!user || !user.isActive) {
        throw new AuthenticationError('Benutzer nicht gefunden oder deaktiviert');
      }
      
      // Neue JWT-Token generieren
      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          userType: user.userType
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '15m' }
      );
      
      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Altes Refresh-Token löschen
      await prisma.userSession.delete({
        where: { sessionToken: refreshToken }
      });
      
      // Neues Refresh-Token speichern
      await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
        }
      });
      
      logger.info('Token erfolgreich erneuert', { userId: user.id });
      
      res.json({
        success: true,
        message: 'Token erfolgreich erneuert',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Fordert einen Passwort-Zurücksetzen-Link an
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ValidationError('E-Mail ist erforderlich');
      }
      
      // Benutzer suchen
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        // Aus Sicherheitsgründen keine Fehlermeldung, dass der Benutzer nicht existiert
        return res.json({
          success: true,
          message: 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein Zurücksetzen-Link gesendet.'
        });
      }
      
      // Passwort-Zurücksetzen-Token generieren
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 Stunde
      
      // Token in der Datenbank speichern
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });
      
      // TODO: E-Mail mit Zurücksetzen-Link senden
      
      logger.info('Passwort-Zurücksetzen-Anfrage', { userId: user.id, email });
      
      res.json({
        success: true,
        message: 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein Zurücksetzen-Link gesendet.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Setzt das Passwort mit einem Token zurück
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new ValidationError('Token und neues Passwort sind erforderlich');
      }
      
      // Benutzer mit gültigem Reset-Token suchen
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gte: new Date()
          }
        }
      });
      
      if (!user) {
        throw new ValidationError('Ungültiges oder abgelaufenes Zurücksetzen-Token');
      }
      
      // Neues Passwort hashen
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Passwort aktualisieren und Reset-Token löschen
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      
      // Alle aktiven Sitzungen des Benutzers beenden
      await prisma.userSession.deleteMany({
        where: { userId: user.id }
      });
      
      logger.info('Passwort erfolgreich zurückgesetzt', { userId: user.id });
      
      res.json({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verifiziert die E-Mail-Adresse eines Benutzers
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      
      if (!token) {
        throw new ValidationError('Verifizierungstoken ist erforderlich');
      }
      
      // Benutzer mit Verifizierungstoken suchen
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          isVerified: false
        }
      });
      
      if (!user) {
        throw new ValidationError('Ungültiges Verifizierungstoken');
      }
      
      // E-Mail als verifiziert markieren
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null
        }
      });
      
      logger.info('E-Mail erfolgreich verifiziert', { userId: user.id });
      
      res.json({
        success: true,
        message: 'E-Mail erfolgreich verifiziert. Ihr Konto ist jetzt vollständig aktiv.'
      });
    } catch (error) {
      next(error);
    }
  }
}