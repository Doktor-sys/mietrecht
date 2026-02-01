import { PrismaClient } from '@prisma/client';
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
export declare class PersonalizedRecommender {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generiert personalisierte Empfehlungen für einen Anwalt
     */
    recommendCases(lawyerId: string, limit?: number): Promise<Recommendation[]>;
    /**
     * Erstellt einen Feature-Vektor für Anwalt und Fall
     */
    private createFeatureVector;
    /**
     * Berechnet den Score basierend auf dem Feature-Vektor
     */
    private calculateScore;
    /**
     * Generiert eine Begründung für die Empfehlung
     */
    private generateReasoning;
}
export {};
