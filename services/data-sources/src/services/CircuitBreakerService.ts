/**
 * Circuit Breaker Service
 * 
 * This service provides circuit breaker functionality for external API calls
 * to improve resilience and prevent cascading failures.
 */

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  timeout?: number;           // Timeout for the operation
  errorThresholdPercentage?: number;  // Percentage of failures before opening the circuit
  resetTimeout?: number;      // Time to wait before attempting to close the circuit
  rollingCountTimeout?: number;  // Time window for circuit breaker stats
  rollingCountBuckets?: number;  // Number of buckets in the rolling window
}

// Default configuration
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  timeout: 10000,              // 10 seconds
  errorThresholdPercentage: 50, // 50% failures
  resetTimeout: 30000,         // 30 seconds
  rollingCountTimeout: 10000,  // 10 seconds
  rollingCountBuckets: 10
};

// Circuit breaker state
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Simplified circuit breaker interface
interface SimpleCircuitBreaker<T> {
  fire: (...args: any[]) => Promise<T>;
  state: CircuitBreakerState;
  opened: boolean;
  closed: boolean;
  halfOpen: boolean;
  close: () => void;
  stats: any;
}

export class CircuitBreakerService {
  private breakers: Map<string, SimpleCircuitBreaker<any>> = new Map();

  /**
   * Create a circuit breaker for a specific service
   * @param serviceName Name of the service
   * @param config Circuit breaker configuration
   */
  createBreaker(
    serviceName: string, 
    config: CircuitBreakerConfig = {}
  ): SimpleCircuitBreaker<any> {
    const breakerConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Create a simple circuit breaker simulation
    const breaker: SimpleCircuitBreaker<any> = {
      fire: async (...args: any[]): Promise<any> => {
        // This function will be replaced when wrapping actual API calls
        throw new Error('Circuit breaker action not implemented');
      },
      state: 'CLOSED',
      opened: false,
      closed: true,
      halfOpen: false,
      close: () => {
        breaker.state = 'CLOSED';
        breaker.opened = false;
        breaker.closed = true;
        breaker.halfOpen = false;
      },
      stats: {
        failures: 0,
        successes: 0,
        timeouts: 0,
        fallbacks: 0
      }
    };

    console.log(`Circuit breaker created for service: ${serviceName}`);

    // Store the breaker
    this.breakers.set(serviceName, breaker);
    
    return breaker;
  }

  /**
   * Get an existing circuit breaker
   * @param serviceName Name of the service
   */
  getBreaker(serviceName: string): SimpleCircuitBreaker<any> | undefined {
    return this.breakers.get(serviceName);
  }

  /**
   * Wrap a function with a circuit breaker
   * @param serviceName Name of the service
   * @param requestFunction Function that makes the actual request
   * @param config Circuit breaker configuration
   */
  wrapFunction<T>(
    serviceName: string,
    requestFunction: () => Promise<T>,
    config: CircuitBreakerConfig = {}
  ): SimpleCircuitBreaker<T> {
    // Get or create the circuit breaker
    let breaker = this.getBreaker(serviceName);
    if (!breaker) {
      breaker = this.createBreaker(serviceName, config);
    }

    // Update the breaker's action to use the provided request function
    (breaker as any).fire = requestFunction;

    return breaker as SimpleCircuitBreaker<T>;
  }

  /**
   * Execute a request with circuit breaker protection
   * @param serviceName Name of the service
   * @param requestFunction Function that makes the actual request
   * @param config Circuit breaker configuration
   */
  async executeWithBreaker<T>(
    serviceName: string,
    requestFunction: () => Promise<T>,
    config: CircuitBreakerConfig = {}
  ): Promise<T> {
    const breaker = this.wrapFunction(serviceName, requestFunction, config);
    return breaker.fire();
  }

  /**
   * Get statistics for all circuit breakers
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = {
        state: breaker.state,
        stats: breaker.stats
      };
    }
    
    return stats;
  }

  /**
   * Close all circuit breakers
   */
  closeAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.close();
    }
    this.breakers.clear();
  }

  /**
   * Check if a circuit breaker is open
   * @param serviceName Name of the service
   */
  isOpen(serviceName: string): boolean {
    const breaker = this.getBreaker(serviceName);
    return breaker ? breaker.opened : false;
  }

  /**
   * Check if a circuit breaker is closed
   * @param serviceName Name of the service
   */
  isClosed(serviceName: string): boolean {
    const breaker = this.getBreaker(serviceName);
    return breaker ? breaker.closed : true;
  }

  /**
   * Check if a circuit breaker is half-open
   * @param serviceName Name of the service
   */
  isHalfOpen(serviceName: string): boolean {
    const breaker = this.getBreaker(serviceName);
    return breaker ? breaker.halfOpen : false;
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService();

export default CircuitBreakerService;