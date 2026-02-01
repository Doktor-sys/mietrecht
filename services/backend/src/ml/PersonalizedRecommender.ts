import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface LawyerProfile {
  id: string;
  specialization: string[];
  experienceYears: number;
  preferredCategories: string[];
  location: string;
  languages: string[];
}

interface LegalCase {
  id: string;
  title: string;
  description: string;
  category: string;
  complexity: number;
  jurisdiction: string;
  createdAt: Date;
}

interface Recommendation {
  caseId: string;
  score: number;
  reasoning: string;
  factors: {
    categoryMatch: number;
    specializationMatch: number;
    experienceRelevance: number;
    locationRelevance: number;
  };
}

export class PersonalizedRecommender {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generiert personalisierte Empfehlungen für einen Anwalt
   */
  async recommendCases(lawyerId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      // Hole Anwaltsprofil
      const lawyer = await this.prisma.user.findUnique({
        where: { id: lawyerId },
        include: { profile: true, preferences: true }
      });
      
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }
      
      // Hole aktuelle Fälle, die noch nicht zugewiesen sind
      const availableCases = await this.prisma.case.findMany({
        where: {
          userId: undefined,
          status: {
            not: 'CLOSED'
          }
        },
        take: 100 // Begrenze auf 100 Fälle für Performance
      });
      
      // Berechne Empfehlungswerte für jeden Fall
      const recommendations: Recommendation[] = [];
      
      for (const legalCase of availableCases) {
        try {
          // Erstelle Feature-Vektor
          const featureVector = this.createFeatureVector(lawyer, legalCase);
          
          // Berechne Score basierend auf Feature-Übereinstimmung
          const score = this.calculateScore(featureVector);
          
          // Generiere Begründung
          const reasoning = this.generateReasoning(lawyer, legalCase, featureVector);
          
          // Extrahiere Faktoren
          const factors = {
            categoryMatch: featureVector[0],
            specializationMatch: 0.7, // Platzhalter
            experienceRelevance: featureVector[1],
            locationRelevance: featureVector[2]
          };
          
          recommendations.push({
            caseId: legalCase.id,
            score,
            reasoning,
            factors
          });
        } catch (error) {
          logger.error(`Error generating recommendation for case ${legalCase.id}:`, error);
        }
      }
      
      // Sortiere nach Score und begrenze auf das Limit
      recommendations.sort((a, b) => b.score - a.score);
      
      return recommendations.slice(0, limit);
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Erstellt einen Feature-Vektor für Anwalt und Fall
   */
  private createFeatureVector(lawyer: any, legalCase: any): number[] {
    // Vereinfachte Feature-Extraktion
    const features = [
      // Kategorienübereinstimmung (0-1)
      lawyer.preferences?.legalTopics?.includes(legalCase.category) ? 1 : 0,
      
      // Erfahrung (normalisiert auf 0-1, angenommen max. 40 Jahre)
      Math.min(1, (lawyer.profile?.yearsOfExperience || 0) / 40),
      
      // Standortübereinstimmung (0-1)
      lawyer.profile?.location === legalCase.jurisdiction ? 1 : 0,
      
      // Sprachübereinstimmung (0-1)
      lawyer.preferences?.languages?.includes('de') ? 1 : 0,
      
      // Fallkomplexität (normalisiert auf 0-1)
      (legalCase.complexity || 5) / 10,
      
      // Falldauer (normalisiert auf 0-1, angenommen max. 365 Tage)
      0.5, // Platzhalter
      
      // Anzahl vergangener Fälle in dieser Kategorie (0-1, angenommen max. 100)
      0.3, // Platzhalter
      
      // Bewertung des Anwalts (0-1, angenommen max. 5 Sterne)
      0.8, // Platzhalter
      
      // Verfügbarkeit (0-1)
      0.9, // Platzhalter
      
      // Spezialisierungstiefe (0-1)
      0.7  // Platzhalter
    ];
    
    return features;
  }

  /**
   * Berechnet den Score basierend auf dem Feature-Vektor
   */
  private calculateScore(features: number[]): number {
    // Gewichtete Summe der Features
    const weights = [0.3, 0.2, 0.15, 0.1, 0.05, 0.05, 0.05, 0.05, 0.03, 0.02];
    
    let score = 0;
    for (let i = 0; i < features.length && i < weights.length; i++) {
      score += features[i] * weights[i];
    }
    
    // Normalisiere auf 0-1
    return Math.min(1, score);
  }

  /**
   * Generiert eine Begründung für die Empfehlung
   */
  private generateReasoning(lawyer: any, legalCase: any, features: number[]): string {
    const reasons: string[] = [];
    
    if (features[0] > 0.5) {
      reasons.push(`Die Kategorie "${legalCase.category}" passt zu Ihren bevorzugten Rechtsgebieten.`);
    }
    
    if (features[1] > 0.7) {
      reasons.push(`Ihre Erfahrung von ${(lawyer.profile?.yearsOfExperience || 0)} Jahren ist relevant für diesen Fall.`);
    }
    
    if (features[2] > 0.5) {
      reasons.push(`Der Fall befindet sich in Ihrer Region (${legalCase.jurisdiction}).`);
    }
    
    if (features[4] > 0.7) {
      reasons.push(`Die Komplexität des Falls (${legalCase.complexity}/10) entspricht Ihrem Niveau.`);
    }
    
    if (reasons.length === 0) {
      reasons.push('Dieser Fall wurde aufgrund allgemeiner Übereinstimmung empfohlen.');
    }
    
    return reasons.join(' ');
  }
}