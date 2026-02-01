import { Request, Response, NextFunction } from 'express';
declare class MonitoringController {
    /**
     * Record an API call for monitoring
     * @param endpoint - The API endpoint
     * @param duration - Duration of the call in milliseconds
     * @param success - Whether the call was successful
     */
    static recordApiCall(endpoint: string, duration: number, success: boolean): void;
    /**
     * Record ML processing for monitoring
     * @param functionName - The ML function name
     * @param duration - Duration of the processing in milliseconds
     * @param success - Whether the processing was successful
     */
    static recordMLProcessing(functionName: string, duration: number, success: boolean): void;
    /**
     * Get all monitoring metrics
     */
    static getMetrics(): {
        apiMetrics: Record<string, any>;
        mlMetrics: Record<string, any>;
        system: {
            memory: NodeJS.MemoryUsage;
            uptime: number;
        };
        lastUpdated: number;
    };
    /**
     * Get monitoring dashboard data
     */
    static getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate alerts based on metrics
     * @param metrics - The current metrics
     */
    static generateAlerts(metrics: any): never[];
    /**
     * Reset all metrics
     */
    static resetMetrics(req: Request, res: Response, next: NextFunction): void;
}
export default MonitoringController;
