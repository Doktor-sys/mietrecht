/**
 * Decision Prediction Model
 *
 * This module implements machine learning models for predicting court decisions
 * based on case features and historical data.
 */
import { CaseData, PredictionResult } from '../types';
/**
 * Decision Prediction Model Class
 */
export declare class DecisionPredictionModel {
    private isTrained;
    private weights;
    private bias;
    /**
     * Initialize the model architecture
     */
    initializeModel(): void;
    /**
     * Preprocess the data for training
     */
    preprocessData(data: CaseData[]): {
        features: number[][];
        labels: number[];
    };
    /**
     * Sigmoid activation function
     */
    private sigmoid;
    /**
     * Train the model with provided data (simplified implementation)
     */
    train(data: CaseData[]): Promise<void>;
    /**
     * Predict decision outcome for new case data
     */
    predict(caseData: CaseData): Promise<PredictionResult>;
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
    evaluate(testData: CaseData[]): Promise<{
        loss: number;
        accuracy: number;
    }>;
}
//# sourceMappingURL=decisionPrediction.d.ts.map