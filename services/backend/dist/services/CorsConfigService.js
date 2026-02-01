"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsConfigService = void 0;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
/**
 * CORS Configuration Service
 * Provides comprehensive CORS configuration for different environments and use cases
 */
class CorsConfigService {
    /**
     * Get CORS configuration based on environment and security requirements
     */
    static getCorsOptions() {
        const isProduction = config_1.config.nodeEnv === 'production';
        // Define allowed origins based on environment
        let allowedOrigins = [];
        if (isProduction) {
            // In production, use configured allowed origins
            allowedOrigins = config_1.config.cors.allowedOrigins.map(origin => {
                // Convert wildcard patterns to regex if needed
                if (origin.includes('*')) {
                    return new RegExp(origin.replace(/\./g, '\\.').replace(/\*/g, '.*'));
                }
                return origin;
            });
        }
        else {
            // In development, allow common development origins
            allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:19006',
                'http://localhost:19007',
                'http://localhost:19008',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:19006',
                'http://192.168.1.100:3000', // Common local network IP
                'http://192.168.0.100:3000', // Alternative local network IP
                ...config_1.config.cors.allowedOrigins
            ];
        }
        // Log CORS configuration for security monitoring
        logger_1.logger.info('CORS Configuration Loaded', {
            environment: config_1.config.nodeEnv,
            allowedOrigins: allowedOrigins.map(origin => typeof origin === 'string' ? origin : origin.toString()),
            isProduction
        });
        return {
            // Allowed origins
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin)
                    return callback(null, true);
                // Check if origin is in allowed list
                const isAllowed = allowedOrigins.some(allowedOrigin => {
                    if (typeof allowedOrigin === 'string') {
                        return origin === allowedOrigin;
                    }
                    else {
                        // It's a RegExp
                        return allowedOrigin.test(origin);
                    }
                });
                if (isAllowed) {
                    callback(null, true);
                }
                else {
                    logger_1.logger.warn('CORS blocked request from origin', { origin });
                    callback(new Error('Not allowed by CORS'));
                }
            },
            // Credentials
            credentials: true,
            // Allowed methods
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
            // Allowed headers
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'X-HTTP-Method-Override',
                'X-CSRF-Token',
                'X-API-Key'
            ],
            // Exposed headers
            exposedHeaders: [
                'X-Request-ID',
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset'
            ],
            // Preflight cache duration
            maxAge: 86400, // 24 hours
            // Preflight OPTIONS request handling
            preflightContinue: false,
            // Handle OPTIONS requests automatically
            optionsSuccessStatus: 204
        };
    }
    /**
     * Get strict CORS configuration for high-security endpoints
     */
    static getStrictCorsOptions() {
        const baseOptions = this.getCorsOptions();
        return {
            ...baseOptions,
            // Even stricter header restrictions
            allowedHeaders: [
                'Content-Type',
                'Authorization'
            ],
            // No exposed headers for strict endpoints
            exposedHeaders: [],
            // Shorter preflight cache for strict endpoints
            maxAge: 3600 // 1 hour
        };
    }
    /**
     * Get permissive CORS configuration for public APIs
     */
    static getPermissiveCorsOptions() {
        const baseOptions = this.getCorsOptions();
        return {
            ...baseOptions,
            // Allow all origins for public APIs
            origin: '*',
            // Don't allow credentials with wildcard origin
            credentials: false
        };
    }
    /**
     * Validate CORS configuration
     */
    static validateCorsConfig(options) {
        try {
            // Check that allowedHeaders contains required headers
            const requiredHeaders = ['Content-Type', 'Authorization'];
            const hasRequiredHeaders = requiredHeaders.every(header => options.allowedHeaders?.includes(header));
            if (!hasRequiredHeaders) {
                logger_1.logger.error('CORS configuration missing required headers');
                return false;
            }
            // Check that methods include basic HTTP verbs
            const requiredMethods = ['GET', 'POST'];
            const hasRequiredMethods = requiredMethods.every(method => options.methods?.includes(method));
            if (!hasRequiredMethods) {
                logger_1.logger.error('CORS configuration missing required methods');
                return false;
            }
            logger_1.logger.info('CORS configuration validated successfully');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error validating CORS configuration', { error });
            return false;
        }
    }
    /**
     * Get dynamic CORS configuration based on request path
     */
    static getDynamicCorsOptions(path) {
        // Strict CORS for authentication endpoints
        if (path.startsWith('/api/auth/') || path.startsWith('/api/admin/')) {
            return this.getStrictCorsOptions();
        }
        // Permissive CORS for public APIs
        if (path.startsWith('/api/public/')) {
            return this.getPermissiveCorsOptions();
        }
        // Default CORS for other endpoints
        return this.getCorsOptions();
    }
}
exports.CorsConfigService = CorsConfigService;
