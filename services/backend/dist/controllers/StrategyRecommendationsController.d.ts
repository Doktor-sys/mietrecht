import { Request, Response, NextFunction } from 'express';
export declare class StrategyRecommendationsController {
    /**
     * Generate recommendations for a document
     */
    static generateDocumentRecommendations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate recommendations for a case
     */
    static generateCaseRecommendations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate enhanced recommendations for a document
     */
    static generateEnhancedDocumentRecommendations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate enhanced recommendations for a case
     */
    static generateEnhancedCaseRecommendations(req: Request, res: Response, next: NextFunction): Promise<void>;
}
