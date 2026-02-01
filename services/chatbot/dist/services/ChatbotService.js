"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
class ChatbotService {
    constructor() {
        this.conversationHistory = new Map();
        console.log('Chatbot Service initialized');
    }
    async processMessage(message, userId, context) {
        this.storeMessage(userId, 'user', message);
        let responseText = '';
        let confidence = 0.8;
        if (this.containsKeyword(message, ['mietrecht', 'miete', 'vermieter', 'mieter'])) {
            responseText = 'Ich kann Ihnen bei Fragen zum Mietrecht helfen. Haben Sie ein konkretes Problem mit Ihrem Vermieter oder Mieter?';
        }
        else if (this.containsKeyword(message, ['kündigung', 'gekündigt'])) {
            responseText = 'Bei einer Kündigung ist wichtig, ob sie ordentlich oder außerordentlich ist. Haben Sie Details zur Kündigung?';
        }
        else if (this.containsKeyword(message, ['mietminderung', 'defekt', 'reparatur'])) {
            responseText = 'Für eine Mietminderung muss ein erheblicher Mangel vorliegen. Können Sie mir mehr über den Defekt erzählen?';
        }
        else if (this.containsKeyword(message, ['nebenkosten', 'betriebskosten', 'heizkosten'])) {
            responseText = 'Bei Nebenkostenabrechnungen haben Mieter besondere Rechte. Haben Sie Probleme mit Ihrer Abrechnung?';
        }
        else if (this.containsKeyword(message, ['hausordnung', 'rauchen', 'haustiere'])) {
            responseText = 'Regelungen zur Hausordnung müssen vertraglich vereinbart sein. Was genau wurde geregelt?';
        }
        else {
            responseText = 'Ich verstehe Ihr Anliegen. Könnten Sie mir etwas mehr Details dazu geben?';
            confidence = 0.5;
        }
        this.storeMessage(userId, 'bot', responseText);
        return {
            text: responseText,
            confidence: confidence
        };
    }
    containsKeyword(message, keywords) {
        const lowerMessage = message.toLowerCase();
        return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
    }
    storeMessage(userId, role, content) {
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
            if (history.length > 20) {
                history.shift();
            }
        }
    }
    getConversationHistory(userId) {
        return this.conversationHistory.get(userId) || [];
    }
    clearConversationHistory(userId) {
        this.conversationHistory.delete(userId);
    }
    getLastUserMessage(userId) {
        const history = this.conversationHistory.get(userId);
        if (!history)
            return null;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                return history[i].content;
            }
        }
        return null;
    }
}
exports.ChatbotService = ChatbotService;
//# sourceMappingURL=ChatbotService.js.map