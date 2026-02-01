import { Request, Response, NextFunction } from 'express';
import { UserType } from '@prisma/client';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                userType: UserType;
                sessionId: string;
            };
        }
    }
}
/**
 * Middleware zur Authentifizierung von Requests
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware zur Autorisierung basierend auf Benutzertyp
 */
export declare const authorize: (...allowedUserTypes: UserType[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware zur Überprüfung ob Benutzer Admin-Rechte hat
 * Für Audit-Logs und andere administrative Funktionen
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware zur Überprüfung ob Benutzer verifiziert ist
 */
export declare const requireVerified: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware zur Überprüfung ob Benutzer Zugriff auf Ressource hat
 */
export declare const requireOwnership: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optionale Authentifizierung - setzt req.user wenn Token vorhanden
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate Limiting für authentifizierte Benutzer
 */
export declare const authenticatedRateLimit: (maxRequests?: number, windowMinutes?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware zur Überprüfung von API-Keys für B2B-Kunden
 */
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Kombinierte Authentifizierung: JWT oder API-Key
 */
export declare const authenticateFlexible: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
