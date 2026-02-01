// Einfacher Logger für Frontend
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data);
  }
};

interface WebVitals {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

interface ComponentMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastRender: Date;
}

interface NetworkMetrics {
  resource: string;
  loadTime: number;
  size: number;
  type: string;
}

export class FrontendPerformanceMonitor {
  private static instance: FrontendPerformanceMonitor;
  private webVitals: Partial<WebVitals> = {};
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private networkMetrics: NetworkMetrics[] = [];
  private startTime: number;

  private constructor() {
    this.startTime = performance.now();
    this.setupWebVitals();
  }

  public static getInstance(): FrontendPerformanceMonitor {
    if (!FrontendPerformanceMonitor.instance) {
      FrontendPerformanceMonitor.instance = new FrontendPerformanceMonitor();
    }
    return FrontendPerformanceMonitor.instance;
  }

  /**
   * Setzt Web Vitals auf
   */
  private setupWebVitals(): void {
    // Messung von First Contentful Paint
    if ('paint' in performance) {
      performance.getEntriesByType('paint').forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.webVitals.FCP = entry.startTime;
          logger.info(`FCP: ${entry.startTime}ms`);
        }
      });
    }

    // Messung von Largest Contentful Paint
    if ('largest-contentful-paint' in performance) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.webVitals.LCP = lastEntry.startTime;
        logger.info(`LCP: ${lastEntry.startTime}ms`);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Messung von First Input Delay
    if ('event' in performance) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          // @ts-ignore
          if (entry.entryType === 'first-input') {
            // @ts-ignore
            this.webVitals.FID = entry.processingStart - entry.startTime;
            // @ts-ignore
            logger.info(`FID: ${entry.processingStart - entry.startTime}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    }

    // Messung von Cumulative Layout Shift
    if ('layout-shift' in performance) {
      let clsValue = 0;
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          // @ts-ignore
          if (!entry.hadRecentInput) {
            // @ts-ignore
            clsValue += entry.value;
          }
        }
        this.webVitals.CLS = clsValue;
        logger.info(`CLS: ${clsValue}`);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Erfasst Komponentenmetriken
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    const existingMetrics = this.componentMetrics.get(componentName);
    
    if (existingMetrics) {
      this.componentMetrics.set(componentName, {
        ...existingMetrics,
        renderTime: (existingMetrics.renderTime + renderTime) / 2, // Durchschnitt
        updateCount: existingMetrics.updateCount + 1,
        lastRender: new Date()
      });
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        mountTime: renderTime,
        updateCount: 1,
        lastRender: new Date()
      });
    }

    logger.debug(`Component ${componentName} rendered in ${renderTime}ms`);
  }

  /**
   * Erfasst Netzwerkmetriken
   */
  trackNetworkResource(resource: string, loadTime: number, size: number, type: string): void {
    this.networkMetrics.push({
      resource,
      loadTime,
      size,
      type
    });

    logger.debug(`Resource ${resource} loaded in ${loadTime}ms (${size} bytes)`);
  }

  /**
   * Misst die Render-Zeit einer Komponente
   */
  measureRenderTime<T>(componentName: string, renderFunction: () => T): T {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    
    const renderTime = end - start;
    this.trackComponentRender(componentName, renderTime);
    
    return result;
  }

  /**
   * Misst die Ladezeit einer Ressource
   */
  measureResourceLoad(resource: string, type: string, loadFunction: () => Promise<any>): Promise<any> {
    const start = performance.now();
    
    return loadFunction().then(result => {
      const end = performance.now();
      const loadTime = end - start;
      
      // Hole die Größe der Ressource (wenn möglich)
      let size = 0;
      const resourceEntries = performance.getEntriesByName(resource);
      if (resourceEntries.length > 0) {
        // @ts-ignore
        size = resourceEntries[0].encodedBodySize || 0;
      }
      
      this.trackNetworkResource(resource, loadTime, size, type);
      return result;
    });
  }

  /**
   * Holt Web Vitals
   */
  getWebVitals(): Partial<WebVitals> {
    return { ...this.webVitals };
  }

  /**
   * Holt Komponentenmetriken
   */
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * Holt Netzwerkmetriken
   */
  getNetworkMetrics(): NetworkMetrics[] {
    return [...this.networkMetrics];
  }

  /**
   * Generiert einen Performance-Bericht
   */
  generateReport(): string {
    const reportLines = [
      '=== Frontend Performance Report ===',
      `Report Generated: ${new Date().toISOString()}`,
      '',
      '=== Web Vitals ==='
    ];

    // Web Vitals
    if (this.webVitals.FCP) {
      reportLines.push(`First Contentful Paint (FCP): ${this.webVitals.FCP.toFixed(2)}ms`);
    }
    if (this.webVitals.LCP) {
      reportLines.push(`Largest Contentful Paint (LCP): ${this.webVitals.LCP.toFixed(2)}ms`);
    }
    if (this.webVitals.FID) {
      reportLines.push(`First Input Delay (FID): ${this.webVitals.FID.toFixed(2)}ms`);
    }
    if (this.webVitals.CLS) {
      reportLines.push(`Cumulative Layout Shift (CLS): ${this.webVitals.CLS.toFixed(4)}`);
    }

    // Komponentenmetriken
    reportLines.push('', '=== Component Performance ===');
    const componentMetrics = this.getComponentMetrics();
    componentMetrics.forEach(metric => {
      reportLines.push(
        `${metric.componentName}: ` +
        `Avg Render: ${metric.renderTime.toFixed(2)}ms, ` +
        `Updates: ${metric.updateCount}`
      );
    });

    // Netzwerkmetriken
    reportLines.push('', '=== Network Performance ===');
    const networkMetrics = this.getNetworkMetrics();
    const totalLoadTime = networkMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    const totalSize = networkMetrics.reduce((sum, m) => sum + m.size, 0);
    
    reportLines.push(`Total Resources: ${networkMetrics.length}`);
    reportLines.push(`Total Load Time: ${totalLoadTime.toFixed(2)}ms`);
    reportLines.push(`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);

    return reportLines.join('\n');
  }

  /**
   * Loggt den Performance-Bericht
   */
  logReport(): void {
    logger.info(this.generateReport());
  }

  /**
   * Löscht alte Metriken
   */
  clearMetrics(): void {
    this.componentMetrics.clear();
    this.networkMetrics = [];
    this.webVitals = {};
  }

  /**
   * Startet eine neue Messung
   */
  startMeasurement(): number {
    return performance.now();
  }

  /**
   * Beendet eine Messung und gibt die Dauer zurück
   */
  endMeasurement(startTime: number): number {
    return performance.now() - startTime;
  }
}