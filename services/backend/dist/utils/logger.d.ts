export declare const logger: any;
export declare const loggers: {
    httpRequest: (req: any, res: any, responseTime: number) => void;
    dbOperation: (operation: string, table: string, duration: number, success: boolean) => void;
    aiOperation: (operation: string, model: string, tokens: number, confidence: number) => void;
    securityEvent: (event: string, userId?: string, ip?: string, details?: any) => void;
    businessEvent: (event: string, userId: string, details?: any) => void;
};
export declare const logError: (error: Error, context?: any) => void;
