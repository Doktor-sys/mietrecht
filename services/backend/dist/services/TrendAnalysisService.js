"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendAnalysisService = void 0;
const logger_1 = require("../utils/logger");
// In-Memory-Speicher für Trends
let inMemoryTrends = [];
class TrendAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Analysiert Rechtstrends über einen bestimmten Zeitraum
     */
    async analyzeTrends(query = {}) {
        try {
            // Filtere Trends nach Query-Parametern
            const filteredTrends = this.filterTrends(inMemoryTrends, query);
            // Generiere Analyseergebnisse
            const analysis = this.generateTrendAnalysis(filteredTrends, query);
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing legal trends:', error);
            throw new Error('Failed to analyze legal trends');
        }
    }
    /**
     * Filtert Trends nach Query-Parametern
     */
    filterTrends(trends, query) {
        const { startDate, endDate, category, jurisdiction, minRelevance = 0, limit = 50 } = query;
        let filtered = trends.filter(trend => {
            // Filter nach Mindestrelevanz
            if (trend.relevanceScore < minRelevance)
                return false;
            // Filter nach Startdatum
            if (startDate && trend.startDate < startDate)
                return false;
            // Filter nach Enddatum
            if (endDate && trend.startDate > endDate)
                return false;
            // Filter nach Kategorie
            if (category && trend.category !== category)
                return false;
            // Filter nach Jurisdiktion
            if (jurisdiction && trend.jurisdiction !== jurisdiction)
                return false;
            return true;
        });
        // Sortiere nach Relevanz und Begrenze auf Limit
        filtered = filtered
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
        return filtered;
    }
    /**
     * Generiert eine Trendanalyse aus den Rohdaten
     */
    generateTrendAnalysis(trends, query) {
        // Zeitraum bestimmen
        const period = {
            start: query.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Ein Jahr zurück
            end: query.endDate || new Date()
        };
        // Kategorien analysieren
        const trendCategories = {};
        trends.forEach(trend => {
            trendCategories[trend.category] = (trendCategories[trend.category] || 0) + 1;
        });
        // Jurisdiktionen analysieren
        const jurisdictionDistribution = {};
        trends.forEach(trend => {
            jurisdictionDistribution[trend.jurisdiction] = (jurisdictionDistribution[trend.jurisdiction] || 0) + 1;
        });
        // Trend-Typen analysieren
        const trendTypes = {};
        trends.forEach(trend => {
            trendTypes[trend.trendType] = (trendTypes[trend.trendType] || 0) + 1;
        });
        // Top-Trends (nach Relevanz)
        const topTrends = [...trends]
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
        // Aufkommende Trends
        const emergingTrends = trends.filter(trend => trend.trendType === 'emerging');
        // Empfehlungen generieren
        const recommendations = this.generateTrendRecommendations(trends, query);
        return {
            period,
            trends,
            trendCategories,
            jurisdictionDistribution,
            trendTypes,
            topTrends,
            emergingTrends,
            recommendations
        };
    }
    /**
     * Generiert Empfehlungen basierend auf den Trends
     */
    generateTrendRecommendations(trends, query) {
        const recommendations = [];
        // Wenn viele aufkommende Trends vorhanden sind
        const emergingCount = trends.filter(t => t.trendType === 'emerging').length;
        if (emergingCount > trends.length * 0.3) {
            recommendations.push('Es gibt viele aufkommende Trends in Ihrem Praxisbereich. Erwägen Sie eine Anpassung Ihrer Strategie.');
        }
        // Wenn Trends hohe Relevanz haben
        const highRelevanceTrends = trends.filter(t => t.relevanceScore > 80);
        if (highRelevanceTrends.length > 5) {
            recommendations.push(`Es wurden ${highRelevanceTrends.length} hochrelevante Trends identifiziert. Priorisieren Sie diese in Ihrer Planung.`);
        }
        // Wenn Trends aus bestimmten Kategorien dominieren
        const categoryCounts = {};
        trends.forEach(t => {
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        });
        for (const [category, count] of Object.entries(categoryCounts)) {
            if (count > trends.length * 0.4) {
                recommendations.push(`Die Kategorie "${category}" dominiert die Trendlandschaft (${Math.round((count / trends.length) * 100)}%).`);
            }
        }
        return recommendations;
    }
    /**
     * Erstellt einen neuen Rechtstrend
     */
    async createTrend(trendData) {
        try {
            // Generiere eine eindeutige ID
            const id = `legal_trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Erstelle das vollständige Trend-Objekt
            const trend = {
                id,
                ...trendData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Füge den Trend zum In-Memory-Speicher hinzu
            inMemoryTrends.push(trend);
            return trend;
        }
        catch (error) {
            logger_1.logger.error('Error creating legal trend:', error);
            throw new Error('Failed to create legal trend');
        }
    }
    /**
     * Aktualisiert einen bestehenden Rechtstrend
     */
    async updateTrend(id, trendData) {
        try {
            // Finde den bestehenden Trend
            const index = inMemoryTrends.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Legal trend not found');
            }
            // Aktualisiere die Daten
            const updatedTrend = {
                ...inMemoryTrends[index],
                ...trendData,
                updatedAt: new Date()
            };
            // Ersetze den Trend im In-Memory-Speicher
            inMemoryTrends[index] = updatedTrend;
            return updatedTrend;
        }
        catch (error) {
            logger_1.logger.error(`Error updating legal trend ${id}:`, error);
            throw new Error('Failed to update legal trend');
        }
    }
    /**
     * Löscht einen Rechtstrend
     */
    async deleteTrend(id) {
        try {
            // Filtere den Trend aus dem In-Memory-Speicher
            inMemoryTrends = inMemoryTrends.filter(t => t.id !== id);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting legal trend ${id}:`, error);
            throw new Error('Failed to delete legal trend');
        }
    }
    /**
     * Findet ähnliche Trends basierend auf Kategorie und Jurisdiktion
     */
    async findSimilarTrends(trendId, limit = 5) {
        try {
            // Finde den Referenztrend
            const referenceTrend = inMemoryTrends.find(t => t.id === trendId);
            if (!referenceTrend) {
                throw new Error('Reference trend not found');
            }
            // Finde ähnliche Trends
            const similarTrends = inMemoryTrends
                .filter(trend => trend.id !== trendId &&
                (trend.category === referenceTrend.category ||
                    trend.jurisdiction === referenceTrend.jurisdiction))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit);
            return similarTrends;
        }
        catch (error) {
            logger_1.logger.error(`Error finding similar trends to ${trendId}:`, error);
            throw new Error('Failed to find similar trends');
        }
    }
}
exports.TrendAnalysisService = TrendAnalysisService;
