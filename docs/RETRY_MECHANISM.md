# Retry Mechanism Documentation

## Overview

The Mietrecht Agent includes a robust retry mechanism to handle transient failures when communicating with external data sources. This mechanism ensures reliable data fetching even in the presence of temporary network issues, rate limiting, or server-side problems.

## Architecture

The retry mechanism is implemented in the [mietrecht_data_sources.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/mietrecht_data_sources.js) file and consists of two main functions:

1. **[fetchWithRetry](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/mietrecht_data_sources.js#L693-L741)** - Core retry functionality with configurable options
2. **[fetchWithAllOptimizations](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/mietrecht_data_sources.js#L750-L767)** - Combines retry mechanism with caching and rate limiting

## Features

### 1. Configurable Retry Parameters

The retry mechanism supports several configurable parameters:

- **maxRetries**: Maximum number of retry attempts (default: 3)
- **baseDelay**: Base delay between retries in milliseconds (default: 1000)
- **retryableErrors**: Array of error messages that should trigger retries
- **nonRetryableErrors**: Array of error messages that should NOT trigger retries
- **strategy**: Backoff strategy ('exponential', 'linear', or 'fixed')

### 2. Intelligent Error Handling

The mechanism distinguishes between retryable and non-retryable errors:

**Retryable Errors (will trigger retries):**
- Network connectivity issues (ECONNRESET, ENOTFOUND, ECONNREFUSED, ETIMEDOUT)
- Server-side errors (502, 503, 504)
- Rate limiting errors
- Generic network errors

**Non-Retryable Errors (will NOT trigger retries):**
- Client-side errors (400, 401, 403, 404)
- Authentication/authorization errors
- Invalid input errors

### 3. Backoff Strategies

Three backoff strategies are supported:

1. **Exponential Backoff** (default): Delay increases exponentially with each retry
   - Formula: `baseDelay * 2^attempt + random_jitter`
   - Best for handling server overload situations

2. **Linear Backoff**: Delay increases linearly with each retry
   - Formula: `baseDelay * (attempt + 1) + random_jitter`
   - Good for predictable network issues

3. **Fixed Backoff**: Constant delay between retries
   - Formula: `baseDelay + random_jitter`
   - Suitable for simple retry scenarios

### 4. Jitter

Random jitter is added to all delay calculations to prevent thundering herd problems when multiple clients retry simultaneously.

## Usage Examples

### Basic Usage

```javascript
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

async function fetchData() {
  return await fetchWithRetry(
    () => fetch('https://api.example.com/data'),
    { maxRetries: 3, baseDelay: 1000 }
  );
}
```

### Advanced Configuration

```javascript
const { fetchWithAllOptimizations } = require('./mietrecht_data_sources.js');

async function fetchCourtData(cacheKey) {
  return await fetchWithAllOptimizations(
    cacheKey,
    () => fetch('https://court-api.example.com/decisions'),
    {
      maxRetries: 5,
      baseDelay: 500,
      strategy: 'exponential',
      useCache: true
    }
  );
}
```

## Integration with API Clients

All API clients in the Mietrecht Agent use the retry mechanism:

1. **[bgh_api_client.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/bgh_api_client.js)** - Bundesgerichtshof API client
2. **[landgericht_api_client.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/landgericht_api_client.js)** - Landgericht API client
3. **[njw_api_client.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/njw_api_client.js)** - NJW API client

Each client integrates the retry mechanism to ensure reliable data fetching from their respective sources.

## Testing

The retry mechanism includes comprehensive tests to verify functionality:

1. **[test_retry_mechanism.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test/test_retry_mechanism.js)** - Basic retry functionality tests
2. **[test_enhanced_retry_mechanism.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test/test_enhanced_retry_mechanism.js)** - Advanced retry mechanism tests

Run tests using the provided batch files:
- [test_retry_mechanism.bat](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test_retry_mechanism.bat)
- [test_enhanced_retry_mechanism.bat](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test_enhanced_retry_mechanism.bat)