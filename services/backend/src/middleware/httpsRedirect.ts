import { Request, Response, NextFunction } from 'express';
import { TLSSocket } from 'tls';
import { logger } from '../utils/logger';

/**
 * Middleware zum Umleiten von HTTP auf HTTPS
 * Wird nur in Produktion oder wenn TLS explizit aktiviert ist verwendet
 */
export function httpsRedirect(req: Request, res: Response, next: NextFunction): void {
  // Prüfe ob die Anfrage bereits über HTTPS kommt
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   (req.socket instanceof TLSSocket && req.socket.encrypted);

  if (!isSecure) {
    const httpsUrl = `https://${req.hostname}${req.url}`;
    logger.debug(`Redirecting HTTP request to HTTPS: ${httpsUrl}`);
    res.redirect(301, httpsUrl);
    return;
  }

  next();
}

/**
 * Middleware zum Erzwingen von HTTPS in Produktion
 * Gibt 426 Upgrade Required zurück wenn HTTP verwendet wird
 */
export function requireHTTPS(req: Request, res: Response, next: NextFunction): void {
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   (req.socket instanceof TLSSocket && req.socket.encrypted);

  if (!isSecure) {
    logger.warn(`Blocked insecure HTTP request to ${req.url}`);
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
