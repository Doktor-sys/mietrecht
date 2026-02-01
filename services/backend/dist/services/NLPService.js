"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPService = void 0;
const logger_1 = require("../utils/logger");
class NLPService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        this.openaiEndpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
        if (!this.openaiApiKey) {
            logger_1.logger.warn('OpenAI API key not configured. NLP features will be limited.');
        }
    }
    /**
     * Recognize the intent and category of a user query
     */
    async recognizeIntent(query) {
        try {
            logger_1.logger.info('Recognizing intent for query', { queryLength: query.length });
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
            logger_1.logger.info('Intent recognized', { category: result.category, confidence: result.confidence });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error recognizing intent', { error });
            // Fallback to rule-based classification
            return this.fallbackIntentRecognition(query);
        }
    }
    /**
     * Extract context and relevant facts from user query
     */
    async extractContext(query, intent) {
        try {
            logger_1.logger.info('Extracting context', { category: intent.category });
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
            logger_1.logger.info('Context extracted', { factsCount: context.facts.length, urgency: context.urgency });
            return context;
        }
        catch (error) {
            logger_1.logger.error('Error extracting context', { error });
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
    async callOpenAI(payload) {
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
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    /**
     * System prompt for intent recognition
     */
    getIntentRecognitionSystemPrompt() {
        return `Du bist ein Experte für deutsches Recht. Analysiere die Nutzeranfrage und identifiziere:
1. Die Hauptabsicht (intent)
2. Die rechtliche Kategorie
3. Wichtige Entitäten (Beträge, Daten, Personen, etc.)

Kategorien:
Mietrecht:
- rent_reduction: Mietminderung wegen Mängeln
- termination: Kündigungen (fristlos oder ordentlich)
- utility_costs: Nebenkostenabrechnung
- rent_increase: Mieterhöhung
- defects: Mängel und Reparaturen
- deposit: Kaution
- modernization: Modernisierung
- other: Sonstige Mietrechtsanfragen

Arbeitsrecht:
- employment_contract: Arbeitsvertrag
- termination_protection: Kündigungsschutz
- severance: Abfindung
- vacation: Urlaub
- wage_continuation: Lohnfortzahlung
- discrimination: Diskriminierung
- working_time: Arbeitszeit

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
    getContextExtractionSystemPrompt(category) {
        // Bestimme den Rechtsbereich basierend auf der Kategorie
        const legalDomain = this.getLegalDomain(category);
        return `Du bist ein Experte für deutsches ${legalDomain}, speziell für ${category}.
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
- medium: Mietminderung, Nebenkostenstreit, Arbeitsrechtliche Konflikte
- low: Allgemeine Fragen, Informationsanfragen`;
    }
    /**
     * Bestimmt den Rechtsbereich basierend auf der Kategorie
     */
    getLegalDomain(category) {
        const employmentCategories = [
            'employment_contract', 'termination_protection', 'severance',
            'vacation', 'wage_continuation', 'discrimination', 'working_time'
        ];
        if (employmentCategories.includes(category)) {
            return 'Arbeitsrecht';
        }
        return 'Mietrecht';
    }
    /**
     * Parse intent recognition response
     */
    parseIntentResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                intent: parsed.intent || 'unknown',
                category: parsed.category || 'other',
                confidence: parsed.confidence || 0.5,
                entities: parsed.entities || []
            };
        }
        catch (error) {
            logger_1.logger.error('Error parsing intent response', { error, response });
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
    parseContextResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                facts: parsed.facts || [],
                legalIssues: parsed.legalIssues || [],
                urgency: parsed.urgency || 'medium',
                estimatedValue: parsed.estimatedValue
            };
        }
        catch (error) {
            logger_1.logger.error('Error parsing context response', { error, response });
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
    fallbackIntentRecognition(query) {
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
        // Kündigung (Mietrecht)
        if ((lowerQuery.includes('kündigung') ||
            lowerQuery.includes('kündigen') ||
            lowerQuery.includes('fristlos')) &&
            !lowerQuery.includes('arbeit') &&
            !lowerQuery.includes('beschäftig')) {
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
        // Arbeitsvertrag
        if (lowerQuery.includes('arbeitsvertrag') ||
            (lowerQuery.includes('arbeit') && lowerQuery.includes('vertrag'))) {
            return {
                intent: 'Arbeitsvertrag',
                category: 'employment_contract',
                confidence: 0.7,
                entities: []
            };
        }
        // Kündigungsschutz (Arbeitsrecht)
        if ((lowerQuery.includes('kündigung') ||
            lowerQuery.includes('kündigen') ||
            lowerQuery.includes('fristlos')) &&
            (lowerQuery.includes('arbeit') ||
                lowerQuery.includes('beschäftig'))) {
            return {
                intent: 'Kündigungsschutz',
                category: 'termination_protection',
                confidence: 0.7,
                entities: []
            };
        }
        // Urlaub
        if (lowerQuery.includes('urlaub') ||
            lowerQuery.includes('jahresurlaub') ||
            lowerQuery.includes('resturlaub')) {
            return {
                intent: 'Urlaubsanspruch',
                category: 'vacation',
                confidence: 0.7,
                entities: []
            };
        }
        // Lohnfortzahlung
        if (lowerQuery.includes('lohnfortzahlung') ||
            (lowerQuery.includes('krank') && lowerQuery.includes('lohn')) ||
            lowerQuery.includes('arbeitsunfähig')) {
            return {
                intent: 'Lohnfortzahlung',
                category: 'wage_continuation',
                confidence: 0.7,
                entities: []
            };
        }
        // Diskriminierung
        if (lowerQuery.includes('diskriminier') ||
            lowerQuery.includes('benachteilig') ||
            lowerQuery.includes('ungleichbehandl')) {
            return {
                intent: 'Diskriminierung',
                category: 'discrimination',
                confidence: 0.7,
                entities: []
            };
        }
        // Arbeitszeit
        if (lowerQuery.includes('arbeitszeit') ||
            lowerQuery.includes('überstund') ||
            lowerQuery.includes('ruhezeit')) {
            return {
                intent: 'Arbeitszeit',
                category: 'working_time',
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
exports.NLPService = NLPService;
