# Circuit Breaker Patterns Implementation

This document describes the circuit breaker pattern implementation for the Mietrecht Agent system to improve resilience and prevent cascading failures when external services are unavailable.

## Overview

The circuit breaker pattern is a design pattern used to detect failures and encapsulates the logic of preventing a failure from constantly recurring during maintenance, temporary external system failure, or unexpected system difficulties. It's particularly useful for external API calls that might be temporarily unavailable.

## Circuit Breaker States

The circuit breaker has three states:

1. **Closed**: Normal operation, requests are allowed through
2. **Open**: Failure threshold exceeded, requests are blocked
3. **Half-Open**: Testing if service has recovered, limited requests allowed

### Closed State
- All requests are allowed through to the service
- Success and failure counts are tracked
- If failure threshold is exceeded, circuit opens

### Open State
- Requests are immediately rejected/fail-fast
- No calls are made to the failing service
- After a timeout period, circuit transitions to Half-Open

### Half-Open State
- Limited number of test requests are allowed through
- If test requests succeed, circuit closes
- If test requests fail, circuit reopens

## Implementation Details

### Circuit Breaker Service

The circuit breaker functionality is implemented in `services/data-sources/src/services/CircuitBreakerService.ts`:

```typescript
export interface CircuitBreakerConfig {
  timeout?: number;           // Timeout for the operation
  errorThresholdPercentage?: number;  // Percentage of failures before opening the circuit
  resetTimeout?: number;      // Time to wait before attempting to close the circuit
  rollingCountTimeout?: number;  // Time window for circuit breaker stats
  rollingCountBuckets?: number;  // Number of buckets in the rolling window
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  timeout: 10000,              // 10 seconds
  errorThresholdPercentage: 50, // 50% failures
  resetTimeout: 30000,         // 30 seconds
  rollingCountTimeout: 10000,  // 10 seconds
  rollingCountBuckets: 10
};
```

### Key Methods

#### `executeWithBreaker`
Executes a function with circuit breaker protection:

```typescript
async executeWithBreaker<T>(
  serviceName: string,
  requestFunction: () => Promise<T>,
  config: CircuitBreakerConfig = {}
): Promise<T>
```

#### `wrapFunction`
Wraps a function with a circuit breaker:

```typescript
wrapFunction<T>(
  serviceName: string,
  requestFunction: () => Promise<T>,
  config: CircuitBreakerConfig = {}
): SimpleCircuitBreaker<T>
```

#### `getStatistics`
Returns statistics for all circuit breakers:

```typescript
getStatistics(): Record<string, any>
```

## Integration with External Services

### juris API Client

The juris API client demonstrates integration with the circuit breaker pattern:

```typescript
// Execute with circuit breaker
const response = await circuitBreakerService.executeWithBreaker(
  'juris-api',
  async () => {
    return await axios.get(`${this.baseUrl}/documents`, requestConfig);
  }
);
```

### Other External Services

Similar patterns should be applied to other external service clients:
- BGH API Client
- Beck Online API Client
- BVerfG API Client
- Landgerichte API Client

## Configuration Guidelines

### Timeout Settings
- **Short operations**: 5-10 seconds
- **Long operations**: 30-60 seconds
- **Batch operations**: 5-10 minutes

### Error Thresholds
- **Critical services**: 25-30% failure rate
- **Non-critical services**: 50-70% failure rate
- **Best-effort services**: 80-90% failure rate

### Reset Timouts
- **Fast recovery services**: 30-60 seconds
- **Moderate recovery services**: 5-10 minutes
- **Slow recovery services**: 30-60 minutes

## Monitoring and Metrics

The circuit breaker tracks the following metrics:

- **Failures**: Number of failed requests
- **Successes**: Number of successful requests
- **Timeouts**: Number of timed out requests
- **Fallbacks**: Number of times fallback logic was used
- **State transitions**: Tracking of state changes

## Best Practices

### 1. Proper Configuration
- Set appropriate timeout values based on service SLAs
- Configure error thresholds based on business requirements
- Tune reset timeouts based on service recovery characteristics

### 2. Fallback Strategies
- Implement meaningful fallback responses
- Cache recent successful responses for fallback use
- Provide degraded functionality when primary service is unavailable

### 3. Monitoring
- Monitor circuit breaker state transitions
- Alert on frequent circuit openings
- Track fallback usage patterns
- Log circuit breaker events for debugging

### 4. Testing
- Test circuit breaker behavior under failure conditions
- Validate fallback logic
- Simulate network partitions and service outages
- Verify proper recovery after service restoration

## Example Usage

### Basic Usage
```typescript
import { circuitBreakerService } from '../services/CircuitBreakerService';

try {
  const result = await circuitBreakerService.executeWithBreaker(
    'external-api',
    async () => {
      return await externalApiCall();
    },
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  );
  
  console.log('API call succeeded:', result);
} catch (error) {
  console.error('API call failed:', error);
}
```

### Advanced Usage with Custom Logic
```typescript
const breaker = circuitBreakerService.wrapFunction(
  'external-api',
  async () => {
    return await externalApiCall();
  }
);

try {
  const result = await breaker.fire();
  console.log('API call succeeded:', result);
} catch (error) {
  // Check if circuit is open
  if (circuitBreakerService.isOpen('external-api')) {
    console.log('Circuit breaker is open, using fallback');
    // Use cached data or default values
    return getCachedData() || getDefaultData();
  }
  
  console.error('API call failed:', error);
}
```

## Troubleshooting

### Common Issues

#### Circuit Breaker Stays Open
1. Check if the underlying service is actually available
2. Verify timeout settings are appropriate
3. Review error handling in the wrapped function
4. Check if the reset timeout is too short

#### False Positives
1. Adjust error threshold percentage
2. Review what constitutes a "failure"
3. Consider excluding certain error types from failure counting
4. Implement retry logic before triggering circuit breaker

#### Performance Impact
1. Monitor circuit breaker overhead
2. Optimize statistics collection
3. Use appropriate rolling window sizes
4. Consider disabling circuit breaker for critical paths if necessary

## Future Enhancements

Planned improvements for the circuit breaker implementation:

1. **Integration with opossum library**: Replace simplified implementation with full-featured library
2. **Advanced metrics collection**: Prometheus/Grafana integration
3. **Dynamic configuration**: Runtime adjustment of circuit breaker parameters
4. **Distributed circuit breaking**: Shared state across multiple service instances
5. **Machine learning**: Predictive circuit breaking based on historical patterns