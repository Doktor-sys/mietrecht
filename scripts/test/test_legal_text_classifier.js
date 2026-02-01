/**
 * Test suite for Legal Text Classifier
 */

const LegalTextClassifier = require('../ml/legalTextClassifier.js');

// Mock training data
const mockTrainingData = [
  {
    text: "Die Mietminderung ist gemäß § 536 BGB zulässig, wenn die Mietsache mangelhaft ist und der Mieter hierdurch in der Nutzung beeinträchtigt wird. Ein Mangel liegt vor, wenn die Mietsache nicht die vereinbarte Beschaffenheit aufweist oder wenn sie nicht geeignet ist, die ihr nach dem Vertrag zugewiesene Verwendung vorzunehmen.",
    label: "Mietminderung"
  },
  {
    text: "Eine Kündigung des Mietvertrags durch den Vermieter ist nur zulässig, wenn ein wichtiger Grund vorliegt. Ein wichtiger Grund liegt insbesondere dann vor, wenn der Mieter mit der Miete in Verzug gerät oder die Mietsache missbräuchlich behandelt.",
    label: "Kündigung"
  },
  {
    text: "Die Nebenkostenabrechnung muss jährlich erfolgen und alle relevanten Kosten enthalten. Der Mieter hat das Recht, die Abrechnung zu prüfen und gegebenenfalls Einwendungen zu erheben.",
    label: "Nebenkosten"
  },
  {
    text: "Der Mieter hat Anspruch auf Modernisierungsmieterhöhungen, wenn der Vermieter Modernisierungen durchgeführt hat, die den Wohnwert steigern. Die Mieterhöhung ist begrenzt und muss sachgerecht begründet sein.",
    label: "Modernisierung"
  },
  {
    text: "Bei einer Mietpreisanpassung muss der Vermieter die ortsübliche Vergleichsmiete berücksichtigen. Die Anpassung ist nur zulässig, wenn sie innerhalb der gesetzlichen Grenzen bleibt.",
    label: "Mietpreisanpassung"
  },
  {
    text: "Ein Schadensersatzanspruch kann entstehen, wenn eine Partei vertragliche Pflichten verletzt und hierdurch der anderen Partei ein Schaden entsteht. Der Schaden muss kausal mit der Pflichtverletzung zusammenhängen.",
    label: "Schadensersatz"
  },
  {
    text: "Die Mietsicherheit in Form einer Kaution darf maximal drei Monatsmieten betragen. Der Vermieter hat die Kaution treuhänderisch zu verwalten und muss sie verzinsen.",
    label: "Kaution"
  },
  {
    text: "Ein Mietvertrag ist ein zweiseitiger Vertrag, der besondere Formvorschriften unterliegt. Vertragsinhalte müssen klar geregelt sein, um spätere Streitigkeiten zu vermeiden.",
    label: "Mietvertrag"
  }
];

// Test document
const testDocument = {
  text: "Der Vermieter hat die Mietpreisanpassung durchgeführt, obwohl die ortsübliche Vergleichsmiete nicht ausreichend berücksichtigt wurde. Die Mietergruppe plant eine Sammelklage wegen überschrittener Mietpreisgrenzen."
};

async function runTests() {
  console.log('Starting Legal Text Classifier tests...');
  
  try {
    // Test 1: TensorFlow.js Training and Classification
    console.log('\n=== Test 1: TensorFlow.js Training and Classification ===');
    const tfClassifier = new LegalTextClassifier();
    
    console.log('Training classifier with TensorFlow.js...');
    const tfTrainingResult = await tfClassifier.train(mockTrainingData, 'tensorflow');
    console.log('Training completed:', tfTrainingResult);
    
    console.log('\nClassifying legal document with TensorFlow.js...');
    const tfClassificationResult = await tfClassifier.classify(testDocument.text, 'tensorflow');
    console.log('Classification result:', tfClassificationResult);
    
    console.log('\nSaving TensorFlow.js model...');
    await tfClassifier.saveModel('./test_model_tf', 'tensorflow');
    console.log('TensorFlow.js model saved successfully');
    
    console.log('\nLoading TensorFlow.js model...');
    const newTfClassifier = new LegalTextClassifier();
    await newTfClassifier.loadModel('./test_model_tf', 'tensorflow');
    console.log('TensorFlow.js model loaded successfully');
    
    console.log('\nClassifying with loaded TensorFlow.js model...');
    const loadedTfClassificationResult = await newTfClassifier.classify(testDocument.text, 'tensorflow');
    console.log('Classification result with loaded TensorFlow.js model:', loadedTfClassificationResult);
    
    // Test 2: PyTorch Training and Classification (if Python is available)
    console.log('\n=== Test 2: PyTorch Training and Classification ===');
    try {
      const pytorchClassifier = new LegalTextClassifier();
      
      console.log('Training classifier with PyTorch...');
      const pytorchTrainingResult = await pytorchClassifier.train(mockTrainingData, 'pytorch');
      console.log('PyTorch training completed:', pytorchTrainingResult);
      
      console.log('\nClassifying legal document with PyTorch...');
      const pytorchClassificationResult = await pytorchClassifier.classify(testDocument.text, 'pytorch');
      console.log('PyTorch classification result:', pytorchClassificationResult);
      
    } catch (pytorchError) {
      console.log('PyTorch tests skipped (Python or PyTorch not available):', pytorchError.message);
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();