import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Einfacher Logger für Frontend
const logger = {
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data);
  }
};

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

interface OptimizationOptions {
  debounceDelay?: number;
  throttleDelay?: number;
  memoize?: boolean;
  lazyLoad?: boolean;
}

/**
 * Hook für Performance-Optimierung von React-Komponenten
 */
export function usePerformanceOptimization<T>(
  data: T,
  options: OptimizationOptions = {}
) {
  const {
    debounceDelay = 300,
    throttleDelay = 100,
    memoize = true,
    lazyLoad = false
  } = options;

  // Performance-Metriken
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0
  });

  // Debounce-Funktion
  const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Throttle-Funktion
  const useThrottle = <T>(value: T, limit: number): T => {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      }, limit - (Date.now() - lastRan.current));

      return () => {
        clearTimeout(handler);
      };
    }, [value, limit]);

    return throttledValue;
  };

  // Memoization
  const memoizedData = useMemo(() => {
    if (memoize) {
      return data;
    }
    return data;
  }, [data, memoize]);

  // Lazy Loading
  const [isLoaded, setIsLoaded] = useState(!lazyLoad);

  useEffect(() => {
    if (lazyLoad && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100); // Kleine Verzögerung für bessere UX

      return () => clearTimeout(timer);
    }
  }, [lazyLoad, isLoaded]);

  // Performance-Messung
  const measureRenderTime = useCallback((callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start,
      reRenderCount: prev.reRenderCount + 1
    }));
  }, []);

  // Memory-Nutzung messen
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        // @ts-ignore
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({
          ...prev,
          memoryUsage
        }));
      }
    };

    const interval = setInterval(measureMemory, 5000); // Alle 5 Sekunden
    return () => clearInterval(interval);
  }, []);

  // Virtuelles Scrolling
  const useVirtualScroll = (itemHeight: number, overscan: number = 5) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const onScroll = useCallback((e: any) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const onResize = useCallback(() => {
      // In einer echten Implementierung würden wir hier die Container-Höhe messen
      setContainerHeight(window.innerHeight - 200); // Beispielwert
    }, []);

    useEffect(() => {
      window.addEventListener('resize', onResize);
      onResize();
      return () => window.removeEventListener('resize', onResize);
    }, [onResize]);

    const virtualItems = useMemo(() => {
      // In einer echten Implementierung würden wir hier die sichtbaren Items berechnen
      return {
        startIndex: 0,
        endIndex: 0,
        totalHeight: 0,
        offsetY: 0
      };
    }, [scrollTop, containerHeight, itemHeight, overscan]);

    return {
      onScroll,
      containerHeight,
      virtualItems
    };
  };

  return {
    // Optimized data
    data: memoizedData,
    
    // Lazy loading
    isLoaded,
    
    // Performance metrics
    metrics,
    measureRenderTime,
    
    // Utility hooks
    useDebounce,
    useThrottle,
    useVirtualScroll,
    
    // Helper functions
    forceUpdate: () => setMetrics(prev => ({ ...prev }))
  };
}

// Hilfs-Hook für teure Berechnungen
export function useExpensiveCalculation<T, R>(
  data: T,
  calculate: (data: T) => R,
  deps: any[] = []
): R {
  return useMemo(() => {
    logger.debug('Performing expensive calculation');
    return calculate(data);
  }, [data, calculate, ...deps]);
}

// Hilfs-Hook für Windowing/Virtualisierung
export function useWindowing<T>(
  items: T[],
  itemHeight: number,
  windowHeight: number,
  scrollTop: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(windowHeight / itemHeight) + 5, // Overscan
    items.length
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex
  };
}