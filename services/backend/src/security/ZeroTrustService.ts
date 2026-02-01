import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

// Importiere die benötigten Typen von Prisma
import { User } from '@prisma/client';

interface ZeroTrustContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: string;
  riskScore: number;
  permissions: string[];
}

// Definiere Interface für das User-Objekt mit den benötigten Feldern
interface ZeroTrustUser extends Pick<User, 'id'> {
  userType?: string;
  failedLoginAttempts?: number;
}

export class ZeroTrustService {
  private static instance: ZeroTrustService;
  private trustedDevices: Map<string, any>;
  private riskAssessmentRules: any[];

  private constructor() {
    this.trustedDevices = new Map();
    this.riskAssessmentRules = [
      { factor: 'user_behavior', weight: 0.5 },
      { factor: 'time_based', weight: 0.5 }
    ];
  }

  public static getInstance(): ZeroTrustService {
    if (!ZeroTrustService.instance) {
      ZeroTrustService.instance = new ZeroTrustService();
    }
    return ZeroTrustService.instance;
  }

  /**
   * Bewertet das Risiko eines Zugriffsversuchs
   */
  async assessRisk(context: ZeroTrustContext): Promise<number> {
    let riskScore = 0;
    
    // Verhaltensanalyse
    const behaviorRisk = await this.analyzeUserBehavior(context.userId, context);
    riskScore += behaviorRisk * this.riskAssessmentRules[0].weight;
    
    // Zeitbasierte Risikoprüfung
    const timeRisk = this.assessTimeBasedRisk();
    riskScore += timeRisk * this.riskAssessmentRules[1].weight;
    
    // Normalisierung auf 0-100
    riskScore = Math.min(Math.max(riskScore, 0), 100);
    
    logger.info(`Risk assessment for user ${context.userId}: ${riskScore}`);
    return riskScore;
  }

  /**
   * Analysiert das Nutzerverhalten
   */
  private async analyzeUserBehavior(userId: string, context: ZeroTrustContext): Promise<number> {
    try {
      // Hole Benutzerinformationen
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return 90; // Hohes Risiko bei unbekanntem Benutzer
      }
      
      // Prüfung auf ungewöhnliche Muster
      let anomalyScore = 0;
      
      // Ungewöhnliche Uhrzeit?
      const hour = new Date().getHours();
      if (hour >= 2 && hour <= 5) {
        anomalyScore += 20;
      }
      
      return Math.min(anomalyScore, 100);
    } catch (error) {
      logger.error('Error analyzing user behavior:', error);
      return 50; // Mittleres Risiko bei Fehler
    }
  }

  /**
   * Zeitbasierte Risikobewertung
   */
  private assessTimeBasedRisk(): number {
    const hour = new Date().getHours();
    
    // Nachtstunden (2-5 Uhr) haben höheres Risiko
    if (hour >= 2 && hour <= 5) {
      return 40;
    }
    
    // Frühe Morgenstunden (6-8 Uhr) normales Risiko
    if (hour >= 6 && hour <= 8) {
      return 20;
    }
    
    // Geschäftstage (9-17 Uhr) niedriges Risiko
    if (hour >= 9 && hour <= 17) {
      return 10;
    }
    
    // Abendstunden (18-24 Uhr) mittleres Risiko
    return 25;
  }

  /**
   * Middleware für Zero Trust Authentifizierung
   */
  zeroTrustMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extrahiere Token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authentication token provided'
          });
        }
        
        // Verifiziere Token
        const decoded: any = jwt.verify(token, config.jwt.secret);
        
        // Erstelle Zero Trust Context
        const context: ZeroTrustContext = {
          userId: decoded.userId,
          ipAddress: req.ip || req.connection.remoteAddress || '',
          userAgent: req.get('User-Agent') || '',
          deviceId: req.headers['x-device-id'] as string,
          location: req.headers['x-location'] as string,
          riskScore: 0,
          permissions: decoded.permissions || []
        };
        
        // Bewertet Risiko
        const riskScore = await this.assessRisk(context);
        context.riskScore = riskScore;
        
        // Blockiere bei hohem Risiko
        if (riskScore > 80) {
          logger.warn(`High risk access blocked for user ${decoded.userId}`, { riskScore });
          
          return res.status(403).json({
            error: 'Access Denied',
            message: 'Access blocked due to high risk score'
          });
        }
        
        // Warnung bei mittlerem Risiko
        if (riskScore > 50) {
          logger.warn(`Medium risk access for user ${decoded.userId}`, { riskScore });
        }
        
        // Füge Zero Trust Context zum Request hinzu
        (req as any).zeroTrustContext = context;
        
        next();
      } catch (error) {
        logger.error('Zero Trust authentication error:', error);
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid or expired token'
        });
      }
    };
  }
}