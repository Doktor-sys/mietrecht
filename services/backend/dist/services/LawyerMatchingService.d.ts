import { PrismaClient, Lawyer } from '@prisma/client';
export interface LawyerSearchCriteria {
    location?: string;
    specializations?: string[];
    maxDistance?: number;
    minRating?: number;
    languages?: string[];
    availableFrom?: Date;
    availableTo?: Date;
    maxHourlyRate?: number;
}
export interface LawyerProfile extends Lawyer {
    distance?: number;
    availableSlots?: Array<{
        id: string;
        startTime: Date;
        endTime: Date;
    }>;
    reviewSummary?: {
        averageRating: number;
        totalReviews: number;
        recentReviews: Array<{
            rating: number;
            comment: string;
            createdAt: Date;
        }>;
    };
}
export interface MatchScore {
    lawyerId: string;
    score: number;
    reasons: string[];
}
export declare class LawyerMatchingService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Sucht Anwälte basierend auf Kriterien
     */
    searchLawyers(criteria: LawyerSearchCriteria, page?: number, limit?: number): Promise<{
        lawyers: LawyerProfile[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Findet die besten Matches für einen Fall
     */
    findBestMatches(caseDescription: string, userLocation: string, limit?: number): Promise<LawyerProfile[]>;
    /**
     * Berechnet Match-Score für einen Anwalt
     */
    private calculateMatchScore;
    /**
     * Extrahiert Spezialisierungen aus Fallbeschreibung
     */
    private extractSpecializations;
    /**
     * Berechnet Distanz zwischen zwei Standorten (vereinfacht)
     */
    private calculateDistance;
    /**
     * Extrahiert Postleitzahl aus Adresse
     */
    private extractPostalCode;
    /**
     * Holt Anwaltsprofil mit Details
     */
    getLawyerProfile(lawyerId: string): Promise<LawyerProfile | null>;
    /**
     * Fügt Bewertung für Anwalt hinzu
     */
    addReview(lawyerId: string, userId: string, bookingId: string, rating: number, comment?: string): Promise<void>;
    /**
     * Aktualisiert durchschnittliche Bewertung eines Anwalts
     */
    private updateLawyerRating;
    /**
     * Empfiehlt Anwalt basierend auf Fall-Risiko
     */
    recommendLawyerForCase(caseId: string, userId: string): Promise<{
        shouldRecommend: boolean;
        reason: string;
        lawyers?: LawyerProfile[];
    }>;
}
