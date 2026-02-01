import { PrismaClient } from '@prisma/client';
export interface BenchmarkData {
    id: string;
    name: string;
    description: string;
    category: string;
    value: number;
    unit: string;
    industryAverage?: number;
    industryMedian?: number;
    industryMin?: number;
    industryMax?: number;
    percentile?: number;
    comparisonDate: Date;
    jurisdiction: string;
    source: string;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface BenchmarkComparison {
    metric: string;
    userValue: number;
    industryAverage: number;
    industryMedian: number;
    percentile: number;
    deviationFromAverage: number;
    performanceRating: 'below' | 'average' | 'above';
    recommendations: string[];
}
export interface BenchmarkReport {
    period: {
        start: Date;
        end: Date;
    };
    organizationId: string;
    benchmarks: BenchmarkComparison[];
    overallPerformance: {
        belowAverage: number;
        average: number;
        aboveAverage: number;
    };
    topPerformers: string[];
    areasForImprovement: string[];
    recommendations: string[];
}
export interface BenchmarkQuery {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
    categories?: string[];
    metrics?: string[];
    jurisdiction?: string;
}
export declare class BenchmarkingService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Führt einen Benchmarking-Vergleich für eine Organisation durch
     */
    performBenchmarking(query: BenchmarkQuery): Promise<BenchmarkReport>;
    /**
     * Holt die Metriken einer Organisation
     */
    private getOrganizationMetrics;
    /**
     * Holt Branchendaten für Benchmarking
     */
    private getIndustryBenchmarks;
    /**
     * Liefert Standard-Branchendaten als Fallback
     */
    private getDefaultIndustryBenchmarks;
    /**
     * Vergleicht Organisationsmetriken mit Branchendaten
     */
    private compareMetrics;
    /**
     * Generiert Empfehlungen basierend auf Benchmark-Vergleichen
     */
    private generateBenchmarkRecommendations;
    /**
     * Generiert einen Benchmarking-Bericht
     */
    private generateBenchmarkReport;
    /**
     * Erstellt oder aktualisiert einen Benchmark-Wert
     */
    upsertBenchmark(benchmarkData: Omit<BenchmarkData, 'id' | 'createdAt' | 'updatedAt'>): Promise<BenchmarkData>;
    /**
     * Löscht einen Benchmark
     */
    deleteBenchmark(id: string): Promise<void>;
}
