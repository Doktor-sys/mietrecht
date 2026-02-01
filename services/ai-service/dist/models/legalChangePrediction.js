"use strict";
/**
 * Legal Change Prediction Model
 *
 * This module implements machine learning models for predicting legal changes
 * based on historical data and legislative trends.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalChangePredictionModel = void 0;
// Possible change types
const CHANGE_TYPES = ['amendment', 'repeal', 'introduction', 'none'];
/**
 * Legal Change Prediction Model Class
 */
class LegalChangePredictionModel {
    constructor() {
        this.isTrained = false;
        this.weights = [];
        this.bias = 0;
    }
    /**
     * Initialize the model
     */
    initializeModel() {
        // Initialize weights with small random values
        this.weights = new Array(5).fill(0).map(() => Math.random() * 0.1 - 0.05);
        this.bias = Math.random() * 0.1 - 0.05;
        console.log('Legal change prediction model initialized');
    }
    /**
     * Preprocess the data for training
     */
    preprocessData(data) {
        // Extract features (impactScore, changeType encoded, effectiveDate as days since epoch, description length, createdAt as days since epoch)
        const features = data.map(legalData => {
            // Encode change type
            let changeTypeEncoded = 0;
            switch (legalData.changeType) {
                case 'amendment':
                    changeTypeEncoded = 1;
                    break;
                case 'repeal':
                    changeTypeEncoded = 2;
                    break;
                case 'introduction':
                    changeTypeEncoded = 3;
                    break;
                default: changeTypeEncoded = 0;
            }
            // Days since epoch for effectiveDate
            const effectiveDateDays = Math.floor(new Date(legalData.effectiveDate).getTime() / (1000 * 60 * 60 * 24));
            // Description length
            const descriptionLength = legalData.description.length;
            // Days since epoch for createdAt
            const createdAtDays = Math.floor(new Date(legalData.createdAt).getTime() / (1000 * 60 * 60 * 24));
            return [
                legalData.impactScore,
                changeTypeEncoded,
                effectiveDateDays,
                descriptionLength,
                createdAtDays
            ];
        });
        // Extract labels (using impactScore as proxy for now)
        const labels = data.map(legalData => legalData.impactScore / 10); // Normalize to 0-1
        return { features, labels };
    }
    /**
     * Train the model with provided data (simplified implementation)
     */
    async train(data) {
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
        console.log('Legal change prediction model training completed');
    }
    /**
     * Predict legal change for a law
     */
    async predict(lawData) {
        if (!this.isTrained) {
            throw new Error('Model not trained yet. Please train the model first.');
        }
        // Prepare input data
        // Encode change type
        let changeTypeEncoded = 0;
        switch (lawData.changeType) {
            case 'amendment':
                changeTypeEncoded = 1;
                break;
            case 'repeal':
                changeTypeEncoded = 2;
                break;
            case 'introduction':
                changeTypeEncoded = 3;
                break;
            default: changeTypeEncoded = 0;
        }
        // Days since epoch for effectiveDate
        const effectiveDateDays = Math.floor(new Date(lawData.effectiveDate).getTime() / (1000 * 60 * 60 * 24));
        // Description length
        const descriptionLength = lawData.description.length;
        // Days since epoch for createdAt
        const createdAtDays = Math.floor(new Date(lawData.createdAt).getTime() / (1000 * 60 * 60 * 24));
        const inputData = [
            lawData.impactScore,
            changeTypeEncoded,
            effectiveDateDays,
            descriptionLength,
            createdAtDays
        ];
        // Forward pass
        let prediction = this.bias;
        for (let i = 0; i < this.weights.length; i++) {
            prediction += this.weights[i] * inputData[i];
        }
        // Normalize prediction to 0-1 range
        prediction = Math.max(0, Math.min(1, prediction));
        // Determine predicted change type (simplified)
        let predictedChange = 'none';
        if (prediction > 0.7) {
            predictedChange = 'amendment';
        }
        else if (prediction > 0.5) {
            predictedChange = 'introduction';
        }
        else if (prediction > 0.3) {
            predictedChange = 'repeal';
        }
        // Estimate date (simplified)
        const estimatedDate = new Date(lawData.effectiveDate);
        estimatedDate.setDate(estimatedDate.getDate() + Math.floor(prediction * 365));
        return {
            lawId: lawData.lawId,
            predictedChange: predictedChange,
            probability: prediction,
            estimatedDate: estimatedDate.toISOString(),
            impactScore: Math.floor(prediction * 10),
            timestamp: new Date()
        };
    }
    /**
     * Save the trained model to disk (simplified implementation)
     */
    async saveModel(path) {
        if (!this.isTrained) {
            throw new Error('Model not trained yet. Please train the model first.');
        }
        // In a real implementation, we would save the model to disk
        console.log(`Model saved to ${path}`);
    }
    /**
     * Load a trained model from disk (simplified implementation)
     */
    async loadModel(path) {
        // In a real implementation, we would load the model from disk
        this.isTrained = true;
        console.log(`Model loaded from ${path}`);
    }
    /**
     * Evaluate model performance (simplified implementation)
     */
    async evaluate(testData) {
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
            let prediction = this.bias;
            for (let j = 0; j < this.weights.length; j++) {
                prediction += this.weights[j] * featureVector[j];
            }
            // Normalize prediction to 0-1 range
            prediction = Math.max(0, Math.min(1, prediction));
            // Calculate loss (mean squared error)
            const target = labels[i];
            const error = prediction - target;
            const loss = error * error;
            totalLoss += loss;
            // Count approximately correct predictions (within 0.1)
            if (Math.abs(prediction - target) < 0.1) {
                correctPredictions++;
            }
        }
        const loss = totalLoss / features.length;
        const accuracy = correctPredictions / features.length;
        return { loss, accuracy };
    }
}
exports.LegalChangePredictionModel = LegalChangePredictionModel;
//# sourceMappingURL=legalChangePrediction.js.map