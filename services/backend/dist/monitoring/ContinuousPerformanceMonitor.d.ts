interface SystemMetrics {
    cpuUsage: number;
    memoryUsage: number;
    heapUsed: number;
    heapTotal: number;
    externalMemory: number;
    uptime: number;
}
interface ApplicationMetrics {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    activeConnections: number;
    cacheHitRate: number;
}
interface PerformanceAlert {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    currentValue: number;
    threshold: number;
    message: string;
}
export declare class ContinuousPerformanceMonitor {
    private static instance;
    private performanceMonitor;
    private databaseOptimizer?;
    private isMonitoring;
    private monitoringInterval;
    private alerts;
    private systemMetrics;
    private applicationMetrics;
    private constructor();
    static getInstance(): ContinuousPerformanceMonitor;
    /**
     * Startet das kontinuierliche Monitoring
     */
    startMonitoring(interval?: number): void;
    /**
     * Stoppt das kontinuierliche Monitoring
     */
    stopMonitoring(): void;
    /**
     * Sammelt System- und Anwendungsmetriken
     */
    private collectMetrics;
    /**
     * Prüft Schwellenwerte und erzeugt Alerts
     */
    private checkThresholds;
    /**
     * Erstellt einen Performance-Alert
     */
    private createAlert;
    /**
     * Generiert Berichte
     */
    private generateReports;
    /**
     * Generiert einen täglichen Bericht
     */
    private generateDailyReport;
    /**
     * Generiert einen wöchentlichen Bericht
     */
    private generateWeeklyReport;
    /**
     * Generiert Empfehlungen basierend auf den Metriken
     */
    private generateRecommendations;
    /**
     * Holt durchschnittliche Systemmetriken
     */
    private getAverageSystemMetrics;
    /**
     * Holt durchschnittliche Anwendungsmetriken
     */
    private getAverageApplicationMetrics;
    /**
     * Holt kürzliche Alerts
     */
    private getRecentAlerts;
    private getCpuUsage;
    private getMemoryUsage;
    private getHeapUsed;
    private getHeapTotal;
    private getExternalMemory;
    private getRequestCount;
    private getErrorCount;
    private getAverageResponseTime;
    private getActiveConnections;
    private getCacheHitRate;
    /**
     * Holt alle Alerts
     */
    getAlerts(): PerformanceAlert[];
    /**
     * Löscht alte Alerts
     */
    clearOldAlerts(hours?: number): void;
    /**
     * Holt Systemmetriken
     */
    getSystemMetrics(): SystemMetrics[];
    /**
     * Holt Anwendungsmetriken
     */
    getApplicationMetrics(): ApplicationMetrics[];
}
export {};
