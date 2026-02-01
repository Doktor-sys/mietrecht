import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { Case, Document, User } from '@prisma/client';

interface CasePattern {
  caseType: string;
  averageDuration: number;
  successRate: number;
  commonDocuments: string[];
  seasonalTrends: Record<string, number>;
}

interface ClientBehavior {
  clientId: string;
  engagementScore: number;
  preferredCommunication: string;
  likelyToRecommend: number; // 0-100
  churnRisk: number; // 0-100
}

interface LegalTrend {
  topic: string;
  frequency: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  predictedPeak: Date;
}

export class PredictiveAnalyticsService {
  private prisma: PrismaClient;
  private casePatterns: Map<string, CasePattern>;
  private clientBehaviors: Map<string, ClientBehavior>;
  private legalTrends: LegalTrend[];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.casePatterns = new Map();
    this.clientBehaviors = new Map();
    this.legalTrends = [];
  }

  /**
   * Analysiert Muster in vergangenen Fällen
   */
  async analyzeCasePatterns(): Promise<void> {
    try {
      logger.info('Starting case pattern analysis');
      
      // Hole alle abgeschlossenen Fälle der letzten 2 Jahre
      const cases = await this.prisma.case.findMany({
        where: {
          status: 'CLOSED',
          createdAt: {
            gte: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          documents: true
        }
      });
      
      // Gruppiere Fälle nach Typ
      const casesByType: Record<string, any[]> = {};
      cases.forEach(caseItem => {
        if (!casesByType[caseItem.category || 'uncategorized']) {
          casesByType[caseItem.category || 'uncategorized'] = [];
        }
        casesByType[caseItem.category || 'uncategorized'].push(caseItem);
      });
      
      // Analysiere jedes Fallmuster
      for (const [caseType, caseList] of Object.entries(casesByType)) {
        const pattern: CasePattern = {
          caseType,
          averageDuration: this.calculateAverageDuration(caseList),
          successRate: this.calculateSuccessRate(caseList),
          commonDocuments: this.identifyCommonDocuments(caseList),
          seasonalTrends: this.analyzeSeasonalTrends(caseList)
        };
        
        this.casePatterns.set(caseType, pattern);
      }
      
      logger.info(`Analyzed patterns for ${this.casePatterns.size} case types`);
    } catch (error) {
      logger.error('Error analyzing case patterns:', error);
      throw error;
    }
  }

  /**
   * Berechnet die durchschnittliche Dauer von Fällen
   */
  private calculateAverageDuration(cases: any[]): number {
    if (cases.length === 0) return 0;
    
    const durations = cases
      .filter(caseItem => caseItem.closedAt && caseItem.createdAt)
      .map(caseItem => {
        return (caseItem.closedAt!.getTime() - caseItem.createdAt!.getTime()) / (1000 * 60 * 60 * 24); // in Tagen
      });
    
    if (durations.length === 0) return 0;
    
    const sum = durations.reduce((acc, duration) => acc + duration, 0);
    return sum / durations.length;
  }

  /**
   * Berechnet die Erfolgsrate von Fällen
   */
  private calculateSuccessRate(cases: any[]): number {
    if (cases.length === 0) return 0;
    
    const successfulCases = cases.filter(caseItem => caseItem.outcome === 'SUCCESS').length;
    return (successfulCases / cases.length) * 100;
  }

  /**
   * Identifiziert häufig verwendete Dokumente
   */
  private identifyCommonDocuments(cases: any[]): string[] {
    const documentTypes: Record<string, number> = {};
    
    cases.forEach(caseItem => {
      caseItem.documents.forEach((doc: any) => {
        documentTypes[doc.documentType] = (documentTypes[doc.documentType] || 0) + 1;
      });
    });
    
    // Sortiere nach Häufigkeit und gib die Top 5 zurück
    return Object.entries(documentTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
  }

  /**
   * Analysiert saisonale Trends
   */
  private analyzeSeasonalTrends(cases: any[]): Record<string, number> {
    const trends: Record<string, number> = {
      spring: 0,
      summer: 0,
      autumn: 0,
      winter: 0
    };
    
    cases.forEach(caseItem => {
      const month = caseItem.createdAt.getMonth();
      if (month >= 2 && month <= 4) {
        trends.spring++;
      } else if (month >= 5 && month <= 7) {
        trends.summer++;
      } else if (month >= 8 && month <= 10) {
        trends.autumn++;
      } else {
        trends.winter++;
      }
    });
    
    return trends;
  }

  /**
   * Analysiert Mandantenverhalten
   */
  async analyzeClientBehavior(): Promise<void> {
    try {
      logger.info('Starting client behavior analysis');
      
      // Hole alle aktiven Mandanten
      const clients = await this.prisma.user.findMany({
        where: {
          isActive: true
        },
        include: {
          cases: true,
          feedback: true
        }
      });
      
      // Analysiere Verhalten jedes Mandanten
      for (const client of clients) {
        const behavior: ClientBehavior = {
          clientId: client.id,
          engagementScore: this.calculateEngagementScore(client),
          preferredCommunication: this.determinePreferredCommunication(client),
          likelyToRecommend: this.predictLikelyToRecommend(client),
          churnRisk: this.assessChurnRisk(client)
        };
        
        this.clientBehaviors.set(client.id, behavior);
      }
      
      logger.info(`Analyzed behavior for ${this.clientBehaviors.size} clients`);
    } catch (error) {
      logger.error('Error analyzing client behavior:', error);
      throw error;
    }
  }

  /**
   * Berechnet den Engagement-Score eines Mandanten
   */
  private calculateEngagementScore(client: any): number {
    let score = 0;
    
    // Punkte für aktive Fälle
    score += client.cases.filter((c: any) => c.status !== 'CLOSED').length * 10;
    
    // Punkte für Feedback
    score += client.feedback.length * 5;
    
    // Punkte für Zahlungen
    score += client.payments.length * 3;
    
    // Punkte für aktive Kommunikation
    // (Annahme: Nachrichten/Kommunikation ist in anderen Tabellen gespeichert)
    
    // Normalisiere auf 0-100
    return Math.min(score, 100);
  }

  /**
   * Bestimmt die bevorzugte Kommunikationsmethode
   */
  private determinePreferredCommunication(client: any): string {
    // Analyse basierend auf vergangener Kommunikation
    // Dies ist eine vereinfachte Implementierung
    
    // Wenn Telefonnummer vorhanden, wahrscheinlich Telefon
    if (client.phone) return 'phone';
    
    // Ansonsten E-Mail
    return 'email';
  }

  /**
   * Sagt voraus, wie wahrscheinlich ein Mandant weiterempfiehlt
   */
  private predictLikelyToRecommend(client: any): number {
    let score = 50; // Basiswert
    
    // Positive Faktoren
    if (client.cases.some((c: any) => c.outcome === 'SUCCESS')) {
      score += 20;
    }
    
    const positiveFeedback = client.feedback.filter((f: any) => f.rating >= 4).length;
    score += positiveFeedback * 5;
    
    // Negative Faktoren
    const negativeFeedback = client.feedback.filter((f: any) => f.rating <= 2).length;
    score -= negativeFeedback * 10;
    
    const failedPayments = client.payments.filter((p: any) => p.status === 'FAILED').length;
    score -= failedPayments * 5;
    
    // Begrenze auf 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Bewertet das Churn-Risiko eines Mandanten
   */
  private assessChurnRisk(client: any): number {
    let risk = 30; // Basiswert
    
    // Hohe Inaktivität erhöht Risiko
    if (client.cases.length === 0) {
      risk += 30;
    }
    
    // Lange Zeit ohne Aktivität erhöht Risiko
    if (client.lastLoginAt) {
      const daysSinceLastLogin = (Date.now() - client.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastLogin > 180) {
        risk += 20;
      } else if (daysSinceLastLogin > 90) {
        risk += 10;
      }
    }
    
    // Negative Feedback erhöht Risiko
    const negativeFeedback = client.feedback.filter((f: any) => f.rating <= 2).length;
    risk += negativeFeedback * 10;
    
    // Zahlungsprobleme erhöhen Risiko
    const failedPayments = client.payments.filter((p: any) => p.status === 'FAILED').length;
    risk += failedPayments * 5;
    
    // Abgeschlossene Fälle senken Risiko
    const closedCases = client.cases.filter((c: any) => c.status === 'CLOSED').length;
    risk -= closedCases * 5;
    
    // Begrenze auf 0-100
    return Math.max(0, Math.min(100, risk));
  }

  /**
   * Analysiert rechtliche Trends
   */
  async analyzeLegalTrends(): Promise<void> {
    try {
      logger.info('Starting legal trend analysis');
      
      // Hole alle Dokumente der letzten 6 Monate
      const recentDocuments = await this.prisma.document.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          title: true,
          createdAt: true,
          case: {
            select: {
              category: true
            }
          }
        }
      });
      
      // Extrahiere Themen und analysiere Trends
      const topics: Record<string, { count: number; dates: Date[] }> = {};
      
      recentDocuments.forEach(doc => {
        // Vereinfachte Themenextraktion
        // In einer echten Implementierung würden wir NLP verwenden
        const words = doc.title.toLowerCase().split(/\s+/);
        const legalTerms = words.filter(word => 
          ['miete', 'vertrag', 'kündigung', 'mieter', 'vermieter', 'hausordnung'].includes(word)
        );
        
        legalTerms.forEach(term => {
          if (!topics[term]) {
            topics[term] = { count: 0, dates: [] };
          }
          topics[term].count++;
          topics[term].dates.push(doc.createdAt);
        });
      });
      
      // Analysiere Trends für jedes Thema
      this.legalTrends = Object.entries(topics).map(([topic, data]) => {
        // Berechne Trend-Richtung (vereinfacht)
        const firstHalf = data.dates.filter(date => 
          date.getTime() < Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
        ).length;
        
        const secondHalf = data.dates.filter(date => 
          date.getTime() >= Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
        ).length;
        
        let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (secondHalf > firstHalf * 1.5) {
          trendDirection = 'increasing';
        } else if (firstHalf > secondHalf * 1.5) {
          trendDirection = 'decreasing';
        }
        
        // Vorhersage des nächsten Peaks (vereinfacht)
        const predictedPeak = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Nächster Monat
        
        return {
          topic,
          frequency: data.count,
          trendDirection,
          predictedPeak
        };
      });
      
      logger.info(`Identified ${this.legalTrends.length} legal trends`);
    } catch (error) {
      logger.error('Error analyzing legal trends:', error);
      throw error;
    }
  }

  /**
   * Generiert Predictive Insights
   */
  async generatePredictiveInsights(): Promise<any> {
    try {
      // Führe alle Analysen durch
      await this.analyzeCasePatterns();
      await this.analyzeClientBehavior();
      await this.analyzeLegalTrends();
      
      // Kombiniere die Ergebnisse
      const insights = {
        casePredictions: Array.from(this.casePatterns.values()),
        clientPredictions: Array.from(this.clientBehaviors.values()),
        legalTrends: this.legalTrends,
        generatedAt: new Date()
      };
      
      // Speichere die Insights in der Datenbank (vereinfacht)
      logger.info('Generated predictive insights report');
      return insights;
    } catch (error) {
      logger.error('Error generating predictive insights:', error);
      throw error;
    }
  }

  /**
   * Sagt die Dauer eines neuen Falls voraus
   */
  predictCaseDuration(caseData: { category: string; complexity: number }): number {
    const pattern = this.casePatterns.get(caseData.category);
    
    if (!pattern) {
      // Standarddauer falls kein Muster gefunden
      return 30; // 30 Tage
    }
    
    // Basisdauer aus Muster
    let predictedDuration = pattern.averageDuration;
    
    // Anpassung basierend auf Komplexität
    // Komplexität 1-10, wobei 1 einfach und 10 sehr komplex ist
    const complexityFactor = caseData.complexity / 5; // 0.2 bis 2.0
    predictedDuration *= complexityFactor;
    
    return Math.round(predictedDuration);
  }

  /**
   * Sagt den Erfolg eines Falls voraus
   */
  predictCaseSuccess(caseData: { category: string; clientHistory: any }): number {
    const pattern = this.casePatterns.get(caseData.category);
    
    if (!pattern) {
      // Standardsuccessrate falls kein Muster gefunden
      return 70; // 70%
    }
    
    // Basisrate aus Muster
    let successRate = pattern.successRate;
    
    // Anpassung basierend auf Mandantenhistorie
    if (caseData.clientHistory.previousCases) {
      const previousSuccessRate = caseData.clientHistory.previousCases.filter((c: any) => 
        c.outcome === 'SUCCESS'
      ).length / caseData.clientHistory.previousCases.length;
      
      // Gewichtete Kombination
      successRate = (successRate * 0.7) + (previousSuccessRate * 0.3);
    }
    
    return Math.round(successRate);
  }

  /**
   * Identifiziert benötigte Dokumente für einen Fall
   */
  predictRequiredDocuments(caseType: string): string[] {
    const pattern = this.casePatterns.get(caseType);
    
    if (!pattern) {
      return ['Standard-Dokumente'];
    }
    
    return pattern.commonDocuments;
  }

  /**
   * Sagt saisonale Trends voraus
   */
  predictSeasonalTrends(caseType: string): Record<string, number> {
    const pattern = this.casePatterns.get(caseType);
    
    if (!pattern) {
      return { spring: 25, summer: 25, autumn: 25, winter: 25 };
    }
    
    return pattern.seasonalTrends;
  }

  /**
   * Identifiziert Hochrisiko-Mandanten
   */
  identifyHighRiskClients(): ClientBehavior[] {
    return Array.from(this.clientBehaviors.values()).filter(
      client => client.churnRisk > 70
    );
  }

  /**
   * Identifiziert Mandanten mit hoher Weiterempfehlungswahrscheinlichkeit
   */
  identifyPromoters(): ClientBehavior[] {
    return Array.from(this.clientBehaviors.values()).filter(
      client => client.likelyToRecommend > 80
    );
  }

  /**
   * Identifiziert aufkommende rechtliche Themen
   */
  identifyEmergingTrends(): LegalTrend[] {
    return this.legalTrends.filter(trend => 
      trend.trendDirection === 'increasing' && 
      trend.frequency > 10
    );
  }
}