# Legal Text Classifier

This module provides legal document classification capabilities using both TensorFlow.js and PyTorch frameworks.

## Features

- Text preprocessing for German legal documents
- Classification using TensorFlow.js (Node.js native)
- Classification using PyTorch (Python integration)
- Model training and persistence
- Confidence scoring for predictions

## Installation

To install the required dependencies, run:

```bash
npm run install-ml-deps
```

This will install both the TensorFlow.js Node.js package and the PyTorch Python package.

## Usage

### TensorFlow.js Implementation

```javascript
const LegalTextClassifier = require('./legalTextClassifier.js');

// Create classifier instance
const classifier = new LegalTextClassifier();

// Training data format
const trainingData = [
  {
    text: "Legal document text...",
    label: "category"
  },
  // ... more training examples
];

// Train the model
await classifier.train(trainingData, 'tensorflow');

// Classify a document
const result = await classifier.classify("Document to classify...", 'tensorflow');
console.log(result.predictedLabel, result.confidence);

// Save and load model
await classifier.saveModel('./model_path', 'tensorflow');
await classifier.loadModel('./model_path', 'tensorflow');
```

### PyTorch Implementation

```javascript
const LegalTextClassifier = require('./legalTextClassifier.js');

// Create classifier instance
const classifier = new LegalTextClassifier();

// Train the model
await classifier.train(trainingData, 'pytorch');

// Classify a document
const result = await classifier.classify("Document to classify...", 'pytorch');
console.log(result.predictedLabel, result.confidence);
```

## API

### `train(trainingData, framework)`

Train the classifier with the provided data.

- `trainingData`: Array of objects with `text` and `label` properties
- `framework`: Either 'tensorflow' or 'pytorch'

Returns a promise that resolves to training results.

### `classify(text, framework)`

Classify a legal document.

- `text`: The document text to classify
- `framework`: Either 'tensorflow' or 'pytorch'

Returns a promise that resolves to classification results including:
- `predictedLabel`: The predicted category
- `confidence`: Confidence score (0-1)
- `topPredictions`: Top 3 predictions with scores

### `saveModel(path, framework)`

Save the trained model to disk.

- `path`: Directory path to save the model
- `framework`: Either 'tensorflow' or 'pytorch'

### `loadModel(path, framework)`

Load a trained model from disk.

- `path`: Directory path to load the model from
- `framework`: Either 'tensorflow' or 'pytorch'

## Testing

To run the tests:

```bash
npm run test-legal-classifier
```

## Model Architecture

### TensorFlow.js

- Dense layer (128 units, ReLU activation)
- Dropout layer (0.5)
- Dense layer (64 units, ReLU activation)
- Dropout layer (0.5)
- Dense layer (numClasses units, Softmax activation)

### PyTorch

- Embedding layer
- LSTM layer
- Dropout layer (0.5)
- Linear layer

## Supported Legal Categories

The classifier can be trained to recognize various legal document categories such as:
- Mietminderung (Rent Reduction)
- Kündigung (Termination)
- Nebenkosten (Ancillary Costs)
- Modernisierung (Modernization)
- Mietpreisanpassung (Rent Adjustment)
- Schadensersatz (Damages)
- Kaution (Security Deposit)
- Mietvertrag (Rental Agreement)

## Requirements

- Node.js >= 12.0
- Python >= 3.6 (for PyTorch integration)
- TensorFlow.js Node.js package
- PyTorch Python package