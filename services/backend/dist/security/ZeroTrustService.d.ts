import { Request, Response, NextFunction } from 'express';
interface ZeroTrustContext {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    location?: string;
    riskScore: number;
    permissions: string[];
}
export declare class ZeroTrustService {
    private static instance;
    private trustedDevices;
    private riskAssessmentRules;
    private constructor();
    static getInstance(): ZeroTrustService;
    /**
     * Bewertet das Risiko eines Zugriffsversuchs
     */
    assessRisk(context: ZeroTrustContext): Promise<number>;
    /**
     * Analysiert das Nutzerverhalten
     */
    private analyzeUserBehavior;
    /**
     * Zeitbasierte Risikobewertung
     */
    private assessTimeBasedRisk;
    /**
     * Middleware für Zero Trust Authentifizierung
     */
    zeroTrustMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
export {};
