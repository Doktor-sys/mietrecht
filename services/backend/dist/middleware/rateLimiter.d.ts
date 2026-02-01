import { Request, Response, NextFunction } from 'express';
interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare const RATE_LIMIT_CONFIGS: {
    API_DEFAULT: {
        windowMs: number;
        max: number;
    };
    API_STRICT: {
        windowMs: number;
        max: number;
    };
    AUTH_LOGIN: {
        windowMs: number;
        max: number;
    };
    AUTH_REGISTER: {
        windowMs: number;
        max: number;
    };
    ML_DOCUMENT_ANALYSIS: {
        windowMs: number;
        max: number;
    };
    ML_RISK_ASSESSMENT: {
        windowMs: number;
        max: number;
    };
    ML_RECOMMENDATIONS: {
        windowMs: number;
        max: number;
    };
    ML_NLP_PROCESSING: {
        windowMs: number;
        max: number;
    };
    CHAT_MESSAGES: {
        windowMs: number;
        max: number;
    };
    DOCUMENT_UPLOAD: {
        windowMs: number;
        max: number;
    };
};
export declare const rateLimiter: (config: RateLimitConfig) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const roleBasedRateLimiter: (roleLimits: Record<string, RateLimitConfig>) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const getRateLimitInfo: (req: Request, res: Response, next: NextFunction) => void;
export declare const resetRateLimit: (clientId: string, path: string) => void;
export declare const getAllRateLimits: () => Record<string, {
    count: number;
    resetTime: number;
}>;
export default rateLimiter;
