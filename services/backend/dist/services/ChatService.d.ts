import { PrismaClient, Message } from '@prisma/client';
import { ClassificationResult } from './LegalCaseClassifier';
import { AIResponse } from './AIResponseGenerator';
export interface ConversationResponse {
    conversationId: string;
    message: string;
    classification?: ClassificationResult;
    suggestions?: string[];
    escalationRecommended: boolean;
    legalReferences?: any[];
    actionRecommendations?: any[];
    templateReferences?: any[];
}
export interface ConversationHistory {
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: Date;
    messageCount: number;
    lastMessage?: string;
}
export declare class ChatService {
    private prisma;
    private classifier;
    private responseGenerator;
    constructor(prisma: PrismaClient);
    /**
     * Refine AI response based on user feedback
     */
    refineResponse(originalResponse: AIResponse, feedback: string, userQuery: string): Promise<AIResponse>;
    /**
     * Start a new conversation
     */
    startConversation(userId: string, initialQuery: string): Promise<ConversationResponse>;
    /**
     * Send a message in an existing conversation
     */
    sendMessage(conversationId: string, userId: string, message: string): Promise<ConversationResponse>;
    /**
     * Get conversation history for a user
     */
    getConversationHistory(userId: string): Promise<ConversationHistory[]>;
    /**
     * Get messages for a specific conversation
     */
    getConversationMessages(conversationId: string, userId: string): Promise<Message[]>;
    /**
     * Escalate conversation to a lawyer
     */
    escalateToLawyer(conversationId: string, userId: string): Promise<void>;
    /**
     * Generate case title from classification
     */
    private generateCaseTitle;
    /**
     * Map risk level to priority
     */
    private mapRiskToPriority;
    /**
     * Build conversation context from messages
     */
    private buildConversationContext;
    /**
     * Get category name in German
     */
    private getCategoryName;
}
