import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface LegalCaseData {
  id: string;
  category: string;
  jurisdiction: string;
  filedDate: Date;
  resolvedDate?: Date;
  outcome: string;
  complexity: number; // 1-10
  partiesInvolved: number;
  evidenceCount: number;
  legalArguments: string[];
  durationDays?: number;
}

interface PredictionResult {
  caseId: string;
  predictedOutcome: string;
  confidence: number;
  estimatedDuration: number;
  factors: {
    categoryImpact: number;
    jurisdictionImpact: number;
    complexityImpact: number;
    evidenceImpact: number;
  };
}

export class LegalDecisionPredictor {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Sagt das Ergebnis eines neuen Falls voraus
   */
  async predictOutcome(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & { id?: string }): Promise<PredictionResult> {
    try {
      // Berechne die Vorhersage basierend auf Regeln statt ML-Modell
      const prediction = this.calculatePrediction(caseData);

      return prediction;
    } catch (error) {
      logger.error('Error predicting case outcome:', error);
      throw new Error('Failed to predict case outcome');
    }
  }

  /**
   * Berechnet die Vorhersage basierend auf Regeln
   */
  private calculatePrediction(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & { id?: string }): PredictionResult {
    // Berechne das vorhergesagte Ergebnis basierend auf verschiedenen Faktoren
    const { predictedOutcome, confidence } = this.predictCaseOutcome(caseData);

    // Schätze die Dauer
    const estimatedDuration = this.estimateDuration(caseData);

    // Berechne Einflussfaktoren
    const factors = this.calculateFactors(caseData);

    return {
      caseId: caseData.id || 'new-case',
      predictedOutcome,
      confidence,
      estimatedDuration,
      factors
    };
  }

  /**
   * Sagt das Ergebnis eines Falls voraus
   */
  private predictCaseOutcome(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & { id?: string }): { predictedOutcome: string, confidence: number } {
    // Sehr vereinfachte Regel-basierte Vorhersage
    let score = 0.5; // Neutraler Startwert

    // Komplexität beeinflusst das Ergebnis
    score += (caseData.complexity - 5) * 0.02; // Höhere Komplexität senkt leicht die Erfolgschancen

    // Anzahl der Beweismittel beeinflusst das Ergebnis
    if (caseData.evidenceCount > 10) {
      score += 0.1; // Mehr Beweise erhöhen die Erfolgschancen
    } else if (caseData.evidenceCount < 3) {
      score -= 0.1; // Weniger Beweise senken die Erfolgschancen
    }

    // Kategorie beeinflusst das Ergebnis
    if (caseData.category === 'criminal') {
      score -= 0.1; // Straffälle sind tendenziell schwieriger
    } else if (caseData.category === 'contract') {
      score += 0.05; // Vertragsfälle sind tendenziell erfolgreicher
    }

    // Begrenze den Score auf 0-1
    score = Math.max(0, Math.min(1, score));

    // Bestimme das Ergebnis basierend auf dem Score
    let predictedOutcome: string;
    if (score > 0.6) {
      predictedOutcome = 'won';
    } else if (score < 0.4) {
      predictedOutcome = 'lost';
    } else {
      predictedOutcome = 'pending';
    }

    // Konfidenz basierend auf der Entfernung vom neutralen Punkt
    const confidence = Math.abs(score - 0.5) * 2;

    return { predictedOutcome, confidence };
  }

  /**
   * Schätzt die Dauer eines Falls
   */
  private estimateDuration(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & { id?: string }): number {
    // Sehr vereinfachte Schätzung basierend auf Komplexität
    const baseDuration = 30; // Tage
    const complexityFactor = caseData.complexity * 10;
    const evidenceFactor = caseData.evidenceCount * 2;

    return baseDuration + complexityFactor + evidenceFactor;
  }

  /**
   * Berechnet die Einflussfaktoren
   */
  private calculateFactors(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & { id?: string }): PredictionResult['factors'] {
    return {
      categoryImpact: caseData.category === 'criminal' ? 0.8 :
        caseData.category === 'property' ? 0.6 :
          caseData.category === 'contract' ? 0.5 : 0.3,
      jurisdictionImpact: caseData.jurisdiction === 'DE' ? 0.7 : 0.5,
      complexityImpact: caseData.complexity / 10,
      evidenceImpact: Math.min(1, caseData.evidenceCount / 20)
    };
  }
}
