/**
 * Rent Price Prediction Model
 *
 * This module implements machine learning models for predicting rent prices
 * based on property features and historical data.
 */
import { RentPriceData, RentPricePrediction } from '../types';
/**
 * Rent Price Prediction Model Class
 */
export declare class RentPricePredictionModel {
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
    preprocessData(data: RentPriceData[]): {
        features: number[][];
        labels: number[];
    };
    /**
     * Train the model with provided data (simplified implementation)
     */
    train(data: RentPriceData[]): Promise<void>;
    /**
     * Predict rent price for new property data
     */
    predict(propertyData: RentPriceData): Promise<RentPricePrediction>;
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
    evaluate(testData: RentPriceData[]): Promise<{
        loss: number;
        mae: number;
        mape: number;
    }>;
}
//# sourceMappingURL=rentPricePrediction.d.ts.map