/**
 * OpenAI Service for generating embeddings
 * Uses OpenAI's text-embedding-3-small model for semantic search
 */
export declare class OpenAIService {
    private openaiApiKey;
    private openaiEndpoint;
    constructor();
    /**
     * Generates embeddings for given text
     * @param text Text to generate embeddings for (max 8000 chars)
     * @returns Array of embedding values (1536 dimensions)
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generates embeddings for legal content (combines title and content)
     * @param title Legal content title
     * @param content Legal content body
     * @returns Array of embedding values
     */
    generateLegalContentEmbedding(title: string, content: string): Promise<number[]>;
    /**
     * Checks if OpenAI service is properly configured
     */
    isConfigured(): boolean;
}
export declare const openaiService: OpenAIService;
