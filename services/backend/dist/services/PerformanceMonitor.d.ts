interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
interface AggregatedMetrics {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    count: number;
    totalTime: number;
}
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private aggregatedMetrics;
    private constructor();
    static getInstance(): PerformanceMonitor;
    /**
     * Startet die Messung einer Operation
     */
    startOperation(operationName: string): string;
    /**
     * Beendet die Messung einer Operation und speichert die Metrik
     */
    endOperation(operationName: string, startTime: string, metadata?: Record<string, any>): void;
    /**
     * Misst die Ausführungszeit einer asynchronen Funktion
     */
    measureAsync<T>(operationName: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    /**
     * Misst die Ausführungszeit einer synchronen Funktion
     */
    measureSync<T>(operationName: string, fn: () => T, metadata?: Record<string, any>): T;
    /**
     * Fügt eine benutzerdefinierte Metrik hinzu
     */
    addMetric(name: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * Aggregiert die Metriken
     */
    private aggregateMetrics;
    /**
     * Holt die aggregierten Metriken
     */
    getAggregatedMetrics(): Map<string, AggregatedMetrics>;
    /**
     * Holt Rohmetriken
     */
    getRawMetrics(): PerformanceMetric[];
    /**
     * Holt Metriken für eine bestimmte Operation
     */
    getMetricsForOperation(operationName: string): PerformanceMetric[];
    /**
     * Löscht alle Metriken
     */
    clearMetrics(): void;
    /**
     * Gibt einen Performance-Bericht aus
     */
    generateReport(): string;
    /**
     * Loggt den Performance-Bericht
     */
    logReport(): void;
}
export {};
