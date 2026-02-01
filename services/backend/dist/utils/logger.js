"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.loggers = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config/config");
// Custom Log Format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
// Console Format für Development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss',
}), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
// Logger Configuration
exports.logger = winston_1.default.createLogger({
    level: config_1.config.nodeEnv === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: {
        service: 'smartlaw-backend',
        environment: config_1.config.nodeEnv,
    },
    transports: [
        // Console Transport
        new winston_1.default.transports.Console({
            format: config_1.config.nodeEnv === 'production' ? logFormat : consoleFormat,
        }),
        // File Transports für Production
        ...(config_1.config.nodeEnv === 'production' ? [
            new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }),
            new winston_1.default.transports.File({
                filename: 'logs/combined.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }),
        ] : []),
    ],
    // Exception Handling
    exceptionHandlers: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        ...(config_1.config.nodeEnv === 'production' ? [
            new winston_1.default.transports.File({
                filename: 'logs/exceptions.log',
            }),
        ] : []),
    ],
    // Rejection Handling
    rejectionHandlers: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        ...(config_1.config.nodeEnv === 'production' ? [
            new winston_1.default.transports.File({
                filename: 'logs/rejections.log',
            }),
        ] : []),
    ],
});
// Utility Functions für strukturiertes Logging
exports.loggers = {
    // HTTP Request Logging
    httpRequest: (req, res, responseTime) => {
        exports.logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id,
        });
    },
    // Database Operation Logging
    dbOperation: (operation, table, duration, success) => {
        exports.logger.debug('Database Operation', {
            operation,
            table,
            duration: `${duration}ms`,
            success,
        });
    },
    // AI Operation Logging
    aiOperation: (operation, model, tokens, confidence) => {
        exports.logger.info('AI Operation', {
            operation,
            model,
            tokens,
            confidence,
        });
    },
    // Security Event Logging
    securityEvent: (event, userId, ip, details) => {
        exports.logger.warn('Security Event', {
            event,
            userId,
            ip,
            details,
            timestamp: new Date().toISOString(),
        });
    },
    // Business Logic Logging
    businessEvent: (event, userId, details) => {
        exports.logger.info('Business Event', {
            event,
            userId,
            details,
        });
    },
};
// Error Logging Helper
const logError = (error, context) => {
    exports.logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        context,
    });
};
exports.logError = logError;
