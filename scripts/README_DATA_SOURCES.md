# Mietrecht Data Sources Enhancement

This document describes the enhanced data sources functionality for the Mietrecht Agent, including caching, rate limiting, and retry mechanisms.

## Overview

The enhanced data sources module provides improved performance and reliability when fetching court decisions from various German legal databases. The enhancements include:

1. **Caching Mechanism** - Reduces redundant API calls and improves response times
2. **Rate Limiting** - Prevents overwhelming external APIs with too many requests
3. **Retry Mechanism** - Automatically retries failed requests with exponential backoff
4. **Specialized API Clients** - Dedicated clients for specific data sources

## Features

### Caching Mechanism

The caching mechanism stores previously fetched data for a configurable time period (default: 30 minutes) to reduce redundant API calls and improve response times.

```javascript
const { fetchWithCache } = require('./mietrecht_data_sources.js');

const data = await fetchWithCache("cache-key", async () => {
  return await fetchBGHDecisions({ query: "mietrecht" });
});
```

### Rate Limiting

The rate limiting mechanism prevents the application from making too many requests to external APIs within a specified time window.

```javascript
const { fetchWithRateLimiting } = require('./mietrecht_data_sources.js');

const data = await fetchWithRateLimiting(async () => {
  return await fetchLandgerichtDecisions({ query: "mietrecht" });
});
```

### Retry Mechanism

The retry mechanism automatically retries failed requests with exponential backoff to handle temporary network issues or API errors.

```javascript
const { fetchWithRetry } = require('./mietrecht_data_sources.js');

const data = await fetchWithRetry(async () => {
  return await fetchBVerfGDecisions({ query: "mietrecht" });
}, 3, 1000); // 3 retries with 1000ms base delay
```

### BGH API Client

A specialized client for interacting with the Bundesgerichtshof (Federal Court of Justice) API.

```javascript
const { searchDecisions, getDecisionDetails } = require('./bgh_api_client.js');

// Search for decisions
const results = await searchDecisions({ query: "mietrecht" });

// Get detailed information for a specific decision
const details = await getDecisionDetails("bgh-2025-viii-zr-121-24");
```

## Installation

The enhanced data sources functionality uses the same dependencies as the existing project:

```bash
npm install
```

## Usage

### Running Tests

To test the enhanced data sources functionality:

```bash
npm run test-data-sources-enhanced
```

### Integration with Mietrecht Agent

The enhanced data sources can be integrated with the Mietrecht Agent by replacing calls to the original data fetching functions with the enhanced versions.

## Configuration

The caching mechanism can be configured by modifying the `CACHE_TTL` constant in `mietrecht_data_sources.js`:

```javascript
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
```

The rate limiting mechanism can be configured by modifying the `rateLimiter` object:

```javascript
const rateLimiter = {
  maxRequests: 10,    // Maximum requests per time window
  timeWindow: 60000   // Time window in milliseconds (1 minute)
};
```

## Future Improvements

Planned enhancements for the data sources module include:

1. **Redis Integration** - For distributed caching in production environments
2. **Advanced Retry Logic** - With circuit breaker patterns
3. **Request Queuing** - For better handling of high-volume requests
4. **Monitoring and Metrics** - For tracking performance and reliability

## Support

For questions or issues with the data sources enhancement, please contact the development team.