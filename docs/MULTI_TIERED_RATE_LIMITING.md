# Multi-Tiered Rate Limiting Implementation

## Overview

This document describes the implementation of a multi-tiered rate limiting system for the SmartLaw Mietrecht application. The system provides different rate limiting strategies for various parts of the application to ensure optimal performance while maintaining security.

## Rate Limit Categories

### 1. Default Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 100
- **Purpose**: General protection for all endpoints

### 2. Authentication Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 5
- **Purpose**: Protect authentication endpoints from brute force attacks

### 3. API Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 500
- **Purpose**: Standard rate limiting for API endpoints

### 4. Strict Rate Limit
- **Window**: 1 minute
- **Max Requests**: 10
- **Purpose**: Extra protection for sensitive/admin endpoints

### 5. Permissive Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 1000
- **Purpose**: Higher limits for public/non-sensitive endpoints

### 6. Webhooks Rate Limit
- **Window**: 1 hour
- **Max Requests**: 1000
- **Purpose**: Appropriate limits for webhook processing

### 7. Uploads Rate Limit
- **Window**: 1 hour
- **Max Requests**: 50
- **Purpose**: Control document upload frequency

## Implementation Details

### RateLimitService Class

The `RateLimitService` provides a centralized way to manage rate limiting across the application:

```typescript
// Get rate limiter for a specific category
const apiLimiter = RateLimitService.getRateLimiter(RateLimitCategory.API);

// Get custom rate limiter with specific configuration
const customLimiter = RateLimitService.getCustomRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200
});

// Get configuration for a specific category
const config = RateLimitService.getConfig(RateLimitCategory.AUTH);
```

## Usage in Application

Rate limiting is applied at different levels in the application:

1. **Global API Protection**: Applied to `/api/` routes
2. **Authentication Protection**: Applied specifically to auth endpoints
3. **Webhook Protection**: Applied to webhook endpoints
4. **Upload Protection**: Applied to document upload endpoints

## Benefits

1. **Granular Control**: Different limits for different types of requests
2. **Security**: Prevents abuse while allowing legitimate usage
3. **Performance**: Optimized limits based on endpoint sensitivity
4. **Scalability**: Configurable tiers that can be adjusted as needed
5. **Monitoring**: Clear categorization for logging and analytics

## Configuration

All rate limit configurations can be adjusted in the `RateLimitService.ts` file. Future enhancements could include:
- Environment-specific configurations
- Dynamic adjustment based on load
- Integration with monitoring systems
- User-specific rate limits