"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailInput = exports.validateNumericInput = exports.validateArrayInput = exports.sanitizeAllInput = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
/**
 * Middleware zur Validierung von Request-Daten mit express-validator
 * Nimmt ein Array von Validierungsregeln und gibt ein Middleware-Array zurück
 */
const validateRequest = (validations) => {
    return [
        ...validations,
        (req, res, next) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg).join(', ');
                // Log validation errors for security monitoring
                logger_1.logger.warn('Validation error', {
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    errors: errors.array()
                });
                throw new errorHandler_1.ValidationError(errorMessages);
            }
            // Sanitize and filter input data
            const sanitizedData = (0, express_validator_1.matchedData)(req);
            req.sanitizedBody = sanitizedData;
            next();
        }
    ];
};
exports.validateRequest = validateRequest;
/**
 * Middleware zur Sanitisierung von allen Eingabedaten
 * Entfernt potenziell gefährliche Zeichen und Tags
 */
const sanitizeAllInput = (req, res, next) => {
    try {
        // Sanitize query parameters
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = sanitizeString(req.query[key]);
                }
            });
        }
        // Sanitize body parameters
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = sanitizeString(req.body[key]);
                }
            });
        }
        // Sanitize URL parameters
        if (req.params) {
            Object.keys(req.params).forEach(key => {
                if (typeof req.params[key] === 'string') {
                    req.params[key] = sanitizeString(req.params[key]);
                }
            });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error sanitizing input', { error });
        next();
    }
};
exports.sanitizeAllInput = sanitizeAllInput;
/**
 * Hilfsfunktion zur Sanitisierung von Strings
 */
function sanitizeString(input) {
    if (!input)
        return input;
    // Entferne potenziell gefährliche Zeichen
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}
/**
 * Middleware zur Validierung von Array-Eingaben
 */
const validateArrayInput = (fieldName, maxLength = 100) => {
    return (req, res, next) => {
        try {
            const fieldValue = req.body[fieldName];
            if (fieldValue !== undefined) {
                if (!Array.isArray(fieldValue)) {
                    throw new errorHandler_1.ValidationError(`${fieldName} muss ein Array sein`);
                }
                if (fieldValue.length > maxLength) {
                    throw new errorHandler_1.ValidationError(`${fieldName} darf maximal ${maxLength} Elemente enthalten`);
                }
                // Validiere jedes Element im Array
                for (let i = 0; i < fieldValue.length; i++) {
                    if (typeof fieldValue[i] !== 'string') {
                        throw new errorHandler_1.ValidationError(`Element ${i + 1} in ${fieldName} muss ein String sein`);
                    }
                    if (fieldValue[i].length > 1000) {
                        throw new errorHandler_1.ValidationError(`Element ${i + 1} in ${fieldName} darf maximal 1000 Zeichen lang sein`);
                    }
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateArrayInput = validateArrayInput;
/**
 * Middleware zur Validierung von numerischen Eingaben
 */
const validateNumericInput = (fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    return (req, res, next) => {
        try {
            const fieldValue = req.body[fieldName];
            if (fieldValue !== undefined) {
                const numValue = Number(fieldValue);
                if (isNaN(numValue)) {
                    throw new errorHandler_1.ValidationError(`${fieldName} muss eine gültige Zahl sein`);
                }
                if (numValue < min || numValue > max) {
                    throw new errorHandler_1.ValidationError(`${fieldName} muss zwischen ${min} und ${max} liegen`);
                }
                req.body[fieldName] = numValue;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateNumericInput = validateNumericInput;
/**
 * Middleware zur Validierung von E-Mail-Adressen
 */
const validateEmailInput = (fieldName) => {
    return (req, res, next) => {
        try {
            const fieldValue = req.body[fieldName];
            if (fieldValue !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(fieldValue)) {
                    throw new errorHandler_1.ValidationError(`${fieldName} muss eine gültige E-Mail-Adresse sein`);
                }
                // Normalisiere die E-Mail-Adresse
                req.body[fieldName] = fieldValue.toLowerCase().trim();
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateEmailInput = validateEmailInput;
