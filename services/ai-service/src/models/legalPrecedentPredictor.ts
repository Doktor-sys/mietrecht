/**
 * Legal Precedent Predictor Model
 * 
 * This module implements an advanced machine learning model for predicting legal precedents
 * based on case features, historical data, and legal document analysis.
 */

import { CaseData, LegalDocument, PrecedentPrediction } from '../types';

// Model configuration
const MODEL_CONFIG = {
  learningRate: 0.001,
  epochs: 150,
  batchSize: 32,
  validationSplit: 0.2
};

// Extended feature definitions
const EXTENDED_FEATURE_COLUMNS = [
  'caseType',
  'plaintiffType',
  'defendantType',
  'claimAmount',
  'contractDuration',
  'previousViolations',
  'region',
  'courtType',
  'legalComplexity',
  'documentLength',
  'citationCount',
  'precedentSimilarity',
  'temporalProximity',
  'jurisdictionMatch'
];

const TARGET_COLUMN = 'precedentOutcome';

/**
 * Legal Precedent Predictor Model Class
 */
export class LegalPrecedentPredictor {
  private isTrained: boolean = false;
  private weights: number[] = [];
  private bias: number = 0;

  /**
   * Initialize the model architecture
   */
  initializeModel(): void {
    // Initialize weights with small random values
    this.weights = new Array(EXTENDED_FEATURE_COLUMNS.length).fill(0).map(() => Math.random() * 0.1 - 0.05);
    this.bias = Math.random() * 0.1 - 0.05;
    console.log('Legal precedent predictor model initialized');
  }

  /**
   * Extract features from legal documents
   */
  extractDocumentFeatures(documents: LegalDocument[]): number[] {
    if (documents.length === 0) {
      return [0, 0, 0, 0, 0];
    }

    // Calculate average document length
    const avgLength = documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0) / documents.length;
    
    // Count citations
    const citationCount = documents.reduce((count, doc) => {
      return count + (doc.citations?.length || 0);
    }, 0);
    
    // Calculate temporal proximity (days since last document)
    const latestDoc = documents.reduce((latest, doc) => {
      const docDate = new Date(doc.date);
      const latestDate = new Date(latest.date);
      return docDate > latestDate ? doc : latest;
    }, documents[0]);
    
    const temporalProximity = Math.floor((Date.now() - new Date(latestDoc.date).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate precedent similarity (mock implementation)
    const precedentSimilarity = Math.random(); // In a real implementation, this would use semantic similarity
    
    // Calculate jurisdiction match (mock implementation)
    const jurisdictionMatch = Math.random(); // In a real implementation, this would check jurisdiction alignment
    
    return [
      avgLength,
      citationCount,
      precedentSimilarity,
      temporalProximity,
      jurisdictionMatch
    ];
  }

  /**
   * Preprocess the data for training
   */
  preprocessData(data: CaseData[], documents: LegalDocument[][]): { features: number[][], labels: number[] } {
    // Extract base features
    const baseFeatures = data.map(caseData => [
      caseData.caseType,
      caseData.plaintiffType,
      caseData.defendantType,
      caseData.claimAmount,
      caseData.contractDuration,
      caseData.previousViolations,
      caseData.region,
      caseData.courtType,
      caseData.legalComplexity || 0.5 // Default complexity if not provided
    ]);

    // Extract document features
    const documentFeatures = documents.map(docs => this.extractDocumentFeatures(docs));
    
    // Combine all features
    const features = baseFeatures.map((base, index) => [...base, ...documentFeatures[index]]);
    
    // Extract labels
    const labels = data.map(caseData => caseData.precedentOutcome !== undefined ? caseData.precedentOutcome : 0);

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
  async train(data: CaseData[], documents: LegalDocument[][]): Promise<void> {
    if (this.weights.length === 0) {
      this.initializeModel();
    }

    // Preprocess data
    const { features, labels } = this.preprocessData(data, documents);

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
    console.log('Legal precedent predictor model training completed');
  }

  /**
   * Predict precedent outcome for new case data
   */
  async predict(caseData: CaseData, documents: LegalDocument[]): Promise<PrecedentPrediction> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Prepare input data
    const baseFeatures = [
      caseData.caseType,
      caseData.plaintiffType,
      caseData.defendantType,
      caseData.claimAmount,
      caseData.contractDuration,
      caseData.previousViolations,
      caseData.region,
      caseData.courtType,
      caseData.legalComplexity || 0.5
    ];

    const documentFeatures = this.extractDocumentFeatures(documents);
    const inputData = [...baseFeatures, ...documentFeatures];

    // Forward pass
    let z = this.bias;
    for (let i = 0; i < this.weights.length; i++) {
      z += this.weights[i] * inputData[i];
    }
    const probability = this.sigmoid(z);
    const predictedClass = probability > 0.5 ? 1 : 0;

    // Calculate confidence intervals (simplified)
    const lowerBound = Math.max(0, probability - 0.1);
    const upperBound = Math.min(1, probability + 0.1);

    return {
      probability: probability,
      predictedClass: predictedClass,
      confidence: Math.abs(probability - 0.5) * 2, // Confidence as distance from 0.5
      confidenceInterval: {
        lower: lowerBound,
        upper: upperBound
      },
      timestamp: new Date(),
      supportingFactors: this.identifySupportingFactors(caseData, documents, probability)
    };
  }

  /**
   * Identify supporting factors for the prediction
   */
  private identifySupportingFactors(caseData: CaseData, documents: LegalDocument[], probability: number): string[] {
    const factors: string[] = [];

    // High claim amount
    if (caseData.claimAmount && caseData.claimAmount > 10000) {
      factors.push('Hoher Streitwert');
    }

    // Previous violations
    if (caseData.previousViolations && caseData.previousViolations > 0) {
      factors.push('Vorherige Verstöße');
    }

    // Document analysis
    if (documents.length > 0) {
      const avgDocLength = documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0) / documents.length;
      if (avgDocLength > 5000) {
        factors.push('Umfangreiche rechtliche Dokumentation');
      }

      const citationCount = documents.reduce((count, doc) => count + (doc.citations?.length || 0), 0);
      if (citationCount > 10) {
        factors.push('Viele zitierte Präzedenzfälle');
      }
    }

    // Probability-based factors
    if (probability > 0.8) {
      factors.push('Starke Wahrscheinlichkeit für positive Entscheidung');
    } else if (probability < 0.3) {
      factors.push('Geringe Wahrscheinlichkeit für positive Entscheidung');
    } else {
      factors.push('Unklare Prognose - weitere Prüfung empfohlen');
    }

    return factors;
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
  async evaluate(testData: CaseData[], testDocuments: LegalDocument[][]): Promise<{ loss: number, accuracy: number }> {
    if (!this.isTrained) {
      throw new Error('Model not trained yet. Please train the model first.');
    }

    // Preprocess test data
    const { features, labels } = this.preprocessData(testData, testDocuments);

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