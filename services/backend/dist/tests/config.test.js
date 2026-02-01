"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
describe('Configuration Tests', () => {
    describe('Config Loading', () => {
        it('should load default configuration values', () => {
            expect(config_1.config.port).toBe(3001);
            expect(config_1.config.nodeEnv).toBe('test');
            expect(config_1.config.jwt.expiresIn).toBe('24h');
            expect(config_1.config.security.bcryptRounds).toBe(12);
        });
        it('should have correct database configuration', () => {
            expect(config_1.config.database.url).toContain('postgresql://');
        });
        it('should have correct Redis configuration', () => {
            expect(config_1.config.redis.url).toContain('redis://');
        });
    });
    describe('Config Validation', () => {
        const originalEnv = process.env;
        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });
        afterEach(() => {
            process.env = originalEnv;
        });
        it('should validate successfully with all required env vars', () => {
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
            process.env.JWT_SECRET = 'test-secret';
            process.env.OPENAI_API_KEY = 'test-api-key';
            expect(() => (0, config_1.validateConfig)()).not.toThrow();
        });
        it('should throw error when required env vars are missing', () => {
            delete process.env.DATABASE_URL;
            delete process.env.JWT_SECRET;
            delete process.env.OPENAI_API_KEY;
            expect(() => (0, config_1.validateConfig)()).toThrow('Fehlende Umgebungsvariablen');
        });
        it('should throw error when using default JWT secret in production', () => {
            process.env.NODE_ENV = 'production';
            process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
            process.env.OPENAI_API_KEY = 'test-api-key';
            expect(() => (0, config_1.validateConfig)()).toThrow('JWT_SECRET muss in der Produktionsumgebung gesetzt werden');
        });
    });
    describe('Security Configuration', () => {
        it('should have secure default values', () => {
            expect(config_1.config.security.bcryptRounds).toBeGreaterThanOrEqual(12);
            expect(config_1.config.security.passwordMinLength).toBeGreaterThanOrEqual(8);
        });
        it('should have reasonable rate limiting defaults', () => {
            expect(config_1.config.rateLimit.windowMs).toBe(900000); // 15 Minuten
            expect(config_1.config.rateLimit.max).toBe(100);
            expect(config_1.config.rateLimit.authMax).toBe(5);
        });
    });
    describe('File Upload Configuration', () => {
        it('should have reasonable file size limits', () => {
            expect(config_1.config.upload.maxFileSize).toBe(10485760); // 10MB
            expect(config_1.config.upload.allowedMimeTypes).toContain('application/pdf');
            expect(config_1.config.upload.allowedMimeTypes).toContain('image/jpeg');
        });
    });
});
