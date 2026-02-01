import { Request, Response, NextFunction } from 'express';
declare class StrategyRecommendationController {
    /**
     * Generate basic strategy recommendations with error handling and caching
     */
    static generateBasicRecommendations(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Generate enhanced strategy recommendations with error handling and caching
     */
    static generateEnhancedRecommendations(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Generate personalized strategy recommendations with error handling and caching
     */
    static generatePersonalizedRecommendations(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get the status of an ML job
     */
    static getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default StrategyRecommendationController;
