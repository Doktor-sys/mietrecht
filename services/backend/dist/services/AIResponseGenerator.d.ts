import { ClassificationResult } from './LegalCaseClassifier';
import { PrismaClient } from '@prisma/client';
import { LegalReference, ActionRecommendation, TemplateReference } from '../config/LegalDataConfig';
export interface AIResponse {
    message: string;
    confidence: number;
    legalReferences: LegalReference[];
    actionRecommendations: ActionRecommendation[];
    templateReferences: TemplateReference[];
    escalationRecommended: boolean;
    escalationReason?: string;
}
export { LegalReference, ActionRecommendation, TemplateReference };
export declare class AIResponseGenerator {
    private knowledgeService;
    private openaiApiKey;
    private openaiEndpoint;
    private cacheService;
    constructor(prisma: PrismaClient);
    /**
     * Generate comprehensive AI response with legal references
     */
    generateResponse(classification: ClassificationResult, userQuery: string, conversationContext?: string, userProfile?: any): Promise<AIResponse>;
    /**
     * Refine AI response based on user feedback
     */
    refineResponse(originalResponse: AIResponse, feedback: string, userQuery: string): Promise<AIResponse>;
    /**
     * Build refinement prompt for OpenAI
     */
    private buildRefinementPrompt;
    /**
     * Find relevant legal references based on classification
     */
    private findLegalReferences;
    /**
     * Build search query for legal knowledge base
     */
    private buildLegalSearchQuery;
    /**
     * Get mandatory legal references for each category
     */
    private getMandatoryReferences;
    /**
     * Generate action recommendations based on classification
     */
    private generateActionRecommendations;
    /**
     * Find applicable document templates
     */
    private findApplicableTemplates;
    /**
     * Generate natural language response using OpenAI
     */
    private generateNaturalLanguageResponse;
    /**
     * Build system prompt for OpenAI
     */
    private buildSystemPrompt;
    /**
     * Build user prompt for OpenAI
     */
    private buildUserPrompt;
    /**
     * Call OpenAI API
     */
    private callOpenAI;
    /**
     * Generate fallback response without OpenAI
     */
    private generateFallbackResponse;
    /**
     * Helper methods
     */
    private mapLegalType;
    private extractRelevantExcerpt;
    /**
     * Generate cache key for AI responses
     */
    private generateCacheKey;
    private generateLegalUrl;
    private getFallbackReferences;
}
