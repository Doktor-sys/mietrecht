/**
 * Chatbot Service
 * 
 * This service handles chatbot functionality for legal queries.
 */

export class ChatbotService {
  private conversationHistory: Map<string, Array<{role: string, content: string, timestamp: Date}>> = new Map();

  constructor() {
    console.log('Chatbot Service initialized');
  }

  /**
   * Process a chat message and generate a response
   */
  async processMessage(message: string, userId: string, context?: any): Promise<{text: string, confidence: number}> {
    // Store user message in conversation history
    this.storeMessage(userId, 'user', message);
    
    // Process the message based on its content
    let responseText = '';
    let confidence = 0.8;
    
    // Simple rule-based responses for demonstration
    if (this.containsKeyword(message, ['mietrecht', 'miete', 'vermieter', 'mieter'])) {
      responseText = 'Ich kann Ihnen bei Fragen zum Mietrecht helfen. Haben Sie ein konkretes Problem mit Ihrem Vermieter oder Mieter?';
    } else if (this.containsKeyword(message, ['kündigung', 'gekündigt'])) {
      responseText = 'Bei einer Kündigung ist wichtig, ob sie ordentlich oder außerordentlich ist. Haben Sie Details zur Kündigung?';
    } else if (this.containsKeyword(message, ['mietminderung', 'defekt', 'reparatur'])) {
      responseText = 'Für eine Mietminderung muss ein erheblicher Mangel vorliegen. Können Sie mir mehr über den Defekt erzählen?';
    } else if (this.containsKeyword(message, ['nebenkosten', 'betriebskosten', 'heizkosten'])) {
      responseText = 'Bei Nebenkostenabrechnungen haben Mieter besondere Rechte. Haben Sie Probleme mit Ihrer Abrechnung?';
    } else if (this.containsKeyword(message, ['hausordnung', 'rauchen', 'haustiere'])) {
      responseText = 'Regelungen zur Hausordnung müssen vertraglich vereinbart sein. Was genau wurde geregelt?';
    } else {
      // Default response with lower confidence
      responseText = 'Ich verstehe Ihr Anliegen. Könnten Sie mir etwas mehr Details dazu geben?';
      confidence = 0.5;
    }
    
    // Store bot response in conversation history
    this.storeMessage(userId, 'bot', responseText);
    
    return {
      text: responseText,
      confidence: confidence
    };
  }

  /**
   * Check if a message contains any of the specified keywords
   */
  private containsKeyword(message: string, keywords: string[]): boolean {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  }

  /**
   * Store a message in the conversation history
   */
  private storeMessage(userId: string, role: string, content: string): void {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    if (history) {
      history.push({
        role: role,
        content: content,
        timestamp: new Date()
      });
      
      // Keep only the last 20 messages per user
      if (history.length > 20) {
        history.shift();
      }
    }
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId: string): Array<{role: string, content: string, timestamp: Date}> {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Clear conversation history for a user
   */
  clearConversationHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get the last user message
   */
  getLastUserMessage(userId: string): string | null {
    const history = this.conversationHistory.get(userId);
    if (!history) return null;
    
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        return history[i].content;
      }
    }
    return null;
  }
}