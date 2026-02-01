import { Request, Response, NextFunction } from 'express';
declare class RiskAssessmentController {
    /**
     * Assess risk for a document with monitoring and caching
     */
    static assessDocumentRisk(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Assess risk for a case with monitoring and caching
     */
    static assessCaseRisk(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Assess enhanced risk for a document with monitoring and caching
     */
    static assessEnhancedDocumentRisk(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Assess enhanced risk for a case with monitoring, caching and async job processing
     */
    static assessEnhancedCaseRisk(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get the status of an ML job
     */
    static getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default RiskAssessmentController;
