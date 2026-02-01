import { Request, Response, NextFunction } from 'express';
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
export declare const authenticateApiKey: (req: ApiKeyRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware zur Überprüfung spezifischer Berechtigungen
 */
export declare const requirePermission: (permission: string) => (req: ApiKeyRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware für Rate Limiting basierend auf API-Key
 */
export declare const apiKeyRateLimit: (req: ApiKeyRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware für Quota Management
 */
export declare const checkQuota: (req: ApiKeyRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware zum Aktualisieren der Quota nach erfolgreichem Request
 */
export declare const updateQuota: (req: ApiKeyRequest, res: Response, next: NextFunction) => Promise<void>;
