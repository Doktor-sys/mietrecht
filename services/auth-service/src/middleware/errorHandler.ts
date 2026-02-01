import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Fehlerklassen
export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// Fehlerbehandlungs-Middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Standardwerte
  let statusCode = 500;
  let message = 'Interner Serverfehler';
  
  // Loggen des Fehlers
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id
  });
  
  // Fehlerklassen überprüfen
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }
  
  // Antwort senden
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// 404-Handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} nicht gefunden`);
  next(error);
};