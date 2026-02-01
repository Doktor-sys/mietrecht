export declare class AIProcessingError extends Error {
    readonly errorCode: string;
    readonly details?: any | undefined;
    constructor(message: string, errorCode: string, details?: any | undefined);
}
export declare class ModelLoadingError extends AIProcessingError {
    constructor(modelName: string, details?: any);
}
export declare class PredictionError extends AIProcessingError {
    constructor(modelName: string, details?: any);
}
export declare class DataProcessingError extends AIProcessingError {
    constructor(details?: any);
}
export declare class AIErrorHandler {
    static logAIError(error: Error, context: {
        userId?: string;
        processType: string;
        modelName?: string;
        inputData?: any;
        timestamp: Date;
    }): void;
    static handleAIError(error: Error, context: {
        userId?: string;
        processType: string;
        modelName?: string;
        inputData?: any;
    }): {
        shouldRetry: boolean;
        retryDelay?: number;
        userMessage: string;
    };
    static notifyAdmins(error: Error, context: {
        userId?: string;
        processType: string;
        modelName?: string;
        timestamp: Date;
    }): void;
    static generateErrorReport(error: Error, context: {
        userId?: string;
        processType: string;
        modelName?: string;
        inputData?: any;
        timestamp: Date;
    }): string;
}
export default AIErrorHandler;
