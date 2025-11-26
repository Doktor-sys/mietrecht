import { NLPService, LegalCategory } from '../services/NLPService';

// Mock fetch globally
global.fetch = jest.fn();

describe('NLPService', () => {
  let nlpService: NLPService;

  beforeEach(() => {
    nlpService = new NLPService();
    jest.clearAllMocks();
  });

  describe('recognizeIntent', () => {
    it('should recognize rent reduction intent', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'Mietminderung wegen Heizungsausfall',
              category: 'rent_reduction',
              confidence: 0.9,
              entities: [
                { type: 'issue', value: 'Heizungsausfall', confidence: 0.95 }
              ]
            })
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await nlpService.recognizeIntent('Meine Heizung ist seit 3 Wochen kaputt');

      expect(result.category).toBe('rent_reduction');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.entities).toHaveLength(1);
    });

    it('should recognize termination intent', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'Fristlose Kündigung durch Vermieter',
              category: 'termination',
              confidence: 0.95,
              entities: []
            })
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await nlpService.recognizeIntent('Vermieter will mir fristlos kündigen');

      expect(result.category).toBe('termination');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should fallback to rule-based recognition on API error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await nlpService.recognizeIntent('Meine Heizung ist kaputt');

      expect(result.category).toBe('rent_reduction');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle utility costs queries', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await nlpService.recognizeIntent('Meine Nebenkostenabrechnung ist zu hoch');

      expect(result.category).toBe('utility_costs');
    });
  });

  describe('extractContext', () => {
    it('should extract context from rent reduction query', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              facts: [
                'Heizung seit 3 Wochen defekt',
                'Vermieter wurde informiert',
                'Keine Reparatur erfolgt'
              ],
              legalIssues: [
                'Mietminderung nach § 536 BGB möglich',
                'Fristsetzung erforderlich'
              ],
              urgency: 'medium',
              estimatedValue: 500
            })
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const intent = {
        intent: 'Mietminderung',
        category: 'rent_reduction' as LegalCategory,
        confidence: 0.9,
        entities: []
      };

      const result = await nlpService.extractContext(
        'Meine Heizung ist seit 3 Wochen kaputt. Ich habe den Vermieter informiert, aber es passiert nichts.',
        intent
      );

      expect(result.facts).toHaveLength(3);
      expect(result.legalIssues.length).toBeGreaterThan(0);
      expect(result.urgency).toBe('medium');
      expect(result.estimatedValue).toBe(500);
    });

    it('should handle high urgency cases', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              facts: ['Fristlose Kündigung erhalten'],
              legalIssues: ['Rechtmäßigkeit der Kündigung prüfen'],
              urgency: 'high',
              estimatedValue: 10000
            })
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const intent = {
        intent: 'Kündigung',
        category: 'termination' as LegalCategory,
        confidence: 0.95,
        entities: []
      };

      const result = await nlpService.extractContext(
        'Ich habe eine fristlose Kündigung erhalten',
        intent
      );

      expect(result.urgency).toBe('high');
    });

    it('should return default context on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const intent = {
        intent: 'Test',
        category: 'other' as LegalCategory,
        confidence: 0.5,
        entities: []
      };

      const result = await nlpService.extractContext('Test query', intent);

      expect(result.facts).toEqual([]);
      expect(result.legalIssues).toEqual([]);
      expect(result.urgency).toBe('medium');
    });
  });

  describe('fallback intent recognition', () => {
    beforeEach(() => {
      // Force API errors to test fallback
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    });

    it('should recognize rent reduction keywords', async () => {
      const result = await nlpService.recognizeIntent('Ich habe Schimmel in der Wohnung');
      expect(result.category).toBe('rent_reduction');
    });

    it('should recognize termination keywords', async () => {
      const result = await nlpService.recognizeIntent('Kann ich fristlos kündigen?');
      expect(result.category).toBe('termination');
    });

    it('should recognize utility costs keywords', async () => {
      const result = await nlpService.recognizeIntent('Betriebskosten zu hoch');
      expect(result.category).toBe('utility_costs');
    });

    it('should recognize rent increase keywords', async () => {
      const result = await nlpService.recognizeIntent('Vermieter will Miete erhöhen');
      expect(result.category).toBe('rent_increase');
    });

    it('should default to other for unknown queries', async () => {
      const result = await nlpService.recognizeIntent('Wie ist das Wetter?');
      expect(result.category).toBe('other');
    });
  });
});
