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
export class RentPricePredictionModel {
  private isTrained: boolean = false;
  private weights: number[] = [];
  private bias: number = 0;

  /**
   * Initialize the model
   */
  initializeModel(): void {
    // Initialize weights with small random values
    this.weights = [Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05];
    this.bias = Math.random() * 0.1 - 0.05;
    console.log('Rent price prediction model initialized');
  }

  /**
   * Preprocess the data for training
   */
  preprocessData(data: RentPriceData[]): { features: number[][], labels: number[] } {
    // Extract features (size, year, region encoded as number)
    const features = data.map(rentData => [
      rentData.size,
      rentData.year,
      rentData.region.charCodeAt(0) // Simple encoding of region
    ]);

    // Extract labels (price)
    const labels = data.map(rentData => rentData.price);

    return { features, labels };
  }

  /**
   * Train the model with provided data (simplified implementation)
   */
  async train(data: RentPriceData[]): Promise<void> {
    if (this.weights.length === 0) {
      this.initializeModel();
    }

    // Preprocess data
    const { features, labels } = this.preprocessData(data);

    // Simplified training using gradient descent
    const learningRate = 0.0001;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;

      for (let i = 0; i < features.length; i++) {
        // Forward pass
        const featureVector = features[i];
        let prediction = this.bias;
        for (let j = 0; j < this.weights.length; j++) {
          prediction += this.weights[j] * featureVector[j];
        }

        // Calculate loss (mean squared error)
        const target = labels[i];
        const error = prediction - target;
        const loss = error * error;
        totalLoss += loss;

        // Backward pass (gradient descent)
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] -= learningRate * 2 * error * featureVector[j];
        }
        this.bias -= learningRate * 2 * error;
      }

      // Log progress every 20 epochs
      if (epoch % 20 === 0) {
        console.log(`Epoch ${epoch}: loss = ${(totalLoss / features.length).toFixed(4)}`);
      }
    }

    // Mark as trained
    this.isTrained = true;
    console.log('Rent price prediction model training completed');
  }

  /**
   * Predict rent price for new property data
   */
  async predict(propertyData: RentPriceData): Promise<RentPricePrediction> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Prepare input data
    const inputData = [
      propertyData.size,
      propertyData.year,
      propertyData.region.charCodeAt(0) // Simple encoding of region
    ];

    // Forward pass
    let predictedPrice = this.bias;
    for (let i = 0; i < this.weights.length; i++) {
      predictedPrice += this.weights[i] * inputData[i];
    }

    // Calculate confidence interval (simplified)
    const lower = predictedPrice * 0.9;
    const upper = predictedPrice * 1.1;

    // Determine trend (simplified)
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (predictedPrice > 100) {
      trend = 'increasing';
    } else if (predictedPrice < 50) {
      trend = 'decreasing';
    }

    return {
      predictedPrice: predictedPrice,
      confidenceInterval: {
        lower: lower,
        upper: upper
      },
      trend: trend,
      timestamp: new Date()
    };
  }

  /**
   * Save the trained model to disk (simplified implementation)
   */
  async saveModel(path: string): Promise<void> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // In a real implementation, we would save the model to disk
    console.log(`Model saved to ${path}`);
  }

  /**
   * Load a trained model from disk (simplified implementation)
   */
  async loadModel(path: string): Promise<void> {
    // In a real implementation, we would load the model from disk
    this.isTrained = true;
    console.log(`Model loaded from ${path}`);
  }

  /**
   * Evaluate model performance (simplified implementation)
   */
  async evaluate(testData: RentPriceData[]): Promise<{ loss: number, mae: number, mape: number }> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Preprocess test data
    const { features, labels } = this.preprocessData(testData);

    let totalLoss = 0;
    let totalAbsoluteError = 0;
    let totalAbsolutePercentageError = 0;

    for (let i = 0; i < features.length; i++) {
      // Forward pass
      const featureVector = features[i];
      let prediction = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        prediction += this.weights[j] * featureVector[j];
      }

      // Calculate metrics
      const target = labels[i];
      const error = prediction - target;
      const loss = error * error;
      totalLoss += loss;
      totalAbsoluteError += Math.abs(error);
      totalAbsolutePercentageError += Math.abs((error / target) * 100);
    }

    const loss = totalLoss / features.length;
    const mae = totalAbsoluteError / features.length;
    const mape = totalAbsolutePercentageError / features.length;

    return { loss, mae, mape };
  }
}