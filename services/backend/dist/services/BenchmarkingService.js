"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkingService = void 0;
const logger_1 = require("../utils/logger");
class BenchmarkingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Führt einen Benchmarking-Vergleich für eine Organisation durch
     */
    async performBenchmarking(query) {
        try {
            const { organizationId, startDate, endDate, categories, metrics, jurisdiction } = query;
            // Hole die Nutzungsdaten der Organisation
            const orgMetrics = await this.getOrganizationMetrics(organizationId, startDate, endDate);
            // Hole Branchendaten
            const industryBenchmarks = await this.getIndustryBenchmarks({
                categories,
                metrics,
                jurisdiction
            });
            // Führe Vergleiche durch
            const comparisons = this.compareMetrics(orgMetrics, industryBenchmarks);
            // Generiere Bericht
            const report = this.generateBenchmarkReport(comparisons, organizationId, startDate, endDate);
            return report;
        }
        catch (error) {
            logger_1.logger.error('Error performing benchmarking:', error);
            throw new Error('Failed to perform benchmarking');
        }
    }
    /**
     * Holt die Metriken einer Organisation
     */
    async getOrganizationMetrics(organizationId, startDate, endDate) {
        // Standard-Zeitraum: Letzte 30 Tage
        const end = endDate || new Date();
        const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Hole API-Anfragen
        const apiKeys = await this.prisma.apiKey.findMany({
            where: { organizationId },
            select: { id: true }
        });
        const apiKeyIds = apiKeys.map(key => key.id);
        const apiRequests = await this.prisma.apiRequest.count({
            where: {
                apiKeyId: { in: apiKeyIds },
                createdAt: { gte: start, lte: end }
            }
        });
        // Hole Dokumentenanalysen
        const documentAnalyses = await this.prisma.document.count({
            where: {
                organizationId,
                uploadedAt: { gte: start, lte: end }
            }
        });
        // Hole Chat-Interaktionen
        const chatInteractions = await this.prisma.chatInteraction.count({
            where: {
                organizationId,
                createdAt: { gte: start, lte: end }
            }
        });
        // Hole Bulk-Jobs
        const bulkJobs = await this.prisma.batchJob.count({
            where: {
                organizationId,
                createdAt: { gte: start, lte: end }
            }
        });
        // Berechne abgeleitete Metriken
        const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
        const apiRequestsPerDay = apiRequests / days;
        const documentsPerDay = documentAnalyses / days;
        const chatsPerDay = chatInteractions / days;
        const bulkJobsPerDay = bulkJobs / days;
        return {
            'api_requests_total': apiRequests,
            'api_requests_per_day': apiRequestsPerDay,
            'documents_analyzed_total': documentAnalyses,
            'documents_analyzed_per_day': documentsPerDay,
            'chat_interactions_total': chatInteractions,
            'chat_interactions_per_day': chatsPerDay,
            'bulk_jobs_total': bulkJobs,
            'bulk_jobs_per_day': bulkJobsPerDay
        };
    }
    /**
     * Holt Branchendaten für Benchmarking
     */
    async getIndustryBenchmarks(query) {
        try {
            // Erstelle Where-Bedingungen
            const where = {};
            if (query.categories && query.categories.length > 0) {
                where.category = { in: query.categories };
            }
            if (query.metrics && query.metrics.length > 0) {
                where.name = { in: query.metrics };
            }
            if (query.jurisdiction) {
                where.jurisdiction = query.jurisdiction;
            }
            // Hole Benchmark-Daten aus der Datenbank
            // @ts-ignore - Prisma-Client-Probleme
            const benchmarks = await this.prisma.benchmark.findMany({
                where
            });
            // Transformiere in ein leicht verwendbares Format
            const result = {};
            // @ts-ignore - Prisma-Client-Probleme
            benchmarks.forEach((benchmark) => {
                result[benchmark.name] = {
                    average: benchmark.industryAverage || 0,
                    median: benchmark.industryMedian || 0,
                    min: benchmark.industryMin || 0,
                    max: benchmark.industryMax || 0
                };
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error fetching industry benchmarks:', error);
            // Rückfall auf Standardwerte
            return this.getDefaultIndustryBenchmarks();
        }
    }
    /**
     * Liefert Standard-Branchendaten als Fallback
     */
    getDefaultIndustryBenchmarks() {
        return {
            'api_requests_per_day': { average: 50, median: 45, min: 5, max: 500 },
            'documents_analyzed_per_day': { average: 15, median: 12, min: 1, max: 150 },
            'chat_interactions_per_day': { average: 25, median: 20, min: 2, max: 200 },
            'bulk_jobs_per_day': { average: 2, median: 1, min: 0, max: 20 }
        };
    }
    /**
     * Vergleicht Organisationsmetriken mit Branchendaten
     */
    compareMetrics(orgMetrics, industryBenchmarks) {
        const comparisons = [];
        for (const [metric, orgValue] of Object.entries(orgMetrics)) {
            // Prüfe ob Branchendaten für diese Metrik existieren
            if (!industryBenchmarks[metric]) {
                continue;
            }
            const industry = industryBenchmarks[metric];
            // Berechne Abweichung vom Durchschnitt
            const deviationFromAverage = industry.average > 0
                ? ((orgValue - industry.average) / industry.average) * 100
                : 0;
            // Bestimme Leistungsbewertung
            let performanceRating = 'average';
            if (deviationFromAverage < -10) {
                performanceRating = 'below';
            }
            else if (deviationFromAverage > 10) {
                performanceRating = 'above';
            }
            // Berechne Perzentil (vereinfachte Berechnung)
            let percentile = 50;
            if (industry.max > industry.min) {
                percentile = Math.min(100, Math.max(0, ((orgValue - industry.min) / (industry.max - industry.min)) * 100));
            }
            // Generiere Empfehlungen
            const recommendations = this.generateBenchmarkRecommendations(metric, orgValue, industry, performanceRating);
            comparisons.push({
                metric,
                userValue: orgValue,
                industryAverage: industry.average,
                industryMedian: industry.median,
                percentile,
                deviationFromAverage,
                performanceRating,
                recommendations
            });
        }
        return comparisons;
    }
    /**
     * Generiert Empfehlungen basierend auf Benchmark-Vergleichen
     */
    generateBenchmarkRecommendations(metric, userValue, industry, performanceRating) {
        const recommendations = [];
        switch (performanceRating) {
            case 'below':
                if (metric.includes('api_requests')) {
                    recommendations.push('Erhöhen Sie Ihre API-Nutzung, um das volle Potenzial der Plattform auszuschöpfen.');
                }
                else if (metric.includes('documents')) {
                    recommendations.push('Steigern Sie Ihre Dokumentenanalysen, um effizienter zu arbeiten.');
                }
                else if (metric.includes('chat')) {
                    recommendations.push('Nutzen Sie den Chat-Service intensiver für bessere Kundenbetreuung.');
                }
                else if (metric.includes('bulk')) {
                    recommendations.push('Verwenden Sie Bulk-Processing für wiederkehrende Aufgaben.');
                }
                break;
            case 'above':
                if (metric.includes('api_requests') || metric.includes('documents') || metric.includes('bulk')) {
                    recommendations.push('Ihre hohe Nutzung zeigt effiziente Arbeitsprozesse. Prüfen Sie auf Optimierungspotenzial.');
                }
                else if (metric.includes('chat')) {
                    recommendations.push('Ihre intensive Chat-Nutzung zeigt gute Kundenbetreuung. Prüfen Sie auf Automatisierungspotenzial.');
                }
                break;
            default:
                recommendations.push('Ihre Nutzung entspricht dem Branchendurchschnitt. Gute Balance.');
        }
        // Allgemeine Empfehlungen
        if (userValue < industry.min * 0.5) {
            recommendations.push('Ihre Nutzung ist deutlich unter dem Branchenminimum. Prüfen Sie, ob Sie alle verfügbaren Funktionen nutzen.');
        }
        else if (userValue > industry.max * 1.5) {
            recommendations.push('Ihre Nutzung übersteigt deutlich das Branchenmaximum. Prüfen Sie auf Überlastung oder spezielle Anforderungen.');
        }
        return recommendations;
    }
    /**
     * Generiert einen Benchmarking-Bericht
     */
    generateBenchmarkReport(comparisons, organizationId, startDate, endDate) {
        // Zeitraum bestimmen
        const end = endDate || new Date();
        const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Leistungsstatistiken
        const belowAverage = comparisons.filter(c => c.performanceRating === 'below').length;
        const average = comparisons.filter(c => c.performanceRating === 'average').length;
        const aboveAverage = comparisons.filter(c => c.performanceRating === 'above').length;
        // Top-Performers
        const topPerformers = comparisons
            .filter(c => c.performanceRating === 'above')
            .map(c => c.metric);
        // Verbesserungsbereiche
        const areasForImprovement = comparisons
            .filter(c => c.performanceRating === 'below')
            .map(c => c.metric);
        // Allgemeine Empfehlungen
        const recommendations = [];
        if (belowAverage > comparisons.length * 0.5) {
            recommendations.push('Mehr als die Hälfte Ihrer Metriken liegen unter dem Branchendurchschnitt. Prüfen Sie Ihre Nutzung.');
        }
        if (aboveAverage > comparisons.length * 0.5) {
            recommendations.push('Mehr als die Hälfte Ihrer Metriken liegen über dem Branchendurchschnitt. Gute Leistung!');
        }
        return {
            period: {
                start,
                end
            },
            organizationId,
            benchmarks: comparisons,
            overallPerformance: {
                belowAverage,
                average,
                aboveAverage
            },
            topPerformers,
            areasForImprovement,
            recommendations
        };
    }
    /**
     * Erstellt oder aktualisiert einen Benchmark-Wert
     */
    async upsertBenchmark(benchmarkData) {
        try {
            // Prüfe ob Benchmark bereits existiert
            // @ts-ignore - Prisma-Client-Probleme
            const existing = await this.prisma.benchmark.findFirst({
                where: {
                    name: benchmarkData.name,
                    category: benchmarkData.category,
                    jurisdiction: benchmarkData.jurisdiction
                }
            });
            let benchmark;
            if (existing) {
                // Aktualisiere bestehenden Benchmark
                // @ts-ignore - Prisma-Client-Probleme
                benchmark = await this.prisma.benchmark.update({
                    where: { id: existing.id },
                    data: {
                        value: benchmarkData.value,
                        industryAverage: benchmarkData.industryAverage,
                        industryMedian: benchmarkData.industryMedian,
                        industryMin: benchmarkData.industryMin,
                        industryMax: benchmarkData.industryMax,
                        percentile: benchmarkData.percentile,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                // Erstelle neuen Benchmark
                // @ts-ignore - Prisma-Client-Probleme
                benchmark = await this.prisma.benchmark.create({
                    data: {
                        name: benchmarkData.name,
                        description: benchmarkData.description,
                        category: benchmarkData.category,
                        value: benchmarkData.value,
                        unit: benchmarkData.unit,
                        industryAverage: benchmarkData.industryAverage,
                        industryMedian: benchmarkData.industryMedian,
                        industryMin: benchmarkData.industryMin,
                        industryMax: benchmarkData.industryMax,
                        percentile: benchmarkData.percentile,
                        comparisonDate: benchmarkData.comparisonDate,
                        jurisdiction: benchmarkData.jurisdiction,
                        source: benchmarkData.source,
                        confidence: benchmarkData.confidence
                    }
                });
            }
            return {
                id: benchmark.id,
                name: benchmark.name,
                description: benchmark.description,
                category: benchmark.category,
                value: benchmark.value,
                unit: benchmark.unit,
                industryAverage: benchmark.industryAverage || undefined,
                industryMedian: benchmark.industryMedian || undefined,
                industryMin: benchmark.industryMin || undefined,
                industryMax: benchmark.industryMax || undefined,
                percentile: benchmark.percentile || undefined,
                comparisonDate: benchmark.comparisonDate,
                jurisdiction: benchmark.jurisdiction,
                source: benchmark.source,
                confidence: benchmark.confidence,
                createdAt: benchmark.createdAt,
                updatedAt: benchmark.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error upserting benchmark:', error);
            throw new Error('Failed to upsert benchmark');
        }
    }
    /**
     * Löscht einen Benchmark
     */
    async deleteBenchmark(id) {
        try {
            // @ts-ignore - Prisma-Client-Probleme
            await this.prisma.benchmark.delete({
                where: { id }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting benchmark ${id}:`, error);
            throw new Error('Failed to delete benchmark');
        }
    }
}
exports.BenchmarkingService = BenchmarkingService;
