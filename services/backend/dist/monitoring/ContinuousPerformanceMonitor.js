"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinuousPerformanceMonitor = void 0;
const logger_1 = require("../utils/logger");
const PerformanceMonitor_1 = require("../services/PerformanceMonitor");
class ContinuousPerformanceMonitor {
    constructor() {
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.alerts = [];
        this.systemMetrics = [];
        this.applicationMetrics = [];
        this.performanceMonitor = PerformanceMonitor_1.PerformanceMonitor.getInstance();
        // In einer echten Implementierung würden wir hier den DatabaseOptimizer initialisieren
        // this.databaseOptimizer = new DatabaseOptimizer(prisma);
    }
    static getInstance() {
        if (!ContinuousPerformanceMonitor.instance) {
            ContinuousPerformanceMonitor.instance = new ContinuousPerformanceMonitor();
        }
        return ContinuousPerformanceMonitor.instance;
    }
    /**
     * Startet das kontinuierliche Monitoring
     */
    startMonitoring(interval = 60000) {
        if (this.isMonitoring) {
            logger_1.logger.warn('Performance monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        logger_1.logger.info(`Starting continuous performance monitoring with ${interval}ms interval`);
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
            this.generateReports();
        }, interval);
    }
    /**
     * Stoppt das kontinuierliche Monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.isMonitoring = false;
            logger_1.logger.info('Stopped continuous performance monitoring');
        }
    }
    /**
     * Sammelt System- und Anwendungsmetriken
     */
    collectMetrics() {
        // Sammle Systemmetriken
        const systemMetrics = {
            cpuUsage: this.getCpuUsage(),
            memoryUsage: this.getMemoryUsage(),
            heapUsed: this.getHeapUsed(),
            heapTotal: this.getHeapTotal(),
            externalMemory: this.getExternalMemory(),
            uptime: process.uptime()
        };
        this.systemMetrics.push(systemMetrics);
        // Sammle Anwendungsmetriken
        const applicationMetrics = {
            requestCount: this.getRequestCount(),
            errorCount: this.getErrorCount(),
            averageResponseTime: this.getAverageResponseTime(),
            activeConnections: this.getActiveConnections(),
            cacheHitRate: this.getCacheHitRate()
        };
        this.applicationMetrics.push(applicationMetrics);
        logger_1.logger.debug('Collected performance metrics', {
            system: systemMetrics,
            application: applicationMetrics
        });
    }
    /**
     * Prüft Schwellenwerte und erzeugt Alerts
     */
    checkThresholds() {
        const latestSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1];
        const latestApplicationMetrics = this.applicationMetrics[this.applicationMetrics.length - 1];
        if (!latestSystemMetrics || !latestApplicationMetrics) {
            return;
        }
        // Prüfe CPU-Nutzung
        if (latestSystemMetrics.cpuUsage > 80) {
            this.createAlert('high_cpu_usage', 'critical', 'CPU Usage', latestSystemMetrics.cpuUsage, 80, `CPU usage is critically high: ${latestSystemMetrics.cpuUsage.toFixed(2)}%`);
        }
        // Prüfe Speichernutzung
        if (latestSystemMetrics.memoryUsage > 85) {
            this.createAlert('high_memory_usage', 'high', 'Memory Usage', latestSystemMetrics.memoryUsage, 85, `Memory usage is high: ${latestSystemMetrics.memoryUsage.toFixed(2)}%`);
        }
        // Prüfe Fehlerquote
        if (latestApplicationMetrics.errorCount > 10) {
            this.createAlert('high_error_rate', 'medium', 'Error Count', latestApplicationMetrics.errorCount, 10, `High error count detected: ${latestApplicationMetrics.errorCount}`);
        }
        // Prüfe Antwortzeiten
        if (latestApplicationMetrics.averageResponseTime > 2000) {
            this.createAlert('slow_response_time', 'high', 'Response Time', latestApplicationMetrics.averageResponseTime, 2000, `Slow average response time: ${latestApplicationMetrics.averageResponseTime.toFixed(2)}ms`);
        }
        // Prüfe Cache-Hit-Rate
        if (latestApplicationMetrics.cacheHitRate < 70) {
            this.createAlert('low_cache_hit_rate', 'medium', 'Cache Hit Rate', latestApplicationMetrics.cacheHitRate, 70, `Low cache hit rate: ${latestApplicationMetrics.cacheHitRate.toFixed(2)}%`);
        }
    }
    /**
     * Erstellt einen Performance-Alert
     */
    createAlert(id, severity, metric, currentValue, threshold, message) {
        const alert = {
            id: `${id}_${Date.now()}`,
            timestamp: new Date(),
            severity,
            metric,
            currentValue,
            threshold,
            message
        };
        this.alerts.push(alert);
        logger_1.logger[severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'](`Performance Alert: ${message}`, alert);
    }
    /**
     * Generiert Berichte
     */
    generateReports() {
        // Generiere tägliche Berichte
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            this.generateDailyReport();
        }
        // Generiere wöchentliche Berichte
        if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
            this.generateWeeklyReport();
        }
    }
    /**
     * Generiert einen täglichen Bericht
     */
    generateDailyReport() {
        logger_1.logger.info('Generating daily performance report');
        const report = {
            period: 'daily',
            timestamp: new Date(),
            systemMetrics: this.getAverageSystemMetrics(24 * 60), // Letzte 24 Stunden
            applicationMetrics: this.getAverageApplicationMetrics(24 * 60),
            alerts: this.getRecentAlerts(24 * 60),
            recommendations: this.generateRecommendations()
        };
        logger_1.logger.info('Daily Performance Report', report);
    }
    /**
     * Generiert einen wöchentlichen Bericht
     */
    generateWeeklyReport() {
        logger_1.logger.info('Generating weekly performance report');
        const report = {
            period: 'weekly',
            timestamp: new Date(),
            systemMetrics: this.getAverageSystemMetrics(7 * 24 * 60), // Letzte Woche
            applicationMetrics: this.getAverageApplicationMetrics(7 * 24 * 60),
            alerts: this.getRecentAlerts(7 * 24 * 60),
            recommendations: this.generateRecommendations()
        };
        logger_1.logger.info('Weekly Performance Report', report);
    }
    /**
     * Generiert Empfehlungen basierend auf den Metriken
     */
    generateRecommendations() {
        const recommendations = [];
        const recentAlerts = this.getRecentAlerts(60); // Letzte Stunde
        // Empfehlungen basierend auf Alerts
        const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
            recommendations.push('Immediate action required: Critical performance issues detected');
        }
        const highAlerts = recentAlerts.filter(a => a.severity === 'high');
        if (highAlerts.length > 5) {
            recommendations.push('Consider scaling up resources or optimizing performance');
        }
        // Allgemeine Empfehlungen
        const avgResponseTime = this.getAverageResponseTime();
        if (avgResponseTime > 1000) {
            recommendations.push('Consider implementing database query optimization');
        }
        const cacheHitRate = this.getCacheHitRate();
        if (cacheHitRate < 80) {
            recommendations.push('Consider expanding cache size or optimizing cache strategy');
        }
        return recommendations;
    }
    /**
     * Holt durchschnittliche Systemmetriken
     */
    getAverageSystemMetrics(minutes) {
        const recentMetrics = this.systemMetrics.slice(-minutes);
        if (recentMetrics.length === 0) {
            return {};
        }
        const sum = recentMetrics.reduce((acc, metrics) => ({
            cpuUsage: acc.cpuUsage + metrics.cpuUsage,
            memoryUsage: acc.memoryUsage + metrics.memoryUsage,
            heapUsed: acc.heapUsed + metrics.heapUsed,
            heapTotal: acc.heapTotal + metrics.heapTotal,
            externalMemory: acc.externalMemory + metrics.externalMemory,
            uptime: acc.uptime + metrics.uptime
        }), {
            cpuUsage: 0,
            memoryUsage: 0,
            heapUsed: 0,
            heapTotal: 0,
            externalMemory: 0,
            uptime: 0
        });
        const count = recentMetrics.length;
        return {
            cpuUsage: sum.cpuUsage / count,
            memoryUsage: sum.memoryUsage / count,
            heapUsed: sum.heapUsed / count,
            heapTotal: sum.heapTotal / count,
            externalMemory: sum.externalMemory / count,
            uptime: sum.uptime / count
        };
    }
    /**
     * Holt durchschnittliche Anwendungsmetriken
     */
    getAverageApplicationMetrics(minutes) {
        const recentMetrics = this.applicationMetrics.slice(-minutes);
        if (recentMetrics.length === 0) {
            return {};
        }
        const sum = recentMetrics.reduce((acc, metrics) => ({
            requestCount: acc.requestCount + metrics.requestCount,
            errorCount: acc.errorCount + metrics.errorCount,
            averageResponseTime: acc.averageResponseTime + metrics.averageResponseTime,
            activeConnections: acc.activeConnections + metrics.activeConnections,
            cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate
        }), {
            requestCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            activeConnections: 0,
            cacheHitRate: 0
        });
        const count = recentMetrics.length;
        return {
            requestCount: sum.requestCount / count,
            errorCount: sum.errorCount / count,
            averageResponseTime: sum.averageResponseTime / count,
            activeConnections: sum.activeConnections / count,
            cacheHitRate: sum.cacheHitRate / count
        };
    }
    /**
     * Holt kürzliche Alerts
     */
    getRecentAlerts(minutes) {
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        return this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }
    // Hilfsmethoden für Metriken (vereinfachte Implementierungen)
    getCpuUsage() {
        // In einer echten Implementierung würden wir hier die tatsächliche CPU-Nutzung messen
        // Für dieses Beispiel geben wir einen zufälligen Wert zurück
        return Math.random() * 100;
    }
    getMemoryUsage() {
        const used = process.memoryUsage();
        return (used.heapUsed / used.heapTotal) * 100;
    }
    getHeapUsed() {
        return process.memoryUsage().heapUsed;
    }
    getHeapTotal() {
        return process.memoryUsage().heapTotal;
    }
    getExternalMemory() {
        return process.memoryUsage().external || 0;
    }
    getRequestCount() {
        // In einer echten Implementierung würden wir hier die tatsächliche Anzahl der Requests zählen
        return Math.floor(Math.random() * 1000);
    }
    getErrorCount() {
        // In einer echten Implementierung würden wir hier die tatsächliche Anzahl der Fehler zählen
        return Math.floor(Math.random() * 50);
    }
    getAverageResponseTime() {
        // In einer echten Implementierung würden wir hier die tatsächliche durchschnittliche Antwortzeit messen
        return Math.random() * 3000;
    }
    getActiveConnections() {
        // In einer echten Implementierung würden wir hier die aktiven Verbindungen zählen
        return Math.floor(Math.random() * 100);
    }
    getCacheHitRate() {
        // In einer echten Implementierung würden wir hier die Cache-Hit-Rate messen
        return Math.random() * 100;
    }
    /**
     * Holt alle Alerts
     */
    getAlerts() {
        return [...this.alerts];
    }
    /**
     * Löscht alte Alerts
     */
    clearOldAlerts(hours = 24) {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }
    /**
     * Holt Systemmetriken
     */
    getSystemMetrics() {
        return [...this.systemMetrics];
    }
    /**
     * Holt Anwendungsmetriken
     */
    getApplicationMetrics() {
        return [...this.applicationMetrics];
    }
}
exports.ContinuousPerformanceMonitor = ContinuousPerformanceMonitor;
