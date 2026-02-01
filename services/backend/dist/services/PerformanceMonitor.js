"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const logger_1 = require("../utils/logger");
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.aggregatedMetrics = new Map();
        // Setup periodic aggregation
        setInterval(() => {
            this.aggregateMetrics();
        }, 60000); // Aggregiere alle 60 Sekunden
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    /**
     * Startet die Messung einer Operation
     */
    startOperation(operationName) {
        const startTime = Date.now().toString();
        logger_1.logger.debug(`Started operation: ${operationName}`);
        return startTime;
    }
    /**
     * Beendet die Messung einer Operation und speichert die Metrik
     */
    endOperation(operationName, startTime, metadata) {
        const endTime = Date.now();
        const startTimeNum = parseInt(startTime);
        const duration = endTime - startTimeNum;
        const metric = {
            name: operationName,
            duration,
            timestamp: new Date(),
            metadata
        };
        // Speichere die Metrik
        this.metrics.push(metric);
        // Begrenze die Anzahl der gespeicherten Metriken
        if (this.metrics.length > 10000) {
            this.metrics.shift();
        }
        logger_1.logger.debug(`Ended operation: ${operationName} (${duration}ms)`);
    }
    /**
     * Misst die Ausführungszeit einer asynchronen Funktion
     */
    async measureAsync(operationName, fn, metadata) {
        const startTime = this.startOperation(operationName);
        try {
            const result = await fn();
            this.endOperation(operationName, startTime, metadata);
            return result;
        }
        catch (error) {
            // Typisiere den Fehler korrekt
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.endOperation(operationName, startTime, { ...metadata, error: errorMessage });
            throw error;
        }
    }
    /**
     * Misst die Ausführungszeit einer synchronen Funktion
     */
    measureSync(operationName, fn, metadata) {
        const startTime = this.startOperation(operationName);
        try {
            const result = fn();
            this.endOperation(operationName, startTime, metadata);
            return result;
        }
        catch (error) {
            // Typisiere den Fehler korrekt
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.endOperation(operationName, startTime, { ...metadata, error: errorMessage });
            throw error;
        }
    }
    /**
     * Fügt eine benutzerdefinierte Metrik hinzu
     */
    addMetric(name, duration, metadata) {
        const metric = {
            name,
            duration,
            timestamp: new Date(),
            metadata
        };
        this.metrics.push(metric);
        // Begrenze die Anzahl der gespeicherten Metriken
        if (this.metrics.length > 10000) {
            this.metrics.shift();
        }
    }
    /**
     * Aggregiert die Metriken
     */
    aggregateMetrics() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        // Filtere Metriken der letzten Stunde
        const recentMetrics = this.metrics.filter(metric => metric.timestamp >= oneHourAgo);
        // Gruppiere nach Name und aggregiere
        const groupedMetrics = new Map();
        for (const metric of recentMetrics) {
            if (!groupedMetrics.has(metric.name)) {
                groupedMetrics.set(metric.name, []);
            }
            groupedMetrics.get(metric.name).push(metric);
        }
        // Berechne aggregierte Metriken
        for (const [name, metrics] of groupedMetrics) {
            const durations = metrics.map(m => m.duration);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const minDuration = Math.min(...durations);
            const maxDuration = Math.max(...durations);
            const totalTime = durations.reduce((a, b) => a + b, 0);
            this.aggregatedMetrics.set(name, {
                avgDuration,
                minDuration,
                maxDuration,
                count: metrics.length,
                totalTime
            });
        }
        logger_1.logger.info('Performance metrics aggregated', {
            metricCount: recentMetrics.length,
            aggregatedCount: groupedMetrics.size
        });
    }
    /**
     * Holt die aggregierten Metriken
     */
    getAggregatedMetrics() {
        return new Map(this.aggregatedMetrics);
    }
    /**
     * Holt Rohmetriken
     */
    getRawMetrics() {
        return [...this.metrics];
    }
    /**
     * Holt Metriken für eine bestimmte Operation
     */
    getMetricsForOperation(operationName) {
        return this.metrics.filter(metric => metric.name === operationName);
    }
    /**
     * Löscht alle Metriken
     */
    clearMetrics() {
        this.metrics = [];
        this.aggregatedMetrics.clear();
    }
    /**
     * Gibt einen Performance-Bericht aus
     */
    generateReport() {
        const reportLines = [];
        reportLines.push('=== Performance Monitor Report ===');
        reportLines.push(`Total Metrics Collected: ${this.metrics.length}`);
        reportLines.push(`Aggregated Operations: ${this.aggregatedMetrics.size}`);
        reportLines.push('');
        for (const [name, metrics] of this.aggregatedMetrics) {
            reportLines.push(`${name}:`);
            reportLines.push(`  Average Duration: ${metrics.avgDuration.toFixed(2)}ms`);
            reportLines.push(`  Min Duration: ${metrics.minDuration}ms`);
            reportLines.push(`  Max Duration: ${metrics.maxDuration}ms`);
            reportLines.push(`  Total Calls: ${metrics.count}`);
            reportLines.push(`  Total Time: ${metrics.totalTime}ms`);
            reportLines.push('');
        }
        return reportLines.join('\n');
    }
    /**
     * Loggt den Performance-Bericht
     */
    logReport() {
        logger_1.logger.info(this.generateReport());
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
