import { logger } from '../utils/logger';

export interface IntentRecognitionResult {
  intent: string;
  category: LegalCategory;
  confidence: number;
  entities: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface ContextExtractionResult {
  facts: string[];
  legalIssues: string[];
  urgency: 'low' | 'medium' | 'high';
  estimatedValue?: number;
}

export type LegalCategory = 
  | 'rent_reduction'
  | 'termination'
  | 'utility_costs'
  | 'rent_increase'
  | 'defects'
  | 'deposit'
  | 'modernization'
  | 'other';

export class NLPService {
  private openaiApiKey: string;
  private openaiEndpoint: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiEndpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
    
    if (!this.openaiApiKey) {
      logger.warn('OpenAI API key not configured. NLP features will be limited.');
    }
  }

  /**
   * Recognize the intent and category of a user query
   */
  async recognizeIntent(query: string): Promise<IntentRecognitionResult> {
    try {
      logger.info('Recognizing intent for query', { queryLength: query.length });

      // Use OpenAI for intent recognition
      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getIntentRecognitionSystemPrompt()
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const result = this.parseIntentResponse(response);
      logger.info('Intent recognized', { category: result.category, confidence: result.confidence });
      
      return result;
    } catch (error) {
      logger.error('Error recognizing intent', { error });
      // Fallback to rule-based classification
      return this.fallbackIntentRecognition(query);
    }
  }

  /**
   * Extract context and relevant facts from user query
   */
  async extractContext(query: string, intent: IntentRecognitionResult): Promise<ContextExtractionResult> {
    try {
      logger.info('Extracting context', { category: intent.category });

      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getContextExtractionSystemPrompt(intent.category)
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const context = this.parseContextResponse(response);
      logger.info('Context extracted', { factsCount: context.facts.length, urgency: context.urgency });
      
      return context;
    } catch (error) {
      logger.error('Error extracting context', { error });
      return {
        facts: [],
        legalIssues: [],
        urgency: 'medium'
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(payload: any): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
   * System prompt for intent recognition
   */
  private getIntentRecognitionSystemPrompt(): string {
    return `Du bist ein Experte für deutsches Mietrecht. Analysiere die Nutzeranfrage und identifiziere:
1. Die Hauptabsicht (intent)
2. Die rechtliche Kategorie
3. Wichtige Entitäten (Beträge, Daten, Personen, etc.)

Kategorien:
- rent_reduction: Mietminderung wegen Mängeln
- termination: Kündigungen (fristlos oder ordentlich)
- utility_costs: Nebenkostenabrechnung
- rent_increase: Mieterhöhung
- defects: Mängel und Reparaturen
- deposit: Kaution
- modernization: Modernisierung
- other: Sonstige Anfragen

Antworte im JSON-Format:
{
  "intent": "kurze Beschreibung der Absicht",
  "category": "kategorie",
  "confidence": 0.0-1.0,
  "entities": [
    {"type": "amount|date|person|location", "value": "wert", "confidence": 0.0-1.0}
  ]
}`;
  }

  /**
   * System prompt for context extraction
   */
  private getContextExtractionSystemPrompt(category: LegalCategory): string {
    return `Du bist ein Experte für deutsches Mietrecht, speziell für ${category}.
Extrahiere aus der Nutzeranfrage:
1. Relevante Fakten
2. Rechtliche Probleme
3. Dringlichkeit (low/medium/high)
4. Geschätzter Streitwert (falls relevant)

Antworte im JSON-Format:
{
  "facts": ["Fakt 1", "Fakt 2", ...],
  "legalIssues": ["Problem 1", "Problem 2", ...],
  "urgency": "low|medium|high",
  "estimatedValue": 0
}

Dringlichkeit:
- high: Kündigungen, fristlose Maßnahmen, Gesundheitsgefahr
- medium: Mietminderung, Nebenkostenstreit
- low: Allgemeine Fragen, Informationsanfragen`;
  }

  /**
   * Parse intent recognition response
   */
  private parseIntentResponse(response: string): IntentRecognitionResult {
    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent || 'unknown',
        category: parsed.category || 'other',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || []
      };
    } catch (error) {
      logger.error('Error parsing intent response', { error, response });
      return {
        intent: 'unknown',
        category: 'other',
        confidence: 0.3,
        entities: []
      };
    }
  }

  /**
   * Parse context extraction response
   */
  private parseContextResponse(response: string): ContextExtractionResult {
    try {
      const parsed = JSON.parse(response);
      return {
        facts: parsed.facts || [],
        legalIssues: parsed.legalIssues || [],
        urgency: parsed.urgency || 'medium',
        estimatedValue: parsed.estimatedValue
      };
    } catch (error) {
      logger.error('Error parsing context response', { error, response });
      return {
        facts: [],
        legalIssues: [],
        urgency: 'medium'
      };
    }
  }

  /**
   * Fallback rule-based intent recognition
   */
  private fallbackIntentRecognition(query: string): IntentRecognitionResult {
    const lowerQuery = query.toLowerCase();
    
    // Mietminderung
    if (lowerQuery.includes('mietminderung') || 
        (lowerQuery.includes('heizung') && lowerQuery.includes('kaputt')) ||
        lowerQuery.includes('schimmel') ||
        lowerQuery.includes('mangel')) {
      return {
        intent: 'Mietminderung wegen Mängeln',
        category: 'rent_reduction',
        confidence: 0.7,
        entities: []
      };
    }
    
    // Kündigung
    if (lowerQuery.includes('kündigung') || 
        lowerQuery.includes('kündigen') ||
        lowerQuery.includes('fristlos')) {
      return {
        intent: 'Kündigung',
        category: 'termination',
        confidence: 0.7,
        entities: []
      };
    }
    
    // Nebenkosten
    if (lowerQuery.includes('nebenkosten') || 
        lowerQuery.includes('betriebskosten') ||
        lowerQuery.includes('nebenkostenabrechnung')) {
      return {
        intent: 'Nebenkostenabrechnung',
        category: 'utility_costs',
        confidence: 0.7,
        entities: []
      };
    }
    
    // Mieterhöhung
    if (lowerQuery.includes('mieterhöhung') || 
        lowerQuery.includes('miete erhöhen')) {
      return {
        intent: 'Mieterhöhung',
        category: 'rent_increase',
        confidence: 0.7,
        entities: []
      };
    }
    
    // Default
    return {
      intent: 'Allgemeine Anfrage',
      category: 'other',
      confidence: 0.5,
      entities: []
    };
  }
}
