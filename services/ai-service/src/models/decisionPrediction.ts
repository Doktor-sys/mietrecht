/**
 * Decision Prediction Model
 * 
 * This module implements machine learning models for predicting court decisions
 * based on case features and historical data.
 */

import { CaseData, PredictionResult } from '../types';

// Model configuration
const MODEL_CONFIG = {
  learningRate: 0.001,
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2
};

// Feature definitions
const FEATURE_COLUMNS = [
  'caseType',
  'plaintiffType',
  'defendantType',
  'claimAmount',
  'contractDuration',
  'previousViolations',
  'region',
  'courtType'
];

const TARGET_COLUMN = 'decisionOutcome';

/**
 * Decision Prediction Model Class
 */
export class DecisionPredictionModel {
  private isTrained: boolean = false;
  private weights: number[] = [];
  private bias: number = 0;

  /**
   * Initialize the model architecture
   */
  initializeModel(): void {
    // Initialize weights with small random values
    this.weights = new Array(FEATURE_COLUMNS.length).fill(0).map(() => Math.random() * 0.1 - 0.05);
    this.bias = Math.random() * 0.1 - 0.05;
    console.log('Decision prediction model initialized');
  }

  /**
   * Preprocess the data for training
   */
  preprocessData(data: CaseData[]): { features: number[][], labels: number[] } {
    // Extract features
    const features = data.map(caseData => [
      caseData.caseType,
      caseData.plaintiffType,
      caseData.defendantType,
      caseData.claimAmount,
      caseData.contractDuration,
      caseData.previousViolations,
      caseData.region,
      caseData.courtType
    ]);

    // Extract labels
    const labels = data.map(caseData => caseData.decisionOutcome);

    return { features, labels };
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Train the model with provided data (simplified implementation)
   */
  async train(data: CaseData[]): Promise<void> {
    if (this.weights.length === 0) {
      this.initializeModel();
    }

    // Preprocess data
    const { features, labels } = this.preprocessData(data);

    // Simplified training using gradient descent
    const learningRate = 0.01;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      let correctPredictions = 0;

      for (let i = 0; i < features.length; i++) {
        // Forward pass
        const featureVector = features[i];
        let z = this.bias;
        for (let j = 0; j < this.weights.length; j++) {
          z += this.weights[j] * featureVector[j];
        }
        const prediction = this.sigmoid(z);

        // Calculate loss (binary cross-entropy)
        const target = labels[i];
        const loss = -target * Math.log(prediction) - (1 - target) * Math.log(1 - prediction);
        totalLoss += loss;

        // Backward pass (gradient descent)
        const error = prediction - target;
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] -= learningRate * error * featureVector[j];
        }
        this.bias -= learningRate * error;

        // Count correct predictions
        if ((prediction > 0.5 && target === 1) || (prediction <= 0.5 && target === 0)) {
          correctPredictions++;
        }
      }

      // Log progress every 20 epochs
      if (epoch % 20 === 0) {
        const accuracy = correctPredictions / features.length;
        console.log(`Epoch ${epoch}: loss = ${(totalLoss / features.length).toFixed(4)}, accuracy = ${accuracy.toFixed(4)}`);
      }
    }

    // Mark as trained
    this.isTrained = true;
    console.log('Decision prediction model training completed');
  }

  /**
   * Predict decision outcome for new case data
   */
  async predict(caseData: CaseData): Promise<PredictionResult> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Prepare input data
    const inputData = [
      caseData.caseType,
      caseData.plaintiffType,
      caseData.defendantType,
      caseData.claimAmount,
      caseData.contractDuration,
      caseData.previousViolations,
      caseData.region,
      caseData.courtType
    ];

    // Forward pass
    let z = this.bias;
    for (let i = 0; i < this.weights.length; i++) {
      z += this.weights[i] * inputData[i];
    }
    const probability = this.sigmoid(z);
    const predictedClass = probability > 0.5 ? 1 : 0;

    return {
      probability: probability,
      predictedClass: predictedClass,
      confidence: Math.abs(probability - 0.5) * 2, // Confidence as distance from 0.5
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
  async evaluate(testData: CaseData[]): Promise<{ loss: number, accuracy: number }> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Preprocess test data
    const { features, labels } = this.preprocessData(testData);

    let totalLoss = 0;
    let correctPredictions = 0;

    for (let i = 0; i < features.length; i++) {
      // Forward pass
      const featureVector = features[i];
      let z = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        z += this.weights[j] * featureVector[j];
      }
      const prediction = this.sigmoid(z);

      // Calculate loss (binary cross-entropy)
      const target = labels[i];
      const loss = -target * Math.log(prediction) - (1 - target) * Math.log(1 - prediction);
      totalLoss += loss;

      // Count correct predictions
      if ((prediction > 0.5 && target === 1) || (prediction <= 0.5 && target === 0)) {
        correctPredictions++;
      }
    }

    const loss = totalLoss / features.length;
    const accuracy = correctPredictions / features.length;

    return { loss, accuracy };
  }
}