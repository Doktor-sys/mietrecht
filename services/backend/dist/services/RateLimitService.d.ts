import rateLimit from 'express-rate-limit';
/**
 * Multi-Tiered Rate Limiting Service
 * Provides different rate limiting strategies for various parts of the application
 */
export declare enum RateLimitCategory {
    DEFAULT = "default",
    AUTH = "auth",
    API = "api",
    STRICT = "strict",
    PERMISSIVE = "permissive",
    WEBHOOKS = "webhooks",
    UPLOADS = "uploads"
}
export declare class RateLimitService {
    /**
     * Get rate limiter for a specific category
     * @param category The rate limit category
     * @returns Configured rate limiter middleware
     */
    static getRateLimiter(category?: RateLimitCategory): ReturnType<typeof rateLimit>;
    /**
     * Get custom rate limiter with specific configuration
     * @param config Custom rate limit configuration
     * @returns Configured rate limiter middleware
     */
    static getCustomRateLimiter(config: any): ReturnType<typeof rateLimit>;
    /**
     * Get dynamic rate limiter based on request characteristics
     * @param req Express request object
     * @returns Configured rate limiter middleware
     */
    static getDynamicRateLimiter(req: any): ReturnType<typeof rateLimit>;
    /**
     * Validate rate limit configuration
     * @param config Rate limit configuration to validate
     * @returns Boolean indicating if configuration is valid
     */
    static validateConfig(config: any): boolean;
    /**
     * Get all available rate limit categories
     * @returns Array of rate limit categories
     */
    static getCategories(): RateLimitCategory[];
    /**
     * Get configuration for a specific category
     * @param category Rate limit category
     * @returns Rate limit configuration
     */
    static getConfig(category: RateLimitCategory): any;
}
