"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestSizeLimitMiddleware = exports.memoryOptimizationMiddleware = exports.timeoutMiddleware = exports.cacheControlMiddleware = exports.performanceMonitoringMiddleware = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
const performance_config_1 = require("../config/performance.config");
const PerformanceMonitor_1 = require("../services/PerformanceMonitor");
const performanceMonitor = PerformanceMonitor_1.PerformanceMonitor.getInstance();
/**
 * Rate Limiting Middleware
 * Begrenzt die Anzahl der Anfragen pro IP-Adresse
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: performance_config_1.PERFORMANCE_CONFIG.RATE_LIMITING.WINDOW_MS,
    max: performance_config_1.PERFORMANCE_CONFIG.RATE_LIMITING.MAX_REQUESTS,
    message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
            ip: req.ip,
            url: req.url,
            method: req.method
        });
        res.status(options.statusCode).send(options.message);
    }
});
/**
 * Performance Monitoring Middleware
 * Misst die Ausführungszeit von Requests
 */
const performanceMonitoringMiddleware = (req, res, next) => {
    const startTime = performanceMonitor.startOperation(`request_${req.method}_${req.path}`);
    // Speichere die ursprüngliche send-Methode
    const originalSend = res.send;
    // Überschreibe die send-Methode, um die Zeit zu messen
    res.send = function (body) {
        performanceMonitor.endOperation(`request_${req.method}_${req.path}`, startTime, {
            statusCode: res.statusCode,
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        // Rufe die ursprüngliche send-Methode auf
        return originalSend.call(this, body);
    };
    next();
};
exports.performanceMonitoringMiddleware = performanceMonitoringMiddleware;
/**
 * Cache Control Middleware
 * Setzt Cache-Control-Header für statische Inhalte
 */
const cacheControlMiddleware = (req, res, next) => {
    // Setze Cache-Control-Header für statische Assets
    if (req.url.includes('/static/') ||
        req.url.includes('/assets/') ||
        req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr
    }
    else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
};
exports.cacheControlMiddleware = cacheControlMiddleware;
/**
 * Timeout Middleware
 * Setzt ein Timeout für Requests
 */
const timeoutMiddleware = (req, res, next) => {
    // Setze ein Timeout für den Request
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            logger_1.logger.warn(`Request timeout: ${req.method} ${req.url}`, {
                method: req.method,
                url: req.url,
                ip: req.ip
            });
            res.status(408).json({
                error: 'Request Timeout',
                message: 'The request took too long to process'
            });
        }
    }, performance_config_1.PERFORMANCE_CONFIG.TIMEOUTS.API_CALL);
    // Lösche das Timeout, wenn der Request beendet wird
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
};
exports.timeoutMiddleware = timeoutMiddleware;
/**
 * Memory Optimization Middleware
 * Überwacht den Speicherverbrauch und triggert GC wenn nötig
 */
const memoryOptimizationMiddleware = (req, res, next) => {
    if (performance_config_1.PERFORMANCE_CONFIG.MEMORY_OPTIMIZATION.ENABLED) {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round((used.heapUsed / 1024 / 1024) * 100) / 100;
        // Logge Speicherverbrauch bei hoher Nutzung
        if (heapUsedMB > 500) {
            logger_1.logger.warn(`High memory usage detected: ${heapUsedMB} MB`, {
                memoryUsage: used
            });
        }
    }
    next();
};
exports.memoryOptimizationMiddleware = memoryOptimizationMiddleware;
/**
 * Request Size Limit Middleware
 * Begrenzt die Größe von eingehenden Requests
 */
const requestSizeLimitMiddleware = (req, res, next) => {
    // Setze Limits für JSON und URL-encoded Bodies
    if (req.is('application/json')) {
        req.headers['content-length'] = req.headers['content-length'] || '0';
        const contentLength = parseInt(req.headers['content-length']);
        if (contentLength > 10 * 1024 * 1024) { // 10MB Limit
            logger_1.logger.warn(`Large JSON request detected: ${contentLength} bytes`, {
                method: req.method,
                url: req.url,
                ip: req.ip
            });
        }
    }
    next();
};
exports.requestSizeLimitMiddleware = requestSizeLimitMiddleware;
