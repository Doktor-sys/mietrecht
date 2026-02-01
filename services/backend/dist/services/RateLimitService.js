"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = exports.RateLimitCategory = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
/**
 * Multi-Tiered Rate Limiting Service
 * Provides different rate limiting strategies for various parts of the application
 */
// Different rate limiting categories
var RateLimitCategory;
(function (RateLimitCategory) {
    RateLimitCategory["DEFAULT"] = "default";
    RateLimitCategory["AUTH"] = "auth";
    RateLimitCategory["API"] = "api";
    RateLimitCategory["STRICT"] = "strict";
    RateLimitCategory["PERMISSIVE"] = "permissive";
    RateLimitCategory["WEBHOOKS"] = "webhooks";
    RateLimitCategory["UPLOADS"] = "uploads";
})(RateLimitCategory || (exports.RateLimitCategory = RateLimitCategory = {}));
// Tiered rate limit configurations
const RATE_LIMIT_CONFIGS = {
    [RateLimitCategory.DEFAULT]: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.AUTH]: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Only 5 auth attempts per window
        message: {
            success: false,
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.API]: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // 500 API requests per window
        message: {
            success: false,
            error: {
                code: 'API_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele API-Anfragen. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.STRICT]: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 10, // Only 10 requests per minute
        message: {
            success: false,
            error: {
                code: 'STRICT_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.PERMISSIVE]: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
        message: {
            success: false,
            error: {
                code: 'PERMISSIVE_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.WEBHOOKS]: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 1000, // 1000 webhook requests per hour
        message: {
            success: false,
            error: {
                code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Webhook-Anfragen. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    [RateLimitCategory.UPLOADS]: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // 50 upload requests per hour
        message: {
            success: false,
            error: {
                code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
                message: 'Zu viele Upload-Anfragen. Bitte versuchen Sie es später erneut.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    }
};
class RateLimitService {
    /**
     * Get rate limiter for a specific category
     * @param category The rate limit category
     * @returns Configured rate limiter middleware
     */
    static getRateLimiter(category = RateLimitCategory.DEFAULT) {
        const config = RATE_LIMIT_CONFIGS[category];
        if (!config) {
            logger_1.logger.warn(`Unknown rate limit category: ${category}, using default`);
            return (0, express_rate_limit_1.default)(RATE_LIMIT_CONFIGS[RateLimitCategory.DEFAULT]);
        }
        logger_1.logger.info(`Creating rate limiter for category: ${category}`);
        return (0, express_rate_limit_1.default)(config);
    }
    /**
     * Get custom rate limiter with specific configuration
     * @param config Custom rate limit configuration
     * @returns Configured rate limiter middleware
     */
    static getCustomRateLimiter(config) {
        const defaultConfig = RATE_LIMIT_CONFIGS[RateLimitCategory.DEFAULT];
        const mergedConfig = {
            ...defaultConfig,
            ...config
        };
        logger_1.logger.info('Creating custom rate limiter', { config: mergedConfig });
        return (0, express_rate_limit_1.default)(mergedConfig);
    }
    /**
     * Get dynamic rate limiter based on request characteristics
     * @param req Express request object
     * @returns Configured rate limiter middleware
     */
    static getDynamicRateLimiter(req) {
        const path = req.path;
        const method = req.method;
        // Special handling for authentication endpoints
        if (path.startsWith('/api/auth/')) {
            return this.getRateLimiter(RateLimitCategory.AUTH);
        }
        // Special handling for admin endpoints
        if (path.startsWith('/api/admin/')) {
            return this.getRateLimiter(RateLimitCategory.STRICT);
        }
        // Special handling for webhooks
        if (path.startsWith('/api/webhooks/')) {
            return this.getRateLimiter(RateLimitCategory.WEBHOOKS);
        }
        // Special handling for document uploads
        if (path.startsWith('/api/documents/') && method === 'POST') {
            return this.getRateLimiter(RateLimitCategory.UPLOADS);
        }
        // Default API rate limiting
        if (path.startsWith('/api/')) {
            return this.getRateLimiter(RateLimitCategory.API);
        }
        // Default rate limiting
        return this.getRateLimiter(RateLimitCategory.DEFAULT);
    }
    /**
     * Validate rate limit configuration
     * @param config Rate limit configuration to validate
     * @returns Boolean indicating if configuration is valid
     */
    static validateConfig(config) {
        try {
            if (config.windowMs <= 0) {
                logger_1.logger.error('Rate limit windowMs must be positive');
                return false;
            }
            if (config.max <= 0) {
                logger_1.logger.error('Rate limit max must be positive');
                return false;
            }
            if (!config.message) {
                logger_1.logger.error('Rate limit message is required');
                return false;
            }
            logger_1.logger.info('Rate limit configuration validated successfully');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error validating rate limit configuration', { error });
            return false;
        }
    }
    /**
     * Get all available rate limit categories
     * @returns Array of rate limit categories
     */
    static getCategories() {
        return Object.values(RateLimitCategory);
    }
    /**
     * Get configuration for a specific category
     * @param category Rate limit category
     * @returns Rate limit configuration
     */
    static getConfig(category) {
        return RATE_LIMIT_CONFIGS[category] || RATE_LIMIT_CONFIGS[RateLimitCategory.DEFAULT];
    }
}
exports.RateLimitService = RateLimitService;
