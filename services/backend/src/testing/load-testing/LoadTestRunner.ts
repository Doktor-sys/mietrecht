import axios from 'axios';
import { logger } from '../../utils/logger';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';

interface LoadTestConfig {
  targetUrl: string;
  concurrency: number;
  requestsPerSecond: number;
  duration: number; // in seconds
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
}

interface TestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  startTime: Date;
  endTime: Date;
}

interface RequestMetrics {
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
}

export class LoadTestRunner {
  private performanceMonitor: PerformanceMonitor;
  private isRunning: boolean = false;
  private results: TestResult[] = [];
  private requestMetrics: RequestMetrics[] = [];

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Führt einen Lasttest aus
   */
  async runLoadTest(config: LoadTestConfig): Promise<TestResult> {
    logger.info(`Starting load test: ${config.targetUrl}`, {
      concurrency: config.concurrency,
      requestsPerSecond: config.requestsPerSecond,
      duration: config.duration
    });

    this.isRunning = true;
    const startTime = new Date();
    
    // Initialisiere Metriken
    const metrics: RequestMetrics[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    try {
      // Berechne die Anzahl der Anfragen pro Worker
      const requestsPerWorker = Math.ceil(
        (config.requestsPerSecond * config.duration) / config.concurrency
      );

      // Erstelle Worker-Promises
      const workerPromises = [];
      for (let i = 0; i < config.concurrency; i++) {
        workerPromises.push(
          this.runWorker(
            config,
            requestsPerWorker,
            metrics
          )
        );
      }

      // Warte auf alle Worker
      await Promise.all(workerPromises);

      // Berechne die Gesamtstatistiken
      totalRequests = metrics.length;
      successfulRequests = metrics.filter(m => m.success).length;
      failedRequests = metrics.filter(m => !m.success).length;

      // Berechne Antwortzeiten
      const responseTimes = metrics.map(m => m.responseTime);
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      // Berechne Durchsatz und Fehlerrate
      const durationInSeconds = config.duration;
      const throughput = totalRequests / durationInSeconds;
      const errorRate = failedRequests / totalRequests;

      const result: TestResult = {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        throughput,
        errorRate,
        startTime,
        endTime: new Date()
      };

      this.results.push(result);
      this.requestMetrics.push(...metrics);

      logger.info('Load test completed', result);
      return result;
    } catch (error) {
      logger.error('Load test failed', { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Führt einen Worker für den Lasttest aus
   */
  private async runWorker(
    config: LoadTestConfig,
    requestsToSend: number,
    metrics: RequestMetrics[]
  ): Promise<void> {
    const delayBetweenRequests = 1000 / config.requestsPerSecond;
    
    for (let i = 0; i < requestsToSend && this.isRunning; i++) {
      try {
        const startTime = Date.now();
        
        // Sende die Anfrage
        const response = await axios({
          method: config.method,
          url: config.targetUrl,
          data: config.payload,
          headers: config.headers,
          timeout: 30000 // 30 Sekunden Timeout
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Erfasse die Metrik
        metrics.push({
          responseTime,
          statusCode: response.status,
          success: response.status >= 200 && response.status < 300,
          timestamp: new Date()
        });
        
        // Warte vor der nächsten Anfrage
        if (i < requestsToSend - 1) {
          await this.delay(delayBetweenRequests);
        }
      } catch (error: unknown) {
        const endTime = Date.now();
        const responseTime = endTime - (Date.now() - 1000); // Schätzung
        
        // Erfasse die Fehlermetrik
        metrics.push({
          responseTime,
          statusCode: (error as any).response?.status || 500,
          success: false,
          timestamp: new Date()
        });
        
        logger.warn(`Request failed during load test`, {
          url: config.targetUrl,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Verzögerungsfunktion
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Führt einen Stresstest aus
   */
  async runStressTest(
    baseUrl: string,
    maxConcurrency: number,
    stepSize: number = 10
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    logger.info(`Starting stress test: ${baseUrl}`, {
      maxConcurrency,
      stepSize
    });
    
    for (let concurrency = stepSize; concurrency <= maxConcurrency; concurrency += stepSize) {
      const config: LoadTestConfig = {
        targetUrl: `${baseUrl}/health`,
        concurrency,
        requestsPerSecond: concurrency * 2,
        duration: 30, // 30 Sekunden
        method: 'GET'
      };
      
      try {
        const result = await this.runLoadTest(config);
        results.push(result);
        
        // Prüfe, ob die Fehlerquote zu hoch ist
        if (result.errorRate > 0.1) { // Mehr als 10% Fehler
          logger.warn(`High error rate detected, stopping stress test`, {
            concurrency,
            errorRate: result.errorRate
          });
          break;
        }
      } catch (error) {
        logger.error(`Stress test failed at concurrency ${concurrency}`, { error });
        break;
      }
    }
    
    return results;
  }

  /**
   * Führt einen Spike-Test aus
   */
  async runSpikeTest(
    baseUrl: string,
    baselineConcurrency: number,
    spikeConcurrency: number,
    spikeDuration: number = 60 // 60 Sekunden
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    logger.info(`Starting spike test: ${baseUrl}`, {
      baselineConcurrency,
      spikeConcurrency,
      spikeDuration
    });
    
    // Baseline-Test
    const baselineConfig: LoadTestConfig = {
      targetUrl: `${baseUrl}/health`,
      concurrency: baselineConcurrency,
      requestsPerSecond: baselineConcurrency * 2,
      duration: 60, // 1 Minute
      method: 'GET'
    };
    
    const baselineResult = await this.runLoadTest(baselineConfig);
    results.push(baselineResult);
    
    // Spike-Test
    const spikeConfig: LoadTestConfig = {
      targetUrl: `${baseUrl}/health`,
      concurrency: spikeConcurrency,
      requestsPerSecond: spikeConcurrency * 2,
      duration: spikeDuration,
      method: 'GET'
    };
    
    const spikeResult = await this.runLoadTest(spikeConfig);
    results.push(spikeResult);
    
    // Rückkehr zum Baseline
    const recoveryResult = await this.runLoadTest(baselineConfig);
    results.push(recoveryResult);
    
    return results;
  }

  /**
   * Generiert einen Lasttest-Bericht
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No test results available';
    }
    
    const latestResult = this.results[this.results.length - 1];
    
    const reportLines = [
      '=== Load Test Report ===',
      `Test Duration: ${latestResult.endTime.getTime() - latestResult.startTime.getTime()}ms`,
      `Total Requests: ${latestResult.totalRequests}`,
      `Successful Requests: ${latestResult.successfulRequests}`,
      `Failed Requests: ${latestResult.failedRequests}`,
      `Error Rate: ${(latestResult.errorRate * 100).toFixed(2)}%`,
      `Average Response Time: ${latestResult.averageResponseTime.toFixed(2)}ms`,
      `Min Response Time: ${latestResult.minResponseTime}ms`,
      `Max Response Time: ${latestResult.maxResponseTime}ms`,
      `Throughput: ${latestResult.throughput.toFixed(2)} requests/second`,
      '',
      '=== Performance Recommendations ==='
    ];
    
    // Performance-Empfehlungen basierend auf den Ergebnissen
    if (latestResult.errorRate > 0.05) {
      reportLines.push('- High error rate detected. Consider scaling up resources.');
    }
    
    if (latestResult.averageResponseTime > 1000) {
      reportLines.push('- High response times detected. Consider optimizing database queries.');
    }
    
    if (latestResult.throughput < 100) {
      reportLines.push('- Low throughput detected. Consider implementing caching.');
    }
    
    return reportLines.join('\n');
  }

  /**
   * Holt die Testergebnisse
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Löscht die Testergebnisse
   */
  clearResults(): void {
    this.results = [];
    this.requestMetrics = [];
  }

  /**
   * Prüft, ob ein Test läuft
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }
}
