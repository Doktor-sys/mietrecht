/**
 * Legal Change Prediction Model
 *
 * This module implements machine learning models for predicting legal changes
 * based on historical data and legislative trends.
 */
import { LegalChangeData, LegalChangePrediction } from '../types';
/**
 * Legal Change Prediction Model Class
 */
export declare class LegalChangePredictionModel {
    private isTrained;
    private weights;
    private bias;
    /**
     * Initialize the model
     */
    initializeModel(): void;
    /**
     * Preprocess the data for training
     */
    preprocessData(data: LegalChangeData[]): {
        features: number[][];
        labels: number[];
    };
    /**
     * Train the model with provided data (simplified implementation)
     */
    train(data: LegalChangeData[]): Promise<void>;
    /**
     * Predict legal change for a law
     */
    predict(lawData: LegalChangeData): Promise<LegalChangePrediction>;
    /**
     * Save the trained model to disk (simplified implementation)
     */
    saveModel(path: string): Promise<void>;
    /**
     * Load a trained model from disk (simplified implementation)
     */
    loadModel(path: string): Promise<void>;
    /**
     * Evaluate model performance (simplified implementation)
     */
    evaluate(testData: LegalChangeData[]): Promise<{
        loss: number;
        accuracy: number;
    }>;
}
//# sourceMappingURL=legalChangePrediction.d.ts.map