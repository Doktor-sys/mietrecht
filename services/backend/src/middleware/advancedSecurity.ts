import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Interface für Sicherheitsmetriken
interface SecurityMetrics {
  requestCount: number;
  blockedRequests: number;
  suspiciousActivities: number;
  lastReset: Date;
}

// Sicherheitsmetriken pro IP
const securityMetrics: Record<string, SecurityMetrics> = {};

// Konfiguration
const SECURITY_CONFIG = {
  maxRequestsPerMinute: 100,
  maxFailedLoginsPerHour: 5,
  maxDataExportsPerHour: 3,
  suspiciousUserAgentPatterns: [
    /sqlmap/,
    /nikto/,
    /nessus/,
    /burp/,
    /zaproxy/
  ],
  blockedUserAgents: [
    'masscan',
    'nmap scripting engine'
  ]
};

// Bereinige alte Metriken
setInterval(() => {
  const now = Date.now();
  for (const ip in securityMetrics) {
    // Lösche Metriken älter als 1 Stunde
    if (now - securityMetrics[ip].lastReset.getTime() > 60 * 60 * 1000) {
      delete securityMetrics[ip];
    }
  }
}, 5 * 60 * 1000); // Alle 5 Minuten

// Initialisiere Metriken für eine IP
function initMetrics(ip: string): SecurityMetrics {
  const metrics: SecurityMetrics = {
    requestCount: 0,
    blockedRequests: 0,
    suspiciousActivities: 0,
    lastReset: new Date()
  };
  securityMetrics[ip] = metrics;
  return metrics;
}

// Rate Limiting Middleware
export function advancedRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || '';
  if (!ip) {
    return next();
  }

  // Initialisiere oder aktualisiere Metriken
  let metrics = securityMetrics[ip];
  if (!metrics) {
    metrics = initMetrics(ip);
  }

  // Setze Zähler alle Minute zurück
  const now = Date.now();
  if (now - metrics.lastReset.getTime() > 60 * 1000) {
    metrics.requestCount = 0;
    metrics.lastReset = new Date();
  }

  // Erhöhe Request-Zähler
  metrics.requestCount++;

  // Prüfe Rate Limit
  if (metrics.requestCount > SECURITY_CONFIG.maxRequestsPerMinute) {
    metrics.blockedRequests++;
    logger.warn(`Rate limit exceeded for IP: ${ip}`, {
      requestCount: metrics.requestCount,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
      }
    });
  }

  next();
}

// Suspicious User Agent Detection
export function detectSuspiciousUserAgents(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  // Prüfe auf bekannte böswillige User-Agents
  for (const pattern of SECURITY_CONFIG.suspiciousUserAgentPatterns) {
    if (pattern.test(userAgent)) {
      logger.warn(`Suspicious user agent detected: ${userAgent}`, {
        ip,
        url: req.url
      });
      
      // Aktualisiere Metriken
      if (ip) {
        const metrics = securityMetrics[ip] || initMetrics(ip);
        metrics.suspiciousActivities++;
      }
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUSPICIOUS_USER_AGENT',
          message: 'Verdächtiger User-Agent erkannt'
        }
      });
    }
  }
  
  // Prüfe auf blockierte User-Agents
  for (const blockedAgent of SECURITY_CONFIG.blockedUserAgents) {
    if (userAgent.toLowerCase().includes(blockedAgent)) {
      logger.warn(`Blocked user agent detected: ${userAgent}`, {
        ip,
        url: req.url
      });
      
      // Blockiere sofort
      return res.status(403).json({
        success: false,
        error: {
          code: 'BLOCKED_USER_AGENT',
          message: 'User-Agent nicht erlaubt'
        }
      });
    }
  }
  
  next();
}

// IP Reputation Check (vereinfacht)
export function checkIPReputation(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || '';
  if (!ip) {
    return next();
  }
  
  const metrics = securityMetrics[ip] || initMetrics(ip);
  
  // Prüfe auf wiederholte verdächtige Aktivitäten
  if (metrics.suspiciousActivities > 3) {
    logger.warn(`IP with bad reputation blocked: ${ip}`, {
      suspiciousActivities: metrics.suspiciousActivities
    });
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'BAD_REPUTATION',
        message: 'IP-Adresse hat schlechte Reputation'
      }
    });
  }
  
  // Prüfe auf zu viele blockierte Anfragen
  if (metrics.blockedRequests > 10) {
    logger.warn(`IP with excessive blocked requests: ${ip}`, {
      blockedRequests: metrics.blockedRequests
    });
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'EXCESSIVE_BLOCKED_REQUESTS',
        message: 'Zu viele blockierte Anfragen von dieser IP'
      }
    });
  }
  
  next();
}

// Content Security Middleware
export function contentSecurity(req: Request, res: Response, next: NextFunction) {
  const contentType = req.get('Content-Type') || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  // Prüfe Content-Type für sensible Endpunkte
  if (req.path.startsWith('/api/kms') || req.path.startsWith('/api/admin')) {
    if (!contentType.includes('application/json')) {
      logger.warn('Invalid content type for sensitive endpoint', {
        ip,
        path: req.path,
        contentType
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Ungültiger Content-Type für diesen Endpunkt'
        }
      });
    }
  }
  
  // Prüfe auf potenziell gefährliche Payloads
  if (req.body) {
    const bodyString = JSON.stringify(req.body);
    
    // SQL Injection Muster
    const sqlPatterns = [
      /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/i,
      /['";]?\s*(OR|AND)\s*['"]?\d+\s*=\s*\d+/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(bodyString)) {
        logger.warn('Potential SQL injection detected', {
          ip,
          path: req.path,
          payload: bodyString.substring(0, 100) // Nur ersten 100 Zeichen
        });
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'POTENTIAL_SQL_INJECTION',
            message: 'Potenzieller SQL-Injection-Angriff erkannt'
          }
        });
      }
    }
  }
  
  next();
}

// Exportiere alle Middlewares
export const advancedSecurity = {
  rateLimit: advancedRateLimit,
  userAgentDetection: detectSuspiciousUserAgents,
  ipReputation: checkIPReputation,
  contentSecurity: contentSecurity
};