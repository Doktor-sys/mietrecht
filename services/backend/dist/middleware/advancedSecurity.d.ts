import { Request, Response, NextFunction } from 'express';
export declare function advancedRateLimit(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function detectSuspiciousUserAgents(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function checkIPReputation(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function contentSecurity(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare const advancedSecurity: {
    rateLimit: typeof advancedRateLimit;
    userAgentDetection: typeof detectSuspiciousUserAgents;
    ipReputation: typeof checkIPReputation;
    contentSecurity: typeof contentSecurity;
};
