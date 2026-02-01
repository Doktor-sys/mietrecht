import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { PERFORMANCE_CONFIG } from '../config/performance.config';
import { PerformanceMonitor } from '../services/PerformanceMonitor';

const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Rate Limiting Middleware
 * Begrenzt die Anzahl der Anfragen pro IP-Adresse
 */
export const rateLimiter = rateLimit({
  windowMs: PERFORMANCE_CONFIG.RATE_LIMITING.WINDOW_MS,
  max: PERFORMANCE_CONFIG.RATE_LIMITING.MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
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
export const performanceMonitoringMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = performanceMonitor.startOperation(`request_${req.method}_${req.path}`);
  
  // Speichere die ursprüngliche send-Methode
  const originalSend = res.send;
  
  // Überschreibe die send-Methode, um die Zeit zu messen
  res.send = function(body: any) {
    performanceMonitor.endOperation(
      `request_${req.method}_${req.path}`,
      startTime,
      {
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
    // Rufe die ursprüngliche send-Methode auf
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Cache Control Middleware
 * Setzt Cache-Control-Header für statische Inhalte
 */
export const cacheControlMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Setze Cache-Control-Header für statische Assets
  if (
    req.url.includes('/static/') ||
    req.url.includes('/assets/') ||
    req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg)$/)
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Timeout Middleware
 * Setzt ein Timeout für Requests
 */
export const timeoutMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Setze ein Timeout für den Request
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn(`Request timeout: ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      
      res.status(408).json({
        error: 'Request Timeout',
        message: 'The request took too long to process'
      });
    }
  }, PERFORMANCE_CONFIG.TIMEOUTS.API_CALL);
  
  // Lösche das Timeout, wenn der Request beendet wird
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
};

/**
 * Memory Optimization Middleware
 * Überwacht den Speicherverbrauch und triggert GC wenn nötig
 */
export const memoryOptimizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (PERFORMANCE_CONFIG.MEMORY_OPTIMIZATION.ENABLED) {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round((used.heapUsed / 1024 / 1024) * 100) / 100;
    
    // Logge Speicherverbrauch bei hoher Nutzung
    if (heapUsedMB > 500) {
      logger.warn(`High memory usage detected: ${heapUsedMB} MB`, {
        memoryUsage: used
      });
    }
  }
  
  next();
};

/**
 * Request Size Limit Middleware
 * Begrenzt die Größe von eingehenden Requests
 */
export const requestSizeLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Setze Limits für JSON und URL-encoded Bodies
  if (req.is('application/json')) {
    req.headers['content-length'] = req.headers['content-length'] || '0';
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength > 10 * 1024 * 1024) { // 10MB Limit
      logger.warn(`Large JSON request detected: ${contentLength} bytes`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
    }
  }
  
  next();
};