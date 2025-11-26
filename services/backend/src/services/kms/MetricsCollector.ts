import { logger } from '../../utils/logger';

/**
 * Prometheus-kompatible Metriken für KMS
 */
export interface KMSMetrics {
  // Key-Operationen
  keyCreations: number;
  keyRetrievals: number;
  keyRotations: number;
  keyDeletions: number;
  
  // Cache-Metriken
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  
  // Performance-Metriken
  avgKeyRetrievalTime: number;
  avgKeyCreationTime: number;
  avgRotationDuration: number;
  
  // Fehler-Metriken
  errors: number;
  securityEvents: number;
  
  // System-Status
  activeKeys: number;
  expiredKeys: number;
  compromisedKeys: number;
}

/**
 * Metriken-Sammler für KMS-Operationen
 * Sammelt Prometheus-kompatible Metriken
 */
export class MetricsCollector {
  private metrics: Map<string, number>;
  private timings: Map<string, number[]>;
  private startTimes: Map<string, number>;

  constructor() {
    this.metrics = new Map();
    this.timings = new Map();
    this.startTimes = new Map();
    this.initializeMetrics();
  }

  /**
   * Initialisiert alle Metriken mit 0
   */
  private initializeMetrics(): void {
    const metricNames = [
      'kms_key_creations_total',
      'kms_key_retrievals_total',
      'kms_key_rotations_total',
      'kms_key_deletions_total',
      'kms_cache_hits_total',
      'kms_cache_misses_total',
      'kms_errors_total',
      'kms_security_events_total',
      'kms_active_keys',
      'kms_expired_keys',
      'kms_compromised_keys'
    ];

    metricNames.forEach(name => this.metrics.set(name, 0));
    
    this.timings.set('key_retrieval', []);
    this.timings.set('key_creation', []);
    this.timings.set('key_rotation', []);
  }

  /**
   * Inkrementiert einen Counter
   */
  incrementCounter(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  /**
   * Setzt einen Gauge-Wert
   */
  setGauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  /**
   * Startet eine Zeitmessung
   */
  startTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.startTimes.set(timerId, Date.now());
    return timerId;
  }

  /**
   * Beendet eine Zeitmessung und speichert die Dauer
   */
  endTimer(timerId: string, operation: string): number {
    const startTime = this.startTimes.get(timerId);
    if (!startTime) {
      logger.warn(`Timer ${timerId} not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(timerId);

    // Speichere Timing
    const timings = this.timings.get(operation) || [];
    timings.push(duration);
    
    // Behalte nur die letzten 1000 Messungen
    if (timings.length > 1000) {
      timings.shift();
    }
    
    this.timings.set(operation, timings);

    return duration;
  }

  /**
   * Berechnet den Durchschnitt einer Timing-Metrik
   */
  private calculateAverage(operation: string): number {
    const timings = this.timings.get(operation) || [];
    if (timings.length === 0) return 0;
    
    const sum = timings.reduce((a, b) => a + b, 0);
    return sum / timings.length;
  }

  /**
   * Berechnet die Cache-Hit-Rate
   */
  private calculateCacheHitRate(): number {
    const hits = this.metrics.get('kms_cache_hits_total') || 0;
    const misses = this.metrics.get('kms_cache_misses_total') || 0;
    const total = hits + misses;
    
    if (total === 0) return 0;
    return (hits / total) * 100;
  }

  /**
   * Gibt alle Metriken zurück
   */
  getMetrics(): KMSMetrics {
    return {
      keyCreations: this.metrics.get('kms_key_creations_total') || 0,
      keyRetrievals: this.metrics.get('kms_key_retrievals_total') || 0,
      keyRotations: this.metrics.get('kms_key_rotations_total') || 0,
      keyDeletions: this.metrics.get('kms_key_deletions_total') || 0,
      cacheHits: this.metrics.get('kms_cache_hits_total') || 0,
      cacheMisses: this.metrics.get('kms_cache_misses_total') || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      avgKeyRetrievalTime: this.calculateAverage('key_retrieval'),
      avgKeyCreationTime: this.calculateAverage('key_creation'),
      avgRotationDuration: this.calculateAverage('key_rotation'),
      errors: this.metrics.get('kms_errors_total') || 0,
      securityEvents: this.metrics.get('kms_security_events_total') || 0,
      activeKeys: this.metrics.get('kms_active_keys') || 0,
      expiredKeys: this.metrics.get('kms_expired_keys') || 0,
      compromisedKeys: this.metrics.get('kms_compromised_keys') || 0
    };
  }

  /**
   * Gibt Metriken im Prometheus-Format zurück
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Counter
    lines.push('# HELP kms_key_creations_total Total number of keys created');
    lines.push('# TYPE kms_key_creations_total counter');
    lines.push(`kms_key_creations_total ${metrics.keyCreations}`);

    lines.push('# HELP kms_key_retrievals_total Total number of key retrievals');
    lines.push('# TYPE kms_key_retrievals_total counter');
    lines.push(`kms_key_retrievals_total ${metrics.keyRetrievals}`);

    lines.push('# HELP kms_key_rotations_total Total number of key rotations');
    lines.push('# TYPE kms_key_rotations_total counter');
    lines.push(`kms_key_rotations_total ${metrics.keyRotations}`);

    lines.push('# HELP kms_key_deletions_total Total number of key deletions');
    lines.push('# TYPE kms_key_deletions_total counter');
    lines.push(`kms_key_deletions_total ${metrics.keyDeletions}`);

    lines.push('# HELP kms_cache_hits_total Total number of cache hits');
    lines.push('# TYPE kms_cache_hits_total counter');
    lines.push(`kms_cache_hits_total ${metrics.cacheHits}`);

    lines.push('# HELP kms_cache_misses_total Total number of cache misses');
    lines.push('# TYPE kms_cache_misses_total counter');
    lines.push(`kms_cache_misses_total ${metrics.cacheMisses}`);

    lines.push('# HELP kms_errors_total Total number of errors');
    lines.push('# TYPE kms_errors_total counter');
    lines.push(`kms_errors_total ${metrics.errors}`);

    lines.push('# HELP kms_security_events_total Total number of security events');
    lines.push('# TYPE kms_security_events_total counter');
    lines.push(`kms_security_events_total ${metrics.securityEvents}`);

    // Gauges
    lines.push('# HELP kms_cache_hit_rate Cache hit rate percentage');
    lines.push('# TYPE kms_cache_hit_rate gauge');
    lines.push(`kms_cache_hit_rate ${metrics.cacheHitRate.toFixed(2)}`);

    lines.push('# HELP kms_active_keys Number of active keys');
    lines.push('# TYPE kms_active_keys gauge');
    lines.push(`kms_active_keys ${metrics.activeKeys}`);

    lines.push('# HELP kms_expired_keys Number of expired keys');
    lines.push('# TYPE kms_expired_keys gauge');
    lines.push(`kms_expired_keys ${metrics.expiredKeys}`);

    lines.push('# HELP kms_compromised_keys Number of compromised keys');
    lines.push('# TYPE kms_compromised_keys gauge');
    lines.push(`kms_compromised_keys ${metrics.compromisedKeys}`);

    // Histogramme (als Durchschnitt)
    lines.push('# HELP kms_key_retrieval_duration_ms Average key retrieval duration in milliseconds');
    lines.push('# TYPE kms_key_retrieval_duration_ms gauge');
    lines.push(`kms_key_retrieval_duration_ms ${metrics.avgKeyRetrievalTime.toFixed(2)}`);

    lines.push('# HELP kms_key_creation_duration_ms Average key creation duration in milliseconds');
    lines.push('# TYPE kms_key_creation_duration_ms gauge');
    lines.push(`kms_key_creation_duration_ms ${metrics.avgKeyCreationTime.toFixed(2)}`);

    lines.push('# HELP kms_rotation_duration_ms Average rotation duration in milliseconds');
    lines.push('# TYPE kms_rotation_duration_ms gauge');
    lines.push(`kms_rotation_duration_ms ${metrics.avgRotationDuration.toFixed(2)}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Setzt alle Metriken zurück
   */
  reset(): void {
    this.metrics.clear();
    this.timings.clear();
    this.startTimes.clear();
    this.initializeMetrics();
  }
}
