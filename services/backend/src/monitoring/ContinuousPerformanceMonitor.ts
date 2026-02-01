import { logger } from '../utils/logger';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { DatabaseOptimizer } from '../services/DatabaseOptimizer';
import { LoadTestRunner } from '../testing/load-testing/LoadTestRunner';

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

export class ContinuousPerformanceMonitor {
  private static instance: ContinuousPerformanceMonitor;
  private performanceMonitor: PerformanceMonitor;
  private databaseOptimizer?: DatabaseOptimizer;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: PerformanceAlert[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private applicationMetrics: ApplicationMetrics[] = [];

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    // In einer echten Implementierung würden wir hier den DatabaseOptimizer initialisieren
    // this.databaseOptimizer = new DatabaseOptimizer(prisma);
  }

  public static getInstance(): ContinuousPerformanceMonitor {
    if (!ContinuousPerformanceMonitor.instance) {
      ContinuousPerformanceMonitor.instance = new ContinuousPerformanceMonitor();
    }
    return ContinuousPerformanceMonitor.instance;
  }

  /**
   * Startet das kontinuierliche Monitoring
   */
  startMonitoring(interval: number = 60000): void { // Standard: alle 60 Sekunden
    if (this.isMonitoring) {
      logger.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info(`Starting continuous performance monitoring with ${interval}ms interval`);

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.generateReports();
    }, interval);
  }

  /**
   * Stoppt das kontinuierliche Monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      logger.info('Stopped continuous performance monitoring');
    }
  }

  /**
   * Sammelt System- und Anwendungsmetriken
   */
  private collectMetrics(): void {
    // Sammle Systemmetriken
    const systemMetrics: SystemMetrics = {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      heapUsed: this.getHeapUsed(),
      heapTotal: this.getHeapTotal(),
      externalMemory: this.getExternalMemory(),
      uptime: process.uptime()
    };

    this.systemMetrics.push(systemMetrics);

    // Sammle Anwendungsmetriken
    const applicationMetrics: ApplicationMetrics = {
      requestCount: this.getRequestCount(),
      errorCount: this.getErrorCount(),
      averageResponseTime: this.getAverageResponseTime(),
      activeConnections: this.getActiveConnections(),
      cacheHitRate: this.getCacheHitRate()
    };

    this.applicationMetrics.push(applicationMetrics);

    logger.debug('Collected performance metrics', {
      system: systemMetrics,
      application: applicationMetrics
    });
  }

  /**
   * Prüft Schwellenwerte und erzeugt Alerts
   */
  private checkThresholds(): void {
    const latestSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1];
    const latestApplicationMetrics = this.applicationMetrics[this.applicationMetrics.length - 1];

    if (!latestSystemMetrics || !latestApplicationMetrics) {
      return;
    }

    // Prüfe CPU-Nutzung
    if (latestSystemMetrics.cpuUsage > 80) {
      this.createAlert('high_cpu_usage', 'critical', 'CPU Usage', 
        latestSystemMetrics.cpuUsage, 80, 
        `CPU usage is critically high: ${latestSystemMetrics.cpuUsage.toFixed(2)}%`);
    }

    // Prüfe Speichernutzung
    if (latestSystemMetrics.memoryUsage > 85) {
      this.createAlert('high_memory_usage', 'high', 'Memory Usage',
        latestSystemMetrics.memoryUsage, 85,
        `Memory usage is high: ${latestSystemMetrics.memoryUsage.toFixed(2)}%`);
    }

    // Prüfe Fehlerquote
    if (latestApplicationMetrics.errorCount > 10) {
      this.createAlert('high_error_rate', 'medium', 'Error Count',
        latestApplicationMetrics.errorCount, 10,
        `High error count detected: ${latestApplicationMetrics.errorCount}`);
    }

    // Prüfe Antwortzeiten
    if (latestApplicationMetrics.averageResponseTime > 2000) {
      this.createAlert('slow_response_time', 'high', 'Response Time',
        latestApplicationMetrics.averageResponseTime, 2000,
        `Slow average response time: ${latestApplicationMetrics.averageResponseTime.toFixed(2)}ms`);
    }

    // Prüfe Cache-Hit-Rate
    if (latestApplicationMetrics.cacheHitRate < 70) {
      this.createAlert('low_cache_hit_rate', 'medium', 'Cache Hit Rate',
        latestApplicationMetrics.cacheHitRate, 70,
        `Low cache hit rate: ${latestApplicationMetrics.cacheHitRate.toFixed(2)}%`);
    }
  }

  /**
   * Erstellt einen Performance-Alert
   */
  private createAlert(
    id: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metric: string,
    currentValue: number,
    threshold: number,
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: `${id}_${Date.now()}`,
      timestamp: new Date(),
      severity,
      metric,
      currentValue,
      threshold,
      message
    };

    this.alerts.push(alert);
    logger[severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'](
      `Performance Alert: ${message}`, alert
    );
  }

  /**
   * Generiert Berichte
   */
  private generateReports(): void {
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
  private generateDailyReport(): void {
    logger.info('Generating daily performance report');
    
    const report = {
      period: 'daily',
      timestamp: new Date(),
      systemMetrics: this.getAverageSystemMetrics(24 * 60), // Letzte 24 Stunden
      applicationMetrics: this.getAverageApplicationMetrics(24 * 60),
      alerts: this.getRecentAlerts(24 * 60),
      recommendations: this.generateRecommendations()
    };

    logger.info('Daily Performance Report', report);
  }

  /**
   * Generiert einen wöchentlichen Bericht
   */
  private generateWeeklyReport(): void {
    logger.info('Generating weekly performance report');
    
    const report = {
      period: 'weekly',
      timestamp: new Date(),
      systemMetrics: this.getAverageSystemMetrics(7 * 24 * 60), // Letzte Woche
      applicationMetrics: this.getAverageApplicationMetrics(7 * 24 * 60),
      alerts: this.getRecentAlerts(7 * 24 * 60),
      recommendations: this.generateRecommendations()
    };

    logger.info('Weekly Performance Report', report);
  }

  /**
   * Generiert Empfehlungen basierend auf den Metriken
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
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
  private getAverageSystemMetrics(minutes: number): Partial<SystemMetrics> {
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
  private getAverageApplicationMetrics(minutes: number): Partial<ApplicationMetrics> {
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
  private getRecentAlerts(minutes: number): PerformanceAlert[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  // Hilfsmethoden für Metriken (vereinfachte Implementierungen)

  private getCpuUsage(): number {
    // In einer echten Implementierung würden wir hier die tatsächliche CPU-Nutzung messen
    // Für dieses Beispiel geben wir einen zufälligen Wert zurück
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  private getHeapUsed(): number {
    return process.memoryUsage().heapUsed;
  }

  private getHeapTotal(): number {
    return process.memoryUsage().heapTotal;
  }

  private getExternalMemory(): number {
    return process.memoryUsage().external || 0;
  }

  private getRequestCount(): number {
    // In einer echten Implementierung würden wir hier die tatsächliche Anzahl der Requests zählen
    return Math.floor(Math.random() * 1000);
  }

  private getErrorCount(): number {
    // In einer echten Implementierung würden wir hier die tatsächliche Anzahl der Fehler zählen
    return Math.floor(Math.random() * 50);
  }

  private getAverageResponseTime(): number {
    // In einer echten Implementierung würden wir hier die tatsächliche durchschnittliche Antwortzeit messen
    return Math.random() * 3000;
  }

  private getActiveConnections(): number {
    // In einer echten Implementierung würden wir hier die aktiven Verbindungen zählen
    return Math.floor(Math.random() * 100);
  }

  private getCacheHitRate(): number {
    // In einer echten Implementierung würden wir hier die Cache-Hit-Rate messen
    return Math.random() * 100;
  }

  /**
   * Holt alle Alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Löscht alte Alerts
   */
  clearOldAlerts(hours: number = 24): void {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  /**
   * Holt Systemmetriken
   */
  getSystemMetrics(): SystemMetrics[] {
    return [...this.systemMetrics];
  }

  /**
   * Holt Anwendungsmetriken
   */
  getApplicationMetrics(): ApplicationMetrics[] {
    return [...this.applicationMetrics];
  }
}