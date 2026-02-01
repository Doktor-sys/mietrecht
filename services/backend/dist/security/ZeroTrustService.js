"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeroTrustService = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
class ZeroTrustService {
    constructor() {
        this.trustedDevices = new Map();
        this.riskAssessmentRules = [
            { factor: 'user_behavior', weight: 0.5 },
            { factor: 'time_based', weight: 0.5 }
        ];
    }
    static getInstance() {
        if (!ZeroTrustService.instance) {
            ZeroTrustService.instance = new ZeroTrustService();
        }
        return ZeroTrustService.instance;
    }
    /**
     * Bewertet das Risiko eines Zugriffsversuchs
     */
    async assessRisk(context) {
        let riskScore = 0;
        // Verhaltensanalyse
        const behaviorRisk = await this.analyzeUserBehavior(context.userId, context);
        riskScore += behaviorRisk * this.riskAssessmentRules[0].weight;
        // Zeitbasierte Risikoprüfung
        const timeRisk = this.assessTimeBasedRisk();
        riskScore += timeRisk * this.riskAssessmentRules[1].weight;
        // Normalisierung auf 0-100
        riskScore = Math.min(Math.max(riskScore, 0), 100);
        logger_1.logger.info(`Risk assessment for user ${context.userId}: ${riskScore}`);
        return riskScore;
    }
    /**
     * Analysiert das Nutzerverhalten
     */
    async analyzeUserBehavior(userId, context) {
        try {
            // Hole Benutzerinformationen
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return 90; // Hohes Risiko bei unbekanntem Benutzer
            }
            // Prüfung auf ungewöhnliche Muster
            let anomalyScore = 0;
            // Ungewöhnliche Uhrzeit?
            const hour = new Date().getHours();
            if (hour >= 2 && hour <= 5) {
                anomalyScore += 20;
            }
            return Math.min(anomalyScore, 100);
        }
        catch (error) {
            logger_1.logger.error('Error analyzing user behavior:', error);
            return 50; // Mittleres Risiko bei Fehler
        }
    }
    /**
     * Zeitbasierte Risikobewertung
     */
    assessTimeBasedRisk() {
        const hour = new Date().getHours();
        // Nachtstunden (2-5 Uhr) haben höheres Risiko
        if (hour >= 2 && hour <= 5) {
            return 40;
        }
        // Frühe Morgenstunden (6-8 Uhr) normales Risiko
        if (hour >= 6 && hour <= 8) {
            return 20;
        }
        // Geschäftstage (9-17 Uhr) niedriges Risiko
        if (hour >= 9 && hour <= 17) {
            return 10;
        }
        // Abendstunden (18-24 Uhr) mittleres Risiko
        return 25;
    }
    /**
     * Middleware für Zero Trust Authentifizierung
     */
    zeroTrustMiddleware() {
        return async (req, res, next) => {
            try {
                // Extrahiere Token
                const token = req.headers.authorization?.split(' ')[1];
                if (!token) {
                    return res.status(401).json({
                        error: 'Unauthorized',
                        message: 'No authentication token provided'
                    });
                }
                // Verifiziere Token
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
                // Erstelle Zero Trust Context
                const context = {
                    userId: decoded.userId,
                    ipAddress: req.ip || req.connection.remoteAddress || '',
                    userAgent: req.get('User-Agent') || '',
                    deviceId: req.headers['x-device-id'],
                    location: req.headers['x-location'],
                    riskScore: 0,
                    permissions: decoded.permissions || []
                };
                // Bewertet Risiko
                const riskScore = await this.assessRisk(context);
                context.riskScore = riskScore;
                // Blockiere bei hohem Risiko
                if (riskScore > 80) {
                    logger_1.logger.warn(`High risk access blocked for user ${decoded.userId}`, { riskScore });
                    return res.status(403).json({
                        error: 'Access Denied',
                        message: 'Access blocked due to high risk score'
                    });
                }
                // Warnung bei mittlerem Risiko
                if (riskScore > 50) {
                    logger_1.logger.warn(`Medium risk access for user ${decoded.userId}`, { riskScore });
                }
                // Füge Zero Trust Context zum Request hinzu
                req.zeroTrustContext = context;
                next();
            }
            catch (error) {
                logger_1.logger.error('Zero Trust authentication error:', error);
                return res.status(401).json({
                    error: 'Authentication Failed',
                    message: 'Invalid or expired token'
                });
            }
        };
    }
}
exports.ZeroTrustService = ZeroTrustService;
