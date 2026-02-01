"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.CustomError = void 0;
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class CustomError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// Spezifische Error-Klassen
class ValidationError extends CustomError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends CustomError {
    constructor(message = 'Authentifizierung fehlgeschlagen') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends CustomError {
    constructor(message = 'Nicht autorisiert') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends CustomError {
    constructor(message = 'Ressource nicht gefunden') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message = 'Konflikt mit vorhandenen Daten') {
        super(message, 409, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends CustomError {
    constructor(message = 'Zu viele Anfragen') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
// Hauptfehlerbehandler
const errorHandler = (error, req, res, next) => {
    // Log den Fehler
    (0, logger_1.logError)(error, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
    });
    // Bestimme Status Code und Error Code
    let statusCode = error.statusCode || 500;
    let errorCode = error.code || 'INTERNAL_ERROR';
    let message = error.message || 'Ein unerwarteter Fehler ist aufgetreten';
    // Behandle spezifische Fehlertypen
    if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Ungültiger Token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token ist abgelaufen';
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        errorCode = 'FILE_UPLOAD_ERROR';
        message = 'Fehler beim Datei-Upload';
    }
    // Prisma Database Errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        if (prismaError.code === 'P2002') {
            statusCode = 409;
            errorCode = 'DUPLICATE_ENTRY';
            message = 'Eintrag existiert bereits';
        }
        else if (prismaError.code === 'P2025') {
            statusCode = 404;
            errorCode = 'NOT_FOUND';
            message = 'Datensatz nicht gefunden';
        }
    }
    // Response-Objekt erstellen
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            message: message,
            timestamp: new Date().toISOString(),
        },
    };
    // In Development-Modus zusätzliche Details hinzufügen
    if (config_1.config.nodeEnv === 'development') {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = {
            name: error.name,
            originalMessage: error.message,
        };
    }
    // Security Event loggen für bestimmte Fehler
    if (statusCode === 401 || statusCode === 403) {
        logger_1.logger.warn('Security Event', {
            event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            ip: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent'),
            error: errorCode,
        });
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async Error Handler Wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 Handler für unbekannte Routen
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} nicht gefunden`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString(),
    });
    // In Production: Graceful Shutdown
    if (config_1.config.nodeEnv === 'production') {
        process.exit(1);
    }
});
// Uncaught Exception Handler
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
    });
    // Immer beenden bei uncaught exceptions
    process.exit(1);
});
