"""
PyTorch Legal Document Classifier
This module provides legal document classification capabilities using PyTorch.
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import json
import os

class LegalTextDataset(Dataset):
    """Dataset class for legal texts"""
    
    def __init__(self, texts, labels, vocab):
        self.texts = texts
        self.labels = labels
        self.vocab = vocab
        self.label_to_idx = {label: idx for idx, label in enumerate(set(labels))}
        
    def __len__(self):
        return len(self.texts)
        
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        # Convert text to indices
        indices = [self.vocab.get(token, 0) for token in self.preprocess_text(text)]
        
        # Pad or truncate to fixed length
        max_length = 256
        if len(indices) < max_length:
            indices.extend([0] * (max_length - len(indices)))
        else:
            indices = indices[:max_length]
            
        return torch.tensor(indices, dtype=torch.long), torch.tensor(self.label_to_idx[label], dtype=torch.long)
        
    def preprocess_text(self, text):
        """Preprocess text for tokenization"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep German umlauts
        text = ''.join(char if char.isalnum() or char in 'äöüß ' else ' ' for char in text)
        
        # Split into tokens
        tokens = text.split()
        
        # Filter out short tokens
        tokens = [token for token in tokens if len(token) > 2]
        
        return tokens

class LegalTextClassifier(nn.Module):
    """Legal Text Classifier using PyTorch"""
    
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes, dropout=0.5):
        super(LegalTextClassifier, self).__init__()
        
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, dropout=dropout)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # Embedding layer
        embedded = self.embedding(x)
        
        # LSTM layer
        lstm_out, (hidden, _) = self.lstm(embedded)
        
        # Use the last hidden state
        output = self.dropout(hidden[-1])
        
        # Fully connected layer
        output = self.fc(output)
        
        return output

def build_vocabulary(texts):
    """Build vocabulary from texts"""
    vocab = {"<PAD>": 0, "<UNK>": 1}
    idx = 2
    
    for text in texts:
        # Preprocess text
        processed_text = text.lower()
        processed_text = ''.join(char if char.isalnum() or char in 'äöüß ' else ' ' for char in processed_text)
        tokens = processed_text.split()
        tokens = [token for token in tokens if len(token) > 2]
        
        # Add tokens to vocabulary
        for token in tokens:
            if token not in vocab:
                vocab[token] = idx
                idx += 1
                
    return vocab

def train_model(model, train_loader, num_epochs, learning_rate, device):
    """Train the model"""
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    
    model.train()
    for epoch in range(num_epochs):
        total_loss = 0
        for texts, labels in train_loader:
            texts, labels = texts.to(device), labels.to(device)
            
            # Forward pass
            outputs = model(texts)
            loss = criterion(outputs, labels)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
        print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss/len(train_loader):.4f}')

def save_model(model, vocab, label_to_idx, filepath):
    """Save model and metadata"""
    model_data = {
        'state_dict': model.state_dict(),
        'vocab': vocab,
        'label_to_idx': label_to_idx,
        'model_config': {
            'vocab_size': len(vocab),
            'embedding_dim': model.embedding.embedding_dim,
            'hidden_dim': model.fc.in_features,
            'num_classes': len(label_to_idx)
        }
    }
    
    torch.save(model_data, filepath)
    print(f"Model saved to {filepath}")

def load_model(filepath, device):
    """Load model and metadata"""
    model_data = torch.load(filepath, map_location=device)
    
    # Create model
    config = model_data['model_config']
    model = LegalTextClassifier(
        config['vocab_size'],
        config['embedding_dim'],
        config['hidden_dim'],
        config['num_classes']
    )
    
    # Load state dict
    model.load_state_dict(model_data['state_dict'])
    model.to(device)
    
    return model, model_data['vocab'], model_data['label_to_idx']

def classify_text(model, vocab, label_to_idx, text, device):
    """Classify a single text"""
    model.eval()
    
    # Preprocess text
    dataset = LegalTextDataset([text], ['dummy'], vocab)
    text_tensor, _ = dataset[0]
    text_tensor = text_tensor.unsqueeze(0).to(device)
    
    # Predict
    with torch.no_grad():
        output = model(text_tensor)
        probabilities = torch.softmax(output, dim=1)
        predicted_idx = torch.argmax(probabilities, dim=1).item()
        
    # Convert back to label
    idx_to_label = {idx: label for label, idx in label_to_idx.items()}
    predicted_label = idx_to_label[predicted_idx]
    confidence = probabilities[0][predicted_idx].item()
    
    return predicted_label, confidence

# Example usage
if __name__ == "__main__":
    # Sample training data
    training_data = [
        {
            "text": "Die Mietminderung ist gemäß § 536 BGB zulässig, wenn die Mietsache mangelhaft ist und der Mieter hierdurch in der Nutzung beeinträchtigt wird. Ein Mangel liegt vor, wenn die Mietsache nicht die vereinbarte Beschaffenheit aufweist oder wenn sie nicht geeignet ist, die ihr nach dem Vertrag zugewiesene Verwendung vorzunehmen.",
            "label": "Mietminderung"
        },
        {
            "text": "Eine Kündigung des Mietvertrags durch den Vermieter ist nur zulässig, wenn ein wichtiger Grund vorliegt. Ein wichtiger Grund liegt insbesondere dann vor, wenn der Mieter mit der Miete in Verzug gerät oder die Mietsache missbräuchlich behandelt.",
            "label": "Kündigung"
        },
        {
            "text": "Die Nebenkostenabrechnung muss jährlich erfolgen und alle relevanten Kosten enthalten. Der Mieter hat das Recht, die Abrechnung zu prüfen und gegebenenfalls Einwendungen zu erheben.",
            "label": "Nebenkosten"
        },
        {
            "text": "Der Mieter hat Anspruch auf Modernisierungsmieterhöhungen, wenn der Vermieter Modernisierungen durchgeführt hat, die den Wohnwert steigern. Die Mieterhöhung ist begrenzt und muss sachgerecht begründet sein.",
            "label": "Modernisierung"
        },
        {
            "text": "Bei einer Mietpreisanpassung muss der Vermieter die ortsübliche Vergleichsmiete berücksichtigen. Die Anpassung ist nur zulässig, wenn sie innerhalb der gesetzlichen Grenzen bleibt.",
            "label": "Mietpreisanpassung"
        },
        {
            "text": "Ein Schadensersatzanspruch kann entstehen, wenn eine Partei vertragliche Pflichten verletzt und hierdurch der anderen Partei ein Schaden entsteht. Der Schaden muss kausal mit der Pflichtverletzung zusammenhängen.",
            "label": "Schadensersatz"
        },
        {
            "text": "Die Mietsicherheit in Form einer Kaution darf maximal drei Monatsmieten betragen. Der Vermieter hat die Kaution treuhänderisch zu verwalten und muss sie verzinsen.",
            "label": "Kaution"
        },
        {
            "text": "Ein Mietvertrag ist ein zweiseitiger Vertrag, der besondere Formvorschriften unterliegt. Vertragsinhalte müssen klar geregelt sein, um spätere Streitigkeiten zu vermeiden.",
            "label": "Mietvertrag"
        }
    ]
    
    # Extract texts and labels
    texts = [item["text"] for item in training_data]
    labels = [item["label"] for item in training_data]
    
    # Build vocabulary
    vocab = build_vocabulary(texts)
    print(f"Vocabulary size: {len(vocab)}")
    
    # Create dataset and dataloader
    dataset = LegalTextDataset(texts, labels, vocab)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Create model
    model = LegalTextClassifier(
        vocab_size=len(vocab),
        embedding_dim=128,
        hidden_dim=64,
        num_classes=len(set(labels))
    ).to(device)
    
    # Train model
    print("Training model...")
    train_model(model, dataloader, num_epochs=20, learning_rate=0.001, device=device)
    
    # Save model
    label_to_idx = dataset.label_to_idx
    save_model(model, vocab, label_to_idx, "legal_classifier_pytorch.pth")
    
    # Test classification
    test_text = "Der Vermieter hat die Mietpreisanpassung durchgeführt, obwohl die ortsübliche Vergleichsmiete nicht ausreichend berücksichtigt wurde. Die Mietergruppe plant eine Sammelklage wegen überschrittener Mietpreisgrenzen."
    
    predicted_label, confidence = classify_text(model, vocab, label_to_idx, test_text, device)
    print(f"\nClassification result:")
    print(f"Predicted label: {predicted_label}")
    print(f"Confidence: {confidence:.4f}")