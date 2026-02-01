export declare class ChatbotService {
    private conversationHistory;
    constructor();
    processMessage(message: string, userId: string, context?: any): Promise<{
        text: string;
        confidence: number;
    }>;
    private containsKeyword;
    private storeMessage;
    getConversationHistory(userId: string): Array<{
        role: string;
        content: string;
        timestamp: Date;
    }>;
    clearConversationHistory(userId: string): void;
    getLastUserMessage(userId: string): string | null;
}
//# sourceMappingURL=ChatbotService.d.ts.map