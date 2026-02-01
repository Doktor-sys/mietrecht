import { Request, Response, NextFunction } from 'express';
/**
 * Middleware zum Umleiten von HTTP auf HTTPS
 * Wird nur in Produktion oder wenn TLS explizit aktiviert ist verwendet
 */
export declare function httpsRedirect(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware zum Erzwingen von HTTPS in Produktion
 * Gibt 426 Upgrade Required zurück wenn HTTP verwendet wird
 */
export declare function requireHTTPS(req: Request, res: Response, next: NextFunction): void;
