"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpsRedirect = httpsRedirect;
exports.requireHTTPS = requireHTTPS;
const tls_1 = require("tls");
const logger_1 = require("../utils/logger");
/**
 * Middleware zum Umleiten von HTTP auf HTTPS
 * Wird nur in Produktion oder wenn TLS explizit aktiviert ist verwendet
 */
function httpsRedirect(req, res, next) {
    // Prüfe ob die Anfrage bereits über HTTPS kommt
    const isSecure = req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        (req.socket instanceof tls_1.TLSSocket && req.socket.encrypted);
    if (!isSecure) {
        const httpsUrl = `https://${req.hostname}${req.url}`;
        logger_1.logger.debug(`Redirecting HTTP request to HTTPS: ${httpsUrl}`);
        res.redirect(301, httpsUrl);
        return;
    }
    next();
}
/**
 * Middleware zum Erzwingen von HTTPS in Produktion
 * Gibt 426 Upgrade Required zurück wenn HTTP verwendet wird
 */
function requireHTTPS(req, res, next) {
    const isSecure = req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        (req.socket instanceof tls_1.TLSSocket && req.socket.encrypted);
    if (!isSecure) {
        logger_1.logger.warn(`Blocked insecure HTTP request to ${req.url}`);
        res.status(426).json({
            success: false,
            error: {
                code: 'UPGRADE_REQUIRED',
                message: 'Diese API erfordert eine sichere HTTPS-Verbindung',
                upgradeUrl: `https://${req.hostname}${req.url}`
            }
        });
        return;
    }
    next();
}
