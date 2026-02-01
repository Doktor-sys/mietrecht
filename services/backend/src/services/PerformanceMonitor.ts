import { logger } from '../utils/logger';

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

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private aggregatedMetrics: Map<string, AggregatedMetrics> = new Map();

  private constructor() {
    // Setup periodic aggregation
    setInterval(() => {
      this.aggregateMetrics();
    }, 60000); // Aggregiere alle 60 Sekunden
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Startet die Messung einer Operation
   */
  startOperation(operationName: string): string {
    const startTime = Date.now().toString();
    logger.debug(`Started operation: ${operationName}`);
    return startTime;
  }

  /**
   * Beendet die Messung einer Operation und speichert die Metrik
   */
  endOperation(operationName: string, startTime: string, metadata?: Record<string, any>): void {
    const endTime = Date.now();
    const startTimeNum = parseInt(startTime);
    const duration = endTime - startTimeNum;

    const metric: PerformanceMetric = {
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

    logger.debug(`Ended operation: ${operationName} (${duration}ms)`);
  }

  /**
   * Misst die Ausführungszeit einer asynchronen Funktion
   */
  async measureAsync<T>(
    operationName: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = this.startOperation(operationName);
    try {
      const result = await fn();
      this.endOperation(operationName, startTime, metadata);
      return result;
    } catch (error: unknown) {
      // Typisiere den Fehler korrekt
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.endOperation(operationName, startTime, { ...metadata, error: errorMessage });
      throw error;
    }
  }

  /**
   * Misst die Ausführungszeit einer synchronen Funktion
   */
  measureSync<T>(
    operationName: string, 
    fn: () => T, 
    metadata?: Record<string, any>
  ): T {
    const startTime = this.startOperation(operationName);
    try {
      const result = fn();
      this.endOperation(operationName, startTime, metadata);
      return result;
    } catch (error: unknown) {
      // Typisiere den Fehler korrekt
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.endOperation(operationName, startTime, { ...metadata, error: errorMessage });
      throw error;
    }
  }

  /**
   * Fügt eine benutzerdefinierte Metrik hinzu
   */
  addMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
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
  private aggregateMetrics(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Filtere Metriken der letzten Stunde
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp >= oneHourAgo
    );

    // Gruppiere nach Name und aggregiere
    const groupedMetrics = new Map<string, PerformanceMetric[]>();
    
    for (const metric of recentMetrics) {
      if (!groupedMetrics.has(metric.name)) {
        groupedMetrics.set(metric.name, []);
      }
      groupedMetrics.get(metric.name)!.push(metric);
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

    logger.info('Performance metrics aggregated', {
      metricCount: recentMetrics.length,
      aggregatedCount: groupedMetrics.size
    });
  }

  /**
   * Holt die aggregierten Metriken
   */
  getAggregatedMetrics(): Map<string, AggregatedMetrics> {
    return new Map(this.aggregatedMetrics);
  }

  /**
   * Holt Rohmetriken
   */
  getRawMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Holt Metriken für eine bestimmte Operation
   */
  getMetricsForOperation(operationName: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === operationName);
  }

  /**
   * Löscht alle Metriken
   */
  clearMetrics(): void {
    this.metrics = [];
    this.aggregatedMetrics.clear();
  }

  /**
   * Gibt einen Performance-Bericht aus
   */
  generateReport(): string {
    const reportLines: string[] = [];
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
  logReport(): void {
    logger.info(this.generateReport());
  }
}