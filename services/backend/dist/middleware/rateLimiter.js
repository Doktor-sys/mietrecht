"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRateLimits = exports.resetRateLimit = exports.getRateLimitInfo = exports.roleBasedRateLimiter = exports.rateLimiter = exports.RATE_LIMIT_CONFIGS = void 0;
const logger_1 = require("../utils/logger");
// Speicher für Rate-Limit-Zähler (in Produktion würde man Redis verwenden)
const rateLimitStore = new Map();
// Standard-Rate-Limit-Konfigurationen
exports.RATE_LIMIT_CONFIGS = {
    // Allgemeine API-Rate-Limits
    API_DEFAULT: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 Anfragen pro 15 Minuten
    API_STRICT: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 Anfragen pro 15 Minuten
    // Authentifizierungs-Rate-Limits
    AUTH_LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 Login-Versuche pro 15 Minuten
    AUTH_REGISTER: { windowMs: 15 * 60 * 1000, max: 3 }, // 3 Registrierungen pro 15 Minuten
    // KI/ML-spezifische Rate-Limits
    ML_DOCUMENT_ANALYSIS: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 Analysen pro Stunde
    ML_RISK_ASSESSMENT: { windowMs: 60 * 60 * 1000, max: 15 }, // 15 Bewertungen pro Stunde
    ML_RECOMMENDATIONS: { windowMs: 60 * 60 * 1000, max: 25 }, // 25 Empfehlungen pro Stunde
    ML_NLP_PROCESSING: { windowMs: 60 * 60 * 1000, max: 30 }, // 30 NLP-Prozesse pro Stunde
    // Hochfrequente Endpunkte
    CHAT_MESSAGES: { windowMs: 60 * 1000, max: 30 }, // 30 Nachrichten pro Minute
    DOCUMENT_UPLOAD: { windowMs: 60 * 1000, max: 10 }, // 10 Uploads pro Minute
};
// Rate-Limiter-Middleware
const rateLimiter = (config) => {
    return (req, res, next) => {
        // Generiere einen eindeutigen Schlüssel basierend auf IP und ggf. Benutzer-ID
        const clientId = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
        const key = `${clientId}:${req.path}`;
        const now = Date.now();
        const windowMs = config.windowMs;
        // Hole oder initialisiere den Zähler
        let counter = rateLimitStore.get(key);
        // Prüfe ob das Zeitfenster abgelaufen ist
        if (!counter || counter.resetTime <= now) {
            // Initialisiere einen neuen Zähler
            counter = {
                count: 0,
                resetTime: now + windowMs
            };
            rateLimitStore.set(key, counter);
        }
        // Erhöhe den Zähler
        counter.count++;
        rateLimitStore.set(key, counter);
        // Prüfe ob das Limit überschritten wurde
        if (counter.count > config.max) {
            // Berechne die verbleibende Zeit bis zum Reset
            const retryAfter = Math.ceil((counter.resetTime - now) / 1000);
            logger_1.logger.warn('Rate limit exceeded', {
                clientId,
                path: req.path,
                count: counter.count,
                limit: config.max,
                retryAfter
            });
            // Sende eine 429 (Too Many Requests) Antwort
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: config.message || 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
                    retryAfter
                }
            });
        }
        // Füge Rate-Limit-Header zur Antwort hinzu
        const remaining = Math.max(0, config.max - counter.count);
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', new Date(counter.resetTime).toISOString());
        // Wenn konfiguriert, verringere den Zähler bei erfolgreichen Anfragen
        if (config.skipSuccessfulRequests) {
            res.on('finish', () => {
                if (res.statusCode < 400) {
                    // Erfolgreiche Anfrage - Zähler verringern
                    const currentCounter = rateLimitStore.get(key);
                    if (currentCounter && currentCounter.count > 0) {
                        currentCounter.count--;
                        rateLimitStore.set(key, currentCounter);
                    }
                }
            });
        }
        // Wenn konfiguriert, verringere den Zähler bei fehlgeschlagenen Anfragen
        if (config.skipFailedRequests) {
            res.on('finish', () => {
                if (res.statusCode >= 400) {
                    // Fehlgeschlagene Anfrage - Zähler verringern
                    const currentCounter = rateLimitStore.get(key);
                    if (currentCounter && currentCounter.count > 0) {
                        currentCounter.count--;
                        rateLimitStore.set(key, currentCounter);
                    }
                }
            });
        }
        // Fahre mit der nächsten Middleware fort
        next();
    };
};
exports.rateLimiter = rateLimiter;
// Middleware für benutzerdefinierte Rate-Limits basierend auf Benutzerrollen
const roleBasedRateLimiter = (roleLimits) => {
    return (req, res, next) => {
        // Bestimme die Rolle des Benutzers
        const userRole = req.user?.role || 'anonymous';
        // Verwende das spezifische Limit für die Rolle oder ein Standardlimit
        const config = roleLimits[userRole] || roleLimits['default'] || exports.RATE_LIMIT_CONFIGS.API_DEFAULT;
        // Wende den Rate-Limiter mit der spezifischen Konfiguration an
        return (0, exports.rateLimiter)(config)(req, res, next);
    };
};
exports.roleBasedRateLimiter = roleBasedRateLimiter;
// Middleware zum Abrufen von Rate-Limit-Informationen
const getRateLimitInfo = (req, res, next) => {
    const clientId = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    const key = `${clientId}:${req.path}`;
    const counter = rateLimitStore.get(key);
    if (counter) {
        const config = exports.RATE_LIMIT_CONFIGS.API_DEFAULT; // Standardkonfiguration
        const remaining = Math.max(0, config.max - counter.count);
        const info = {
            limit: config.max,
            current: counter.count,
            remaining,
            resetTime: new Date(counter.resetTime)
        };
        req.rateLimitInfo = info;
    }
    next();
};
exports.getRateLimitInfo = getRateLimitInfo;
// Funktion zum manuellen Zurücksetzen von Rate-Limits (für Admin-Zwecke)
const resetRateLimit = (clientId, path) => {
    const key = `${clientId}:${path}`;
    rateLimitStore.delete(key);
    logger_1.logger.info('Rate limit reset', { clientId, path });
};
exports.resetRateLimit = resetRateLimit;
// Funktion zum Abrufen aller aktiven Rate-Limits (für Monitoring)
const getAllRateLimits = () => {
    const limits = {};
    for (const [key, value] of rateLimitStore.entries()) {
        // Nur aktive Limits (nicht abgelaufene)
        if (value.resetTime > Date.now()) {
            limits[key] = value;
        }
    }
    return limits;
};
exports.getAllRateLimits = getAllRateLimits;
// Bereinige abgelaufene Einträge regelmäßig
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime <= now) {
            rateLimitStore.delete(key);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        logger_1.logger.debug('Rate limit store cleaned', { cleanedEntries: cleanedCount });
    }
}, 60 * 1000); // Alle Minute bereinigen
exports.default = exports.rateLimiter;
