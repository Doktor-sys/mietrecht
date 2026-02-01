import { CorsOptions } from 'cors';
/**
 * CORS Configuration Service
 * Provides comprehensive CORS configuration for different environments and use cases
 */
export declare class CorsConfigService {
    /**
     * Get CORS configuration based on environment and security requirements
     */
    static getCorsOptions(): CorsOptions;
    /**
     * Get strict CORS configuration for high-security endpoints
     */
    static getStrictCorsOptions(): CorsOptions;
    /**
     * Get permissive CORS configuration for public APIs
     */
    static getPermissiveCorsOptions(): CorsOptions;
    /**
     * Validate CORS configuration
     */
    static validateCorsConfig(options: CorsOptions): boolean;
    /**
     * Get dynamic CORS configuration based on request path
     */
    static getDynamicCorsOptions(path: string): CorsOptions;
}
