import { PrismaClient, MietspiegelData } from '@prisma/client';
export interface RentRange {
    minRent: number;
    maxRent: number;
    category: string;
    conditions: string[];
}
export interface ApartmentDetails {
    size: number;
    rooms: number;
    constructionYear?: number;
    condition?: 'simple' | 'normal' | 'good' | 'excellent';
    location?: 'peripheral' | 'normal' | 'central' | 'premium';
    features?: string[];
    heatingType?: 'central' | 'individual' | 'district';
    energyClass?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
}
export interface RentCalculationResult {
    city: string;
    year: number;
    apartmentDetails: ApartmentDetails;
    calculatedRent: {
        min: number;
        max: number;
        average: number;
        recommended: number;
    };
    comparison: {
        belowAverage: boolean;
        aboveAverage: boolean;
        withinRange: boolean;
        percentageDeviation: number;
    };
    factors: {
        sizeFactor: number;
        locationFactor: number;
        conditionFactor: number;
        ageFactor: number;
        featureFactor: number;
    };
    applicableRegulations: string[];
    recommendations: string[];
}
export interface LocalRegulation {
    type: 'rent_brake' | 'rent_cap' | 'modernization_limit' | 'other';
    title: string;
    description: string;
    effectiveDate: Date;
    maxIncrease?: number;
    applicableAreas?: string[];
    exceptions?: string[];
}
export interface MietspiegelUpdate {
    city: string;
    year: number;
    averageRent: number;
    rentRanges: RentRange[];
    specialRegulations: string[];
    dataSource: string;
    lastUpdated: Date;
}
export interface CityMietspiegelInfo {
    city: string;
    availableYears: number[];
    currentYear: number;
    lastUpdate: Date;
    dataQuality: 'official' | 'estimated' | 'outdated';
    coverage: number;
    sampleSize?: number;
}
export declare class MietspiegelService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Ruft Mietspiegel-Daten für eine Stadt ab
     */
    getMietspiegelData(city: string, year?: number): Promise<MietspiegelData | null>;
    /**
     * Berechnet Mietpreis-Range basierend auf Wohnungsdetails
     */
    calculateRentRange(city: string, apartmentDetails: ApartmentDetails): Promise<RentCalculationResult>;
    /**
     * Ruft lokale Bestimmungen für eine Stadt ab
     */
    getLocalRegulations(city: string): Promise<LocalRegulation[]>;
    /**
     * Aktualisiert Mietspiegel-Daten
     */
    updateMietspiegelData(update: MietspiegelUpdate): Promise<MietspiegelData>;
    /**
     * Ruft verfügbare Städte mit Mietspiegel-Daten ab
     */
    getAvailableCities(): Promise<CityMietspiegelInfo[]>;
    /**
     * Vergleicht Miete mit Mietspiegel
     */
    compareMietWithMietspiegel(city: string, currentRent: number, apartmentDetails: ApartmentDetails): Promise<{
        comparison: 'below' | 'within' | 'above';
        deviation: number;
        percentageDeviation: number;
        recommendation: string;
        legalBasis?: string;
    }>;
    /**
     * Private Hilfsmethoden
     */
    private normalizeCity;
    private validateApartmentDetails;
    private calculateRentFactors;
    private findApplicableRange;
    private getApplicableRegulations;
    private generateRecommendations;
    private getRegulationsForCity;
    private validateMietspiegelUpdate;
    private assessDataQuality;
    private getCityCoverage;
    private getCitySampleSize;
    private invalidateCityCache;
}
