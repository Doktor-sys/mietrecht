import { logger } from '../utils/logger';
import { KnowledgeService, SearchResult } from './KnowledgeService';
import { ClassificationResult } from './LegalCaseClassifier';
import { LegalCategory } from './NLPService';
import { PrismaClient } from '@prisma/client';
import { RedisService } from './RedisService';
import {
  LegalReference,
  ActionRecommendation,
  TemplateReference,
  CATEGORY_KEYWORDS,
  MANDATORY_REFERENCES,
  TEMPLATE_MAP,
  ACTION_RECOMMENDATIONS_MAP,
  CATEGORY_NAMES
} from '../config/LegalDataConfig';

// Re-exporting AIResponse if it's used elsewhere, or defining it here if it wasn't in Config.
// I didn't put AIResponse in Config. Let's define it here.
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

export class AIResponseGenerator {
  private knowledgeService: KnowledgeService;
  private openaiApiKey: string;
  private openaiEndpoint: string;
  private cacheService: RedisService;

  constructor(prisma: PrismaClient) {
    this.knowledgeService = new KnowledgeService(prisma);
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiEndpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
    this.cacheService = RedisService.getInstance();
    // Initialize Redis connection
    this.cacheService.connect().catch(err =>
      logger.warn('Redis connection failed, caching disabled:', err)
    );
  }

  /**
   * Generate comprehensive AI response with legal references
   */
  async generateResponse(
    classification: ClassificationResult,
    userQuery: string,
    conversationContext?: string
  ): Promise<AIResponse> {
    try {
      logger.info('Generating AI response', {
        category: classification.classification.category,
        confidence: classification.classification.confidence
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(classification, userQuery);
      const cachedResponse = await this.cacheService.get<AIResponse>(cacheKey);
      if (cachedResponse) {
        logger.info('Cache hit for AI response', { cacheKey });
        return cachedResponse;
      }

      // Step 1: Find relevant legal references
      const legalReferences = await this.findLegalReferences(classification);

      // Step 2: Generate action recommendations
      const actionRecommendations = this.generateActionRecommendations(classification);

      // Step 3: Find applicable templates
      const templateReferences = this.findApplicableTemplates(classification);

      // Step 4: Generate natural language response
      const message = await this.generateNaturalLanguageResponse(
        classification,
        userQuery,
        legalReferences,
        actionRecommendations,
        conversationContext
      );

      const response: AIResponse = {
        message,
        confidence: classification.classification.confidence,
        legalReferences,
        actionRecommendations,
        templateReferences,
        escalationRecommended: classification.classification.escalationRecommended,
        escalationReason: classification.classification.escalationReason
      };

      logger.info('AI response generated', {
        legalReferencesCount: legalReferences.length,
        actionsCount: actionRecommendations.length,
        templatesCount: templateReferences.length
      });

      // Cache the response (1 hour TTL)
      await this.cacheService.set(cacheKey, response, 3600);

      return response;
    } catch (error) {
      logger.error('Error generating AI response', { error });
      throw error;
    }
  }

  /**
   * Find relevant legal references based on classification
   */
  private async findLegalReferences(
    classification: ClassificationResult
  ): Promise<LegalReference[]> {
    try {
      const references: LegalReference[] = [];
      const category = classification.classification.category;

      // Get category-specific legal references
      const searchQuery = this.buildLegalSearchQuery(category, classification);

      const searchResults = await this.knowledgeService.searchLegalContent(
        searchQuery,
        {
          types: ['LAW'],
          relevanceThreshold: 0.5
        },
        1,
        5
      );

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

      logger.info('Legal references found', { count: references.length, category });

      return references;
    } catch (error) {
      logger.error('Error finding legal references', { error });
      // Return fallback references
      return this.getFallbackReferences(classification.classification.category);
    }
  }

  /**
   * Build search query for legal knowledge base
   */
  private buildLegalSearchQuery(
    category: LegalCategory,
    classification: ClassificationResult
  ): string {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    const facts = classification.context.facts.slice(0, 3);

    return [...keywords, ...facts].join(' ');
  }

  /**
   * Get mandatory legal references for each category
   */
  private getMandatoryReferences(category: LegalCategory): LegalReference[] {
    return MANDATORY_REFERENCES[category] || [];
  }

  /**
   * Generate action recommendations based on classification
   */
  private generateActionRecommendations(
    classification: ClassificationResult
  ): ActionRecommendation[] {
    const category = classification.classification.category;
    const urgency = classification.context.urgency;

    // Get base recommendations from config
    // Clone to avoid mutating the config
    const recommendations: ActionRecommendation[] = [...(ACTION_RECOMMENDATIONS_MAP[category] || ACTION_RECOMMENDATIONS_MAP.other)];

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
  private findApplicableTemplates(
    classification: ClassificationResult
  ): TemplateReference[] {
    const category = classification.classification.category;
    return TEMPLATE_MAP[category] || [];
  }

  /**
   * Generate natural language response using OpenAI
   */
  private async generateNaturalLanguageResponse(
    classification: ClassificationResult,
    userQuery: string,
    legalReferences: LegalReference[],
    actionRecommendations: ActionRecommendation[],
    conversationContext?: string
  ): Promise<string> {
    try {
      if (!this.openaiApiKey) {
        return this.generateFallbackResponse(classification, legalReferences, actionRecommendations);
      }

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(
        classification,
        userQuery,
        legalReferences,
        actionRecommendations,
        conversationContext
      );

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
    } catch (error) {
      logger.error('Error generating natural language response', { error });
      return this.generateFallbackResponse(classification, legalReferences, actionRecommendations);
    }
  }

  /**
   * Build system prompt for OpenAI
   */
  private buildSystemPrompt(): string {
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
  private buildUserPrompt(
    classification: ClassificationResult,
    userQuery: string,
    legalReferences: LegalReference[],
    actionRecommendations: ActionRecommendation[],
    conversationContext?: string
  ): string {
    let prompt = `Nutzeranfrage: ${userQuery}\n\n`;

    if (conversationContext) {
      prompt += `Bisheriger Gesprächsverlauf:\n${conversationContext}\n\n`;
    }

    prompt += `Klassifizierung:\n`;
    prompt += `- Kategorie: ${classification.classification.category}\n`;
    prompt += `- Konfidenz: ${Math.round(classification.classification.confidence * 100)}%\n`;
    prompt += `- Risiko: ${classification.classification.riskLevel}\n`;
    prompt += `- Komplexität: ${classification.classification.estimatedComplexity}\n\n`;

    if (classification.context.facts.length > 0) {
      prompt += `Relevante Fakten:\n`;
      classification.context.facts.forEach(fact => {
        prompt += `- ${fact}\n`;
      });
      prompt += '\n';
    }

    if (legalReferences.length > 0) {
      prompt += `Relevante Rechtsnormen:\n`;
      legalReferences.slice(0, 5).forEach(ref => {
        prompt += `- ${ref.reference}: ${ref.title}\n`;
      });
      prompt += '\n';
    }

    if (actionRecommendations.length > 0) {
      prompt += `Empfohlene Maßnahmen:\n`;
      actionRecommendations.forEach(action => {
        prompt += `- ${action.action}`;
        if (action.deadline) {
          prompt += ` (Frist: ${action.deadline})`;
        }
        prompt += '\n';
      });
      prompt += '\n';
    }

    if (classification.classification.escalationRecommended) {
      prompt += `⚠️ WICHTIG: Dieser Fall sollte von einem Fachanwalt geprüft werden.\n`;
      prompt += `Grund: ${classification.classification.escalationReason}\n\n`;
    }

    prompt += `Erstelle eine verständliche, strukturierte Antwort für den Nutzer.`;

    return prompt;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(payload: any): Promise<string> {
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

    const data: any = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Generate fallback response without OpenAI
   */
  private generateFallbackResponse(
    classification: ClassificationResult,
    legalReferences: LegalReference[],
    actionRecommendations: ActionRecommendation[]
  ): string {
    const categoryName = CATEGORY_NAMES[classification.classification.category] || 'Allgemeine Anfrage';

    let response = `Ich habe Ihre Anfrage als "${categoryName}" eingestuft.\n\n`;

    // Add legal references
    if (legalReferences.length > 0) {
      response += `**Rechtliche Grundlagen:**\n`;
      legalReferences.slice(0, 3).forEach(ref => {
        response += `- ${ref.reference}: ${ref.title}\n`;
      });
      response += '\n';
    }

    // Add action recommendations
    if (actionRecommendations.length > 0) {
      response += `**Empfohlene Schritte:**\n`;
      actionRecommendations.forEach((action, index) => {
        response += `${index + 1}. ${action.action}`;
        if (action.deadline) {
          response += ` (Frist: ${action.deadline})`;
        }
        response += '\n';
        if (action.details) {
          response += `   ${action.details}\n`;
        }
      });
      response += '\n';
    }

    // Add escalation warning
    if (classification.classification.escalationRecommended) {
      response += `⚠️ **Wichtiger Hinweis:**\n`;
      response += `Aufgrund der Komplexität Ihres Falls empfehle ich dringend die Konsultation eines Fachanwalts für Mietrecht.\n\n`;
    }

    response += `Haben Sie weitere Fragen zu Ihrem Fall?`;

    return response;
  }

  /**
   * Helper methods
   */
  private mapLegalType(type: string): 'law' | 'court_decision' | 'regulation' {
    const typeMap: Record<string, 'law' | 'court_decision' | 'regulation'> = {
      LAW: 'law',
      COURT_DECISION: 'court_decision',
      REGULATION: 'regulation'
    };
    return typeMap[type] || 'law';
  }

  private extractRelevantExcerpt(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Generate cache key for AI responses
   */
  private generateCacheKey(classification: ClassificationResult, userQuery: string): string {
    const category = classification.classification.category;
    const queryHash = Buffer.from(userQuery).toString('base64').substring(0, 32);
    return `ai:response:${category}:${queryHash}`;
  }

  private generateLegalUrl(reference: string): string {
    // Generate URL to gesetze-im-internet.de
    const cleanRef = reference.replace(/[§\s]/g, '').toLowerCase();
    if (cleanRef.includes('bgb')) {
      const paragraph = cleanRef.replace('bgb', '');
      return `https://www.gesetze-im-internet.de/bgb/__${paragraph}.html`;
    }
    return `https://www.gesetze-im-internet.de/`;
  }

  private getFallbackReferences(category: LegalCategory): LegalReference[] {
    return this.getMandatoryReferences(category);
  }
}

