import { Request, Response, NextFunction } from 'express';
/**
 * Rate Limiting Middleware
 * Begrenzt die Anzahl der Anfragen pro IP-Adresse
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Performance Monitoring Middleware
 * Misst die Ausführungszeit von Requests
 */
export declare const performanceMonitoringMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cache Control Middleware
 * Setzt Cache-Control-Header für statische Inhalte
 */
export declare const cacheControlMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Timeout Middleware
 * Setzt ein Timeout für Requests
 */
export declare const timeoutMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Memory Optimization Middleware
 * Überwacht den Speicherverbrauch und triggert GC wenn nötig
 */
export declare const memoryOptimizationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request Size Limit Middleware
 * Begrenzt die Größe von eingehenden Requests
 */
export declare const requestSizeLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
