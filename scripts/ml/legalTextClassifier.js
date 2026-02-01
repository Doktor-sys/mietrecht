/**
 * Legal Text Classifier using TensorFlow.js and PyTorch
 * This module provides legal document classification capabilities using machine learning.
 */

// Import TensorFlow.js
const tf = require('@tensorflow/tfjs-node');

// Import NLP utilities
const { extractTopics, extractEntities } = require('../nlp/enhancedNLPProcessor.js');

// Import child process for PyTorch integration
const { spawn } = require('child_process');
const fs = require('fs');

/**
 * Legal Text Classifier Class
 */
class LegalTextClassifier {
  constructor() {
    this.model = null;
    this.vocabulary = [];
    this.labels = [];
    this.isTrained = false;
    this.pytorchModelPath = './models/legal_classifier_pytorch.pth';
    this.tensorflowModelPath = './models/tfjs_model';
  }

  /**
   * Preprocess text for classification
   * @param {String} text - Input text to preprocess
   * @returns {Array} Preprocessed text tokens
   */
  preprocessText(text) {
    // Convert to lowercase
    let processedText = text.toLowerCase();
    
    // Remove special characters but keep German umlauts
    processedText = processedText.replace(/[^a-zäöüß\s]/g, '');
    
    // Split into tokens
    const tokens = processedText.split(/\s+/).filter(token => token.length > 2);
    
    return tokens;
  }

  /**
   * Create vocabulary from training data
   * @param {Array} documents - Array of training documents
   * @returns {Array} Vocabulary array
   */
  createVocabulary(documents) {
    const vocabulary = new Set();
    
    documents.forEach(doc => {
      const tokens = this.preprocessText(doc.text);
      tokens.forEach(token => vocabulary.add(token));
    });
    
    // Convert to array and sort
    this.vocabulary = Array.from(vocabulary).sort();
    return this.vocabulary;
  }

  /**
   * Convert text to vector representation
   * @param {String} text - Input text
   * @returns {Array} Vector representation
   */
  textToVector(text) {
    const tokens = this.preprocessText(text);
    const vector = new Array(this.vocabulary.length).fill(0);
    
    tokens.forEach(token => {
      const index = this.vocabulary.indexOf(token);
      if (index !== -1) {
        vector[index] += 1;
      }
    });
    
    return vector;
  }

  /**
   * Create model architecture
   * @param {Number} vocabSize - Size of vocabulary
   * @param {Number} numClasses - Number of classification classes
   * @returns {Object} TensorFlow model
   */
  createModel(vocabSize, numClasses) {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [vocabSize],
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Train the classifier
   * @param {Array} trainingData - Array of {text, label} objects
   * @param {String} framework - ML framework to use ('tensorflow' or 'pytorch')
   * @returns {Promise<Object>} Training results
   */
  async train(trainingData, framework = 'tensorflow') {
    if (framework === 'pytorch') {
      return await this.trainPyTorch(trainingData);
    } else {
      return await this.trainTensorFlow(trainingData);
    }
  }

  /**
   * Train the classifier using TensorFlow.js
   * @param {Array} trainingData - Array of {text, label} objects
   * @returns {Promise<Object>} Training results
   */
  async trainTensorFlow(trainingData) {
    try {
      // Create vocabulary
      this.createVocabulary(trainingData);
      
      // Extract unique labels
      this.labels = [...new Set(trainingData.map(item => item.label))];
      
      // Convert texts to vectors
      const vectors = trainingData.map(item => this.textToVector(item.text));
      
      // Convert labels to one-hot encoding
      const labelIndices = trainingData.map(item => this.labels.indexOf(item.label));
      const oneHotLabels = tf.oneHot(labelIndices, this.labels.length);
      
      // Convert vectors to tensor
      const xs = tf.tensor2d(vectors);
      const ys = oneHotLabels;
      
      // Create model
      this.model = this.createModel(this.vocabulary.length, this.labels.length);
      
      // Train model
      const history = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });
      
      // Mark as trained
      this.isTrained = true;
      
      // Clean up tensors
      xs.dispose();
      ys.dispose();
      oneHotLabels.dispose();
      
      return {
        success: true,
        framework: 'tensorflow',
        epochs: history.history.loss.length,
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalAccuracy: history.history.acc ? history.history.acc[history.history.acc.length - 1] : null
      };
    } catch (error) {
      console.error('Error training legal text classifier:', error);
      throw error;
    }
  }

  /**
   * Train the classifier using PyTorch
   * @param {Array} trainingData - Array of {text, label} objects
   * @returns {Promise<Object>} Training results
   */
  async trainPyTorch(trainingData) {
    return new Promise((resolve, reject) => {
      try {
        // Create models directory if it doesn't exist
        if (!fs.existsSync('./models')) {
          fs.mkdirSync('./models', { recursive: true });
        }
        
        // Write training data to file
        const trainingDataPath = './models/training_data.json';
        fs.writeFileSync(trainingDataPath, JSON.stringify(trainingData, null, 2));
        
        // Spawn Python process to train the model
        const pythonProcess = spawn('python', [
          './ml/pytorchLegalClassifier.py'
        ]);
        
        let stdoutData = '';
        let stderrData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
          console.log(`PyTorch stdout: ${data}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
          console.error(`PyTorch stderr: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve({
              success: true,
              framework: 'pytorch',
              message: 'PyTorch model trained successfully',
              output: stdoutData
            });
          } else {
            reject(new Error(`PyTorch training failed with code ${code}: ${stderrData}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start PyTorch process: ${error.message}`));
        });
      } catch (error) {
        reject(new Error(`Error training PyTorch model: ${error.message}`));
      }
    });
  }

  /**
   * Classify a legal document
   * @param {String} text - Legal document text to classify
   * @param {String} framework - ML framework to use ('tensorflow' or 'pytorch')
   * @returns {Promise<Object>} Classification results
   */
  async classify(text, framework = 'tensorflow') {
    if (framework === 'pytorch') {
      return await this.classifyWithPyTorch(text);
    } else {
      return await this.classifyWithTensorFlow(text);
    }
  }

  /**
   * Classify a legal document using TensorFlow.js
   * @param {String} text - Legal document text to classify
   * @returns {Promise<Object>} Classification results
   */
  async classifyWithTensorFlow(text) {
    if (!this.isTrained || !this.model) {
      throw new Error('Model not trained yet. Please train the classifier first.');
    }

    try {
      // Convert text to vector
      const vector = this.textToVector(text);
      
      // Convert to tensor
      const xs = tf.tensor2d([vector]);
      
      // Make prediction
      const predictions = this.model.predict(xs);
      const probabilities = await predictions.data();
      
      // Clean up tensor
      xs.dispose();
      predictions.dispose();
      
      // Find best prediction
      let maxProb = 0;
      let bestLabelIndex = 0;
      
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          bestLabelIndex = i;
        }
      }
      
      // Get confidence and label
      const confidence = maxProb;
      const predictedLabel = this.labels[bestLabelIndex];
      
      // Get top 3 predictions
      const predictionScores = probabilities.map((prob, index) => ({
        label: this.labels[index],
        probability: prob
      }));
      
      const topPredictions = predictionScores
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);
      
      return {
        predictedLabel,
        confidence,
        topPredictions,
        framework: 'tensorflow',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error classifying legal text:', error);
      throw error;
    }
  }

  /**
   * Classify a legal document using PyTorch
   * @param {String} text - Legal document text to classify
   * @returns {Promise<Object>} Classification results
   */
  async classifyWithPyTorch(text) {
    return new Promise((resolve, reject) => {
      try {
        // Check if PyTorch model exists
        if (!fs.existsSync(this.pytorchModelPath)) {
          throw new Error('PyTorch model not found. Please train the model first.');
        }
        
        // Write text to file for classification
        const textData = { text: text };
        const textPath = './models/classify_text.json';
        fs.writeFileSync(textPath, JSON.stringify(textData, null, 2));
        
        // Create a simple Python script for classification
        const pythonScript = `
import torch
import json
import sys
import os

# Add the ml directory to the path
sys.path.append('./ml')

# Import the classifier
from pytorchLegalClassifier import load_model, classify_text

try:
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load model
    model, vocab, label_to_idx = load_model('${this.pytorchModelPath}', device)
    
    # Read text to classify
    with open('./models/classify_text.json', 'r') as f:
        data = json.load(f)
    
    text = data['text']
    
    # Classify text
    predicted_label, confidence = classify_text(model, vocab, label_to_idx, text, device)
    
    # Create result
    result = {
        'predictedLabel': predicted_label,
        'confidence': float(confidence),
        'framework': 'pytorch',
        'timestamp': __import__('datetime').datetime.now().isoformat()
    }
    
    print(json.dumps(result))
    
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
        `;
        
        // Write the Python script to a file
        const scriptPath = './models/classify_script.py';
        fs.writeFileSync(scriptPath, pythonScript);
        
        // Spawn Python process to classify the text
        const pythonProcess = spawn('python', [scriptPath]);
        
        let stdoutData = '';
        let stderrData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
          console.error(`PyTorch classification stderr: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdoutData.trim());
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Failed to parse PyTorch classification result: ${parseError.message}`));
            }
          } else {
            reject(new Error(`PyTorch classification failed with code ${code}: ${stderrData}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start PyTorch classification process: ${error.message}`));
        });
      } catch (error) {
        reject(new Error(`Error classifying with PyTorch: ${error.message}`));
      }
    });
  }

  /**
   * Save model to file
   * @param {String} path - Path to save model
   * @param {String} framework - ML framework to use ('tensorflow' or 'pytorch')
   * @returns {Promise<void>}
   */
  async saveModel(path, framework = 'tensorflow') {
    if (framework === 'pytorch') {
      // For PyTorch, the model is already saved by the training script
      return;
    } else {
      return await this.saveTensorFlowModel(path);
    }
  }

  /**
   * Save TensorFlow model to file
   * @param {String} path - Path to save model
   * @returns {Promise<void>}
   */
  async saveTensorFlowModel(path) {
    if (!this.isTrained || !this.model) {
      throw new Error('Model not trained yet. Please train the classifier first.');
    }
    
    try {
      await this.model.save(`file://${path}`);
      
      // Save vocabulary and labels
      const metadata = {
        vocabulary: this.vocabulary,
        labels: this.labels,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(`${path}/metadata.json`, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  /**
   * Load model from file
   * @param {String} path - Path to load model from
   * @param {String} framework - ML framework to use ('tensorflow' or 'pytorch')
   * @returns {Promise<void>}
   */
  async loadModel(path, framework = 'tensorflow') {
    if (framework === 'pytorch') {
      // For PyTorch, we just check if the model file exists
      if (!fs.existsSync(this.pytorchModelPath)) {
        throw new Error('PyTorch model not found.');
      }
      this.isTrained = true;
    } else {
      return await this.loadTensorFlowModel(path);
    }
  }

  /**
   * Load TensorFlow model from file
   * @param {String} path - Path to load model from
   * @returns {Promise<void>}
   */
  async loadTensorFlowModel(path) {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      
      // Load vocabulary and labels
      const metadata = JSON.parse(fs.readFileSync(`${path}/metadata.json`, 'utf8'));
      this.vocabulary = metadata.vocabulary;
      this.labels = metadata.labels;
      this.isTrained = true;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }
}

// Export classifier
module.exports = LegalTextClassifier;