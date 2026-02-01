import { IntentRecognitionResult, ContextExtractionResult } from '../types/legal';
export declare class NLPService {
    private openaiApiKey;
    private openaiEndpoint;
    constructor();
    /**
     * Recognize the intent and category of a user query
     */
    recognizeIntent(query: string): Promise<IntentRecognitionResult>;
    /**
     * Extract context and relevant facts from user query
     */
    extractContext(query: string, intent: IntentRecognitionResult): Promise<ContextExtractionResult>;
    /**
     * Call OpenAI API
     */
    private callOpenAI;
    /**
     * System prompt for intent recognition
     */
    private getIntentRecognitionSystemPrompt;
    /**
     * System prompt for context extraction
     */
    private getContextExtractionSystemPrompt;
    /**
     * Bestimmt den Rechtsbereich basierend auf der Kategorie
     */
    private getLegalDomain;
    /**
     * Parse intent recognition response
     */
    private parseIntentResponse;
    /**
     * Parse context extraction response
     */
    private parseContextResponse;
    /**
     * Fallback rule-based intent recognition
     */
    private fallbackIntentRecognition;
}
