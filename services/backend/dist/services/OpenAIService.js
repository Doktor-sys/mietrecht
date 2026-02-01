"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiService = exports.OpenAIService = void 0;
const logger_1 = require("../utils/logger");
/**
 * OpenAI Service for generating embeddings
 * Uses OpenAI's text-embedding-3-small model for semantic search
 */
class OpenAIService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        this.openaiEndpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
        if (!this.openaiApiKey) {
            logger_1.logger.warn('OpenAI API key not configured - embeddings will be disabled');
        }
    }
    /**
     * Generates embeddings for given text
     * @param text Text to generate embeddings for (max 8000 chars)
     * @returns Array of embedding values (1536 dimensions)
     */
    async generateEmbedding(text) {
        try {
            if (!this.openaiApiKey) {
                logger_1.logger.warn('OpenAI API key not configured, returning empty embeddings');
                return [];
            }
            // Truncate text to OpenAI's limit
            const truncatedText = text.substring(0, 8000);
            const response = await fetch(`${this.openaiEndpoint}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'text-embedding-3-small',
                    input: truncatedText,
                    encoding_format: 'float'
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data[0].embedding;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate embedding:', error);
            throw error;
        }
    }
    /**
     * Generates embeddings for legal content (combines title and content)
     * @param title Legal content title
     * @param content Legal content body
     * @returns Array of embedding values
     */
    async generateLegalContentEmbedding(title, content) {
        const combinedText = `${title}\n\n${content}`;
        return this.generateEmbedding(combinedText);
    }
    /**
     * Checks if OpenAI service is properly configured
     */
    isConfigured() {
        return !!this.openaiApiKey;
    }
}
exports.OpenAIService = OpenAIService;
// Export singleton instance
exports.openaiService = new OpenAIService();
