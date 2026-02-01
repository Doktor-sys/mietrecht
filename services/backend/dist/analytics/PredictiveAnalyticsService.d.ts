import { PrismaClient } from '@prisma/client';
interface ClientBehavior {
    clientId: string;
    engagementScore: number;
    preferredCommunication: string;
    likelyToRecommend: number;
    churnRisk: number;
}
interface LegalTrend {
    topic: string;
    frequency: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    predictedPeak: Date;
}
export declare class PredictiveAnalyticsService {
    private prisma;
    private casePatterns;
    private clientBehaviors;
    private legalTrends;
    constructor(prisma: PrismaClient);
    /**
     * Analysiert Muster in vergangenen Fällen
     */
    analyzeCasePatterns(): Promise<void>;
    /**
     * Berechnet die durchschnittliche Dauer von Fällen
     */
    private calculateAverageDuration;
    /**
     * Berechnet die Erfolgsrate von Fällen
     */
    private calculateSuccessRate;
    /**
     * Identifiziert häufig verwendete Dokumente
     */
    private identifyCommonDocuments;
    /**
     * Analysiert saisonale Trends
     */
    private analyzeSeasonalTrends;
    /**
     * Analysiert Mandantenverhalten
     */
    analyzeClientBehavior(): Promise<void>;
    /**
     * Berechnet den Engagement-Score eines Mandanten
     */
    private calculateEngagementScore;
    /**
     * Bestimmt die bevorzugte Kommunikationsmethode
     */
    private determinePreferredCommunication;
    /**
     * Sagt voraus, wie wahrscheinlich ein Mandant weiterempfiehlt
     */
    private predictLikelyToRecommend;
    /**
     * Bewertet das Churn-Risiko eines Mandanten
     */
    private assessChurnRisk;
    /**
     * Analysiert rechtliche Trends
     */
    analyzeLegalTrends(): Promise<void>;
    /**
     * Generiert Predictive Insights
     */
    generatePredictiveInsights(): Promise<any>;
    /**
     * Sagt die Dauer eines neuen Falls voraus
     */
    predictCaseDuration(caseData: {
        category: string;
        complexity: number;
    }): number;
    /**
     * Sagt den Erfolg eines Falls voraus
     */
    predictCaseSuccess(caseData: {
        category: string;
        clientHistory: any;
    }): number;
    /**
     * Identifiziert benötigte Dokumente für einen Fall
     */
    predictRequiredDocuments(caseType: string): string[];
    /**
     * Sagt saisonale Trends voraus
     */
    predictSeasonalTrends(caseType: string): Record<string, number>;
    /**
     * Identifiziert Hochrisiko-Mandanten
     */
    identifyHighRiskClients(): ClientBehavior[];
    /**
     * Identifiziert Mandanten mit hoher Weiterempfehlungswahrscheinlichkeit
     */
    identifyPromoters(): ClientBehavior[];
    /**
     * Identifiziert aufkommende rechtliche Themen
     */
    identifyEmergingTrends(): LegalTrend[];
}
export {};
