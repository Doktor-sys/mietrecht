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
                deviceId?: string;
                scopes?: string[];
            };
        }
    }
}
/**
 * Advanced authentication middleware with device and IP tracking
 */
export declare const advancedAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enhanced authorization middleware with role-based access control
 */
export declare const advancedAuthorize: (...allowedUserTypes: UserType[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Advanced admin authorization middleware
 */
export declare const advancedRequireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enhanced verified user middleware
 */
export declare const advancedRequireVerified: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enhanced ownership verification middleware
 */
export declare const advancedRequireOwnership: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional advanced authentication - sets req.user if token is present
 */
export declare const advancedOptionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Advanced rate limiting for authenticated users
 */
export declare const advancedAuthenticatedRateLimit: (maxRequests?: number, windowMinutes?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enhanced API key authentication for B2B customers
 */
export declare const advancedAuthenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Combined authentication: JWT, API key, or device token
 */
export declare const advancedAuthenticateFlexible: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const advancedAuthenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
