/**
 * Prometheus-kompatible Metriken für KMS
 */
export interface KMSMetrics {
    keyCreations: number;
    keyRetrievals: number;
    keyRotations: number;
    keyDeletions: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    avgKeyRetrievalTime: number;
    avgKeyCreationTime: number;
    avgRotationDuration: number;
    errors: number;
    securityEvents: number;
    activeKeys: number;
    expiredKeys: number;
    compromisedKeys: number;
}
/**
 * Metriken-Sammler für KMS-Operationen
 * Sammelt Prometheus-kompatible Metriken
 */
export declare class MetricsCollector {
    private metrics;
    private timings;
    private startTimes;
    constructor();
    /**
     * Initialisiert alle Metriken mit 0
     */
    private initializeMetrics;
    /**
     * Inkrementiert einen Counter
     */
    incrementCounter(metric: string, value?: number): void;
    /**
     * Setzt einen Gauge-Wert
     */
    setGauge(metric: string, value: number): void;
    /**
     * Startet eine Zeitmessung
     */
    startTimer(operation: string): string;
    /**
     * Beendet eine Zeitmessung und speichert die Dauer
     */
    endTimer(timerId: string, operation: string): number;
    /**
     * Berechnet den Durchschnitt einer Timing-Metrik
     */
    private calculateAverage;
    /**
     * Berechnet die Cache-Hit-Rate
     */
    private calculateCacheHitRate;
    /**
     * Gibt alle Metriken zurück
     */
    getMetrics(): KMSMetrics;
    /**
     * Gibt Metriken im Prometheus-Format zurück
     */
    getPrometheusMetrics(): string;
    /**
     * Setzt alle Metriken zurück
     */
    reset(): void;
}
