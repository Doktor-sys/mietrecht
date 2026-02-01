import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface LegalDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  createdAt: Date;
}

interface CategorizationResult {
  documentId: string;
  predictedCategory: string;
  confidence: number;
  suggestedTags: string[];
  keyTerms: string[];
}

export class DecisionCategorizer {
  private prisma: PrismaClient;

  // Vordefinierte Kategorien für deutsche Rechtsdokumente
  private predefinedCategories = [
    'Mietrecht',
    'Vertragsrecht',
    'Familienrecht',
    'Arbeitsrecht',
    'Strafrecht',
    'Verwaltungsrecht',
    'Handelsrecht',
    'Gesellschaftsrecht',
    'Insolvenzrecht',
    'Wettbewerbsrecht',
    'Urheberrecht',
    'Datenschutz',
    'Baurecht',
    'Erbrecht',
    'Versicherungsrecht'
  ];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Kategorisiert ein neues Dokument
   */
  async categorizeDocument(document: Omit<LegalDocument, 'category' | 'tags'>): Promise<CategorizationResult> {
    try {
      // Berechne die Kategorisierung basierend auf Regeln statt ML-Modell
      const categorization = this.calculateCategorization(document);

      return categorization;
    } catch (error) {
      logger.error('Error categorizing document:', error);
      throw new Error('Failed to categorize document');
    }
  }

  /**
   * Berechnet die Kategorisierung basierend auf Regeln
   */
  private calculateCategorization(document: Omit<LegalDocument, 'category' | 'tags'>): CategorizationResult {
    // Bestimme die Kategorie basierend auf Schlüsselwörtern
    const { predictedCategory, confidence } = this.determineCategory(document);

    // Extrahiere Schlüsselbegriffe
    const keyTerms = this.extractKeyTerms(document.content);

    // Schlage Tags vor
    const suggestedTags = this.suggestTags(predictedCategory, keyTerms);

    return {
      documentId: document.id,
      predictedCategory,
      confidence,
      suggestedTags,
      keyTerms
    };
  }

  /**
   * Bestimmt die Kategorie basierend auf Schlüsselwörtern
   */
  private determineCategory(document: Omit<LegalDocument, 'category' | 'tags'>): { predictedCategory: string, confidence: number } {
    const text = `${document.title} ${document.content}`.toLowerCase();

    // Zähle Vorkommen jeder Kategorie
    const categoryScores: Record<string, number> = {};

    for (const category of this.predefinedCategories) {
      const keywords = this.getCategoryKeywords(category);
      let score = 0;

      for (const keyword of keywords) {
        const matches = text.match(new RegExp(keyword, 'gi'));
        if (matches) {
          score += matches.length;
        }
      }

      categoryScores[category] = score;
    }

    // Finde die Kategorie mit dem höchsten Score
    let bestCategory = 'Sonstiges';
    let maxScore = 0;

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    // Berechne die Konfidenz (basierend auf der Anzahl der Treffer)
    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;

    return { predictedCategory: bestCategory, confidence };
  }

  /**
   * Gibt Schlüsselwörter für eine Kategorie zurück
   */
  private getCategoryKeywords(category: string): string[] {
    const keywords: Record<string, string[]> = {
      'Mietrecht': ['miete', 'vermieter', 'mieter', 'nebenkosten', 'kaution', 'wohnung', 'haus', 'kündigung'],
      'Vertragsrecht': ['vertrag', 'verträge', 'kündigungsfrist', 'erfüllung', 'anfechtung', 'widerruf'],
      'Familienrecht': ['ehe', 'scheidung', 'unterhalt', 'sorgerecht', 'elterngeld', 'kindergeld'],
      'Arbeitsrecht': ['arbeitnehmer', 'arbeitgeber', 'kündigungsschutz', 'urlaub', 'lohn', 'befristung'],
      'Strafrecht': ['strafrecht', 'delikt', 'verurteilung', 'anklage', 'verteidigung', 'rechtswidrig'],
      'Verwaltungsrecht': ['behörde', 'verwaltung', 'bescheid', 'widerspruch', 'klage', 'öffentlich'],
      'Datenschutz': ['datenschutz', 'ds-gvo', 'personenbezogen', 'verarbeitung', 'einwilligung', 'auskunft']
    };

    return keywords[category] || [];
  }

  /**
   * Extrahiert Schlüsselbegriffe aus dem Text
   */
  private extractKeyTerms(content: string): string[] {
    // Sehr einfache Schlüsselbegriff-Extraktion
    // Entferne Satzzeichen und wandele in Kleinbuchstaben um
    const cleanContent = content.replace(/[^\w\s]/g, '').toLowerCase();

    // Teile in Wörter
    const words = cleanContent.split(/\s+/);

    // Zähle Vorkommen
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3) { // Ignoriere kurze Wörter
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Sortiere nach Häufigkeit und nimm die Top 10
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Schlägt Tags basierend auf Kategorie und Schlüsselbegriffen vor
   */
  private suggestTags(category: string, keyTerms: string[]): string[] {
    const tags = [category];

    // Füge relevante Schlüsselbegriffe hinzu
    const relevantTerms = keyTerms.slice(0, 5);
    tags.push(...relevantTerms);

    // Füge kontextspezifische Tags hinzu
    const contextTags: Record<string, string[]> = {
      'Mietrecht': ['Miete', 'Vermieter', 'Mieter', 'Nebenkosten', 'Kaution'],
      'Vertragsrecht': ['Vertrag', 'Kündigung', 'Erfüllung', 'Anfechtung'],
      'Familienrecht': ['Ehe', 'Scheidung', 'Unterhalt', 'Sorgerecht'],
      'Arbeitsrecht': ['Arbeitnehmer', 'Arbeitgeber', 'Kündigung', 'Urlaub']
    };

    if (contextTags[category]) {
      tags.push(...contextTags[category]);
    }

    // Entferne Duplikate und leere Strings
    return [...new Set(tags.filter(tag => tag.trim() !== ''))].slice(0, 10);
  }
}
