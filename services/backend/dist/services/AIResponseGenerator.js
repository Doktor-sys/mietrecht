"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponseGenerator = void 0;
const logger_1 = require("../utils/logger");
const KnowledgeService_1 = require("./KnowledgeService");
const RedisService_1 = require("./RedisService");
const LegalDataConfig_1 = require("../config/LegalDataConfig");
class AIResponseGenerator {
    constructor(prisma) {
        this.knowledgeService = new KnowledgeService_1.KnowledgeService(prisma);
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        this.openaiEndpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
        this.cacheService = RedisService_1.RedisService.getInstance();
        // Initialize Redis connection
        this.cacheService.connect().catch(err => logger_1.logger.warn('Redis connection failed, caching disabled:', err));
    }
    /**
     * Generate comprehensive AI response with legal references
     */
    async generateResponse(classification, userQuery, conversationContext, userProfile) {
        try {
            logger_1.logger.info('Generating AI response', {
                category: classification.classification.category,
                confidence: classification.classification.confidence
            });
            // Check cache first
            const cacheKey = this.generateCacheKey(classification, userQuery);
            const cachedResponse = await this.cacheService.get(cacheKey);
            if (cachedResponse) {
                logger_1.logger.info('Cache hit for AI response', { cacheKey });
                return cachedResponse;
            }
            // Step 1: Find relevant legal references
            const legalReferences = await this.findLegalReferences(classification);
            // Step 2: Generate action recommendations
            const actionRecommendations = this.generateActionRecommendations(classification);
            // Step 3: Find applicable templates
            const templateReferences = this.findApplicableTemplates(classification);
            // Step 4: Generate natural language response
            const message = await this.generateNaturalLanguageResponse(classification, userQuery, legalReferences, actionRecommendations, conversationContext, userProfile);
            const response = {
                message,
                confidence: classification.classification.confidence,
                legalReferences,
                actionRecommendations,
                templateReferences,
                escalationRecommended: classification.classification.escalationRecommended,
                escalationReason: classification.classification.escalationReason
            };
            logger_1.logger.info('AI response generated', {
                legalReferencesCount: legalReferences.length,
                actionsCount: actionRecommendations.length,
                templatesCount: templateReferences.length
            });
            // Cache the response (1 hour TTL)
            await this.cacheService.set(cacheKey, response, 3600);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error generating AI response', { error });
            throw error;
        }
    }
    /**
     * Refine AI response based on user feedback
     */
    async refineResponse(originalResponse, feedback, userQuery) {
        try {
            logger_1.logger.info('Refining AI response based on user feedback', { feedback });
            // Build refinement prompt
            const refinementPrompt = this.buildRefinementPrompt(originalResponse, feedback, userQuery);
            // Generate refined response
            const refinedMessage = await this.callOpenAI({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: this.buildSystemPrompt() },
                    { role: 'user', content: refinementPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });
            // Return refined response with original metadata
            return {
                ...originalResponse,
                message: refinedMessage
            };
        }
        catch (error) {
            logger_1.logger.error('Error refining AI response', { error });
            // Return original response if refinement fails
            return originalResponse;
        }
    }
    /**
     * Build refinement prompt for OpenAI
     */
    buildRefinementPrompt(originalResponse, feedback, userQuery) {
        return `Ursprüngliche Nutzeranfrage: ${userQuery}

Ursprüngliche KI-Antwort:
${originalResponse.message}

Benutzerfeedback zur Antwort:
${feedback}

Bitte verfeinere die ursprüngliche Antwort basierend auf dem Benutzerfeedback. 
Berücksichtige dabei:
1. Die spezifischen Wünsche oder Unklarheiten des Benutzers
2. Die ursprünglichen rechtlichen Grundlagen und Handlungsempfehlungen
3. Die Notwendigkeit, weiterhin klare und verständliche Sprache zu verwenden

Gib eine überarbeitete Antwort aus, die das Benutzerfeedback berücksichtigt.`;
    }
    /**
     * Find relevant legal references based on classification
     */
    async findLegalReferences(classification) {
        try {
            const references = [];
            const category = classification.classification.category;
            // Get category-specific legal references
            const searchQuery = this.buildLegalSearchQuery(category, classification);
            const searchResults = await this.knowledgeService.searchLegalContent(searchQuery, {
                types: ['LAW'],
                relevanceThreshold: 0.5
            }, 1, 5);
            // Convert search results to legal references
            for (const result of searchResults.results) {
                references.push({
                    type: this.mapLegalType(result.type),
                    reference: result.reference,
                    title: result.title,
                    excerpt: this.extractRelevantExcerpt(result.content),
                    url: this.generateLegalUrl(result.reference)
                });
            }
            // Add category-specific mandatory references
            const mandatoryRefs = this.getMandatoryReferences(category);
            references.push(...mandatoryRefs);
            logger_1.logger.info('Legal references found', { count: references.length, category });
            return references;
        }
        catch (error) {
            logger_1.logger.error('Error finding legal references', { error });
            // Return fallback references
            return this.getFallbackReferences(classification.classification.category);
        }
    }
    /**
     * Build search query for legal knowledge base
     */
    buildLegalSearchQuery(category, classification) {
        const keywords = LegalDataConfig_1.CATEGORY_KEYWORDS[category] || [];
        const facts = classification.context.facts.slice(0, 3);
        return [...keywords, ...facts].join(' ');
    }
    /**
     * Get mandatory legal references for each category
     */
    getMandatoryReferences(category) {
        return LegalDataConfig_1.MANDATORY_REFERENCES[category] || [];
    }
    /**
     * Generate action recommendations based on classification
     */
    generateActionRecommendations(classification) {
        const category = classification.classification.category;
        const urgency = classification.context.urgency;
        // Get base recommendations from config
        // Clone to avoid mutating the config
        const recommendations = [...(LegalDataConfig_1.ACTION_RECOMMENDATIONS_MAP[category] || LegalDataConfig_1.ACTION_RECOMMENDATIONS_MAP.other)];
        // Add urgent action if high urgency
        if (urgency === 'high') {
            recommendations.unshift({
                action: 'Sofort handeln',
                priority: 'high',
                deadline: 'Dringend',
                details: 'Aufgrund der Dringlichkeit sollten Sie unverzüglich handeln'
            });
        }
        return recommendations;
    }
    /**
     * Find applicable document templates
     */
    findApplicableTemplates(classification) {
        const category = classification.classification.category;
        return LegalDataConfig_1.TEMPLATE_MAP[category] || [];
    }
    /**
     * Generate natural language response using OpenAI
     */
    async generateNaturalLanguageResponse(classification, userQuery, legalReferences, actionRecommendations, conversationContext, userProfile) {
        try {
            if (!this.openaiApiKey) {
                return this.generateFallbackResponse(classification, legalReferences, actionRecommendations);
            }
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(classification, userQuery, legalReferences, actionRecommendations, conversationContext, userProfile);
            const response = await this.callOpenAI({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error generating natural language response', { error });
            return this.generateFallbackResponse(classification, legalReferences, actionRecommendations);
        }
    }
    /**
     * Build system prompt for OpenAI
     */
    buildSystemPrompt() {
        return `Du bist ein KI-Assistent für deutsches Mietrecht. Deine Aufgabe ist es, Nutzern verständliche und präzise Antworten zu geben.

Richtlinien:
- Verwende eine klare, verständliche Sprache (kein Juristendeutsch)
- Beziehe dich auf konkrete Gesetzesparagraphen
- Gib praktische Handlungsempfehlungen
- Weise auf Fristen und Deadlines hin
- Empfehle bei komplexen Fällen einen Fachanwalt
- Sei empathisch und unterstützend
- Strukturiere deine Antwort klar mit Absätzen

Format:
1. Kurze Zusammenfassung der Situation
2. Rechtliche Einordnung mit Paragraphen
3. Konkrete Handlungsempfehlungen
4. Hinweis auf verfügbare Musterbriefe (falls relevant)
5. Warnung bei Fristen oder dringenden Maßnahmen`;
    }
    /**
     * Build user prompt for OpenAI
     */
    buildUserPrompt(classification, userQuery, legalReferences, actionRecommendations, conversationContext, userProfile) {
        let prompt = `Nutzeranfrage: ${userQuery}\n\n`;
        if (userProfile) {
            prompt += `Nutzerprofil:\n`;
            if (userProfile.userType) {
                prompt += `- Rolle: ${userProfile.userType === 'tenant' ? 'Mieter' : 'Vermieter'}\n`;
            }
            if (userProfile.profile?.firstName) {
                prompt += `- Name: ${userProfile.profile.firstName}\n`;
            }
            prompt += '\n';
        }
        if (conversationContext) {
            prompt += `Bisheriger Gesprächsverlauf:\n${conversationContext}\n\n`;
        }
        prompt += `Klassifizierung:\n`;
        prompt += `- Kategorie: ${classification.classification.category}\n`;
        prompt += `- Konfidenz: ${Math.round(classification.classification.confidence * 100)}%\n`;
        prompt += `- Risiko: ${classification.classification.riskLevel}\n`;
        prompt += `- Komplexität: ${classification.classification.estimatedComplexity}\n`;
        prompt += `- Dringlichkeit: ${classification.context.urgency}\n\n`;
        if (classification.context.facts.length > 0) {
            prompt += `Relevante Fakten:\n`;
            classification.context.facts.forEach(fact => {
                prompt += `- ${fact}\n`;
            });
            prompt += '\n';
        }
        if (legalReferences.length > 0) {
            prompt += `Relevante Rechtsnormen:\n`;
            legalReferences.slice(0, 5).forEach((ref, index) => {
                prompt += `${index + 1}. ${ref.reference}: ${ref.title}\n`;
                if (ref.excerpt) {
                    prompt += `  Auszug: ${ref.excerpt}\n`;
                }
            });
            prompt += '\n';
        }
        if (actionRecommendations.length > 0) {
            prompt += `Empfohlene Maßnahmen:\n`;
            actionRecommendations.forEach((action, index) => {
                prompt += `${index + 1}. ${action.action}`;
                if (action.deadline) {
                    prompt += ` (Frist: ${action.deadline})`;
                }
                if (action.legalBasis) {
                    prompt += ` [Rechtsgrundlage: ${action.legalBasis}]`;
                }
                prompt += '\n';
                if (action.details) {
                    prompt += `   Details: ${action.details}\n`;
                }
            });
            prompt += '\n';
        }
        if (classification.classification.escalationRecommended) {
            prompt += `⚠️ WICHTIG: Dieser Fall sollte von einem Fachanwalt geprüft werden.\n`;
            prompt += `Grund: ${classification.classification.escalationReason}\n\n`;
        }
        prompt += `Bitte erstelle eine verständliche, strukturierte Antwort für den Nutzer mit folgenden Anforderungen:
1. Verwende eine klare, verständliche Sprache (kein Juristendeutsch)
2. Beziehe dich auf konkrete Gesetzesparagraphen
3. Gib praktische Handlungsempfehlungen mit klaren Schritten
4. Weise auf Fristen und Deadlines hin
5. Empfehle bei komplexen Fällen einen Fachanwalt
6. Sei empathisch und unterstützend
7. Strukturiere deine Antwort klar mit Absätzen
8. Füge am Ende eine kurze Zusammenfassung der wichtigsten Punkte hinzu
9. Berücksichtige die Rolle des Nutzers (Mieter/Vermieter) bei den Handlungsempfehlungen`;
        return prompt;
    }
    /**
     * Call OpenAI API
     */
    async callOpenAI(payload) {
        const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    /**
     * Generate fallback response without OpenAI
     */
    generateFallbackResponse(classification, legalReferences, actionRecommendations) {
        const categoryName = LegalDataConfig_1.CATEGORY_NAMES[classification.classification.category] || 'Allgemeine Anfrage';
        let response = `## Ihre Anfrage zum Thema "${categoryName}"\n\n`;
        // Add legal references
        if (legalReferences.length > 0) {
            response += `### Rechtliche Grundlagen\n`;
            legalReferences.slice(0, 3).forEach((ref, index) => {
                response += `${index + 1}. **${ref.reference}** - ${ref.title}\n`;
                if (ref.url) {
                    response += `   Weitere Informationen: [Link zu ${ref.reference}](${ref.url})\n`;
                }
                if (ref.excerpt) {
                    response += `   Auszug: ${ref.excerpt}\n`;
                }
            });
            response += '\n';
        }
        // Add action recommendations
        if (actionRecommendations.length > 0) {
            response += `### Empfohlene Schritte\n`;
            actionRecommendations.forEach((action, index) => {
                response += `${index + 1}. **${action.action}**\n`;
                if (action.deadline) {
                    response += `   ⏰ Frist: ${action.deadline}\n`;
                }
                if (action.legalBasis) {
                    response += `   📚 Rechtsgrundlage: ${action.legalBasis}\n`;
                }
                if (action.details) {
                    response += `   ℹ️ Details: ${action.details}\n`;
                }
                response += '\n';
            });
        }
        // Add escalation warning
        if (classification.classification.escalationRecommended) {
            response += `### ⚠️ Wichtiger Hinweis\n`;
            response += `Aufgrund der Komplexität Ihres Falls empfehle ich dringend die Konsultation eines Fachanwalts für Mietrecht.\n\n`;
            response += `Grund: ${classification.classification.escalationReason}\n\n`;
        }
        // Add summary
        response += `### Zusammenfassung\n`;
        response += `Basierend auf Ihrer Anfrage habe ich folgende Punkte identifiziert:\n`;
        response += `- Kategorie: ${categoryName}\n`;
        response += `- Risiko: ${classification.classification.riskLevel}\n`;
        response += `- Komplexität: ${classification.classification.estimatedComplexity}\n`;
        response += `- Dringlichkeit: ${classification.context.urgency}\n\n`;
        response += `Haben Sie weitere Fragen zu Ihrem Fall?`;
        return response;
    }
    /**
     * Helper methods
     */
    mapLegalType(type) {
        const typeMap = {
            LAW: 'law',
            COURT_DECISION: 'court_decision',
            REGULATION: 'regulation'
        };
        return typeMap[type] || 'law';
    }
    extractRelevantExcerpt(content, maxLength = 200) {
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + '...';
    }
    /**
     * Generate cache key for AI responses
     */
    generateCacheKey(classification, userQuery) {
        const category = classification.classification.category;
        const queryHash = Buffer.from(userQuery).toString('base64').substring(0, 32);
        return `ai:response:${category}:${queryHash}`;
    }
    generateLegalUrl(reference) {
        // Generate URL to gesetze-im-internet.de
        const cleanRef = reference.replace(/[§\s]/g, '').toLowerCase();
        if (cleanRef.includes('bgb')) {
            const paragraph = cleanRef.replace('bgb', '');
            return `https://www.gesetze-im-internet.de/bgb/__${paragraph}.html`;
        }
        return `https://www.gesetze-im-internet.de/`;
    }
    getFallbackReferences(category) {
        return this.getMandatoryReferences(category);
    }
}
exports.AIResponseGenerator = AIResponseGenerator;
