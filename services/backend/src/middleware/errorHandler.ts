import { Request, Response, NextFunction } from 'express'
import { logger, logError } from '../utils/logger'
import { config } from '../config/config'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  statusCode: number
  code: string
  isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// Spezifische Error-Klassen
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentifizierung fehlgeschlagen') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Nicht autorisiert') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Ressource nicht gefunden') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Konflikt mit vorhandenen Daten') {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Zu viele Anfragen') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

// Hauptfehlerbehandler
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log den Fehler
  logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  })

  // Bestimme Status Code und Error Code
  let statusCode = error.statusCode || 500
  let errorCode = error.code || 'INTERNAL_ERROR'
  let message = error.message || 'Ein unerwarteter Fehler ist aufgetreten'

  // Behandle spezifische Fehlertypen
  if (error.name === 'ValidationError') {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    errorCode = 'INVALID_TOKEN'
    message = 'Ungültiger Token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    errorCode = 'TOKEN_EXPIRED'
    message = 'Token ist abgelaufen'
  } else if (error.name === 'MulterError') {
    statusCode = 400
    errorCode = 'FILE_UPLOAD_ERROR'
    message = 'Fehler beim Datei-Upload'
  }

  // Prisma Database Errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any
    if (prismaError.code === 'P2002') {
      statusCode = 409
      errorCode = 'DUPLICATE_ENTRY'
      message = 'Eintrag existiert bereits'
    } else if (prismaError.code === 'P2025') {
      statusCode = 404
      errorCode = 'NOT_FOUND'
      message = 'Datensatz nicht gefunden'
    }
  }

  // Response-Objekt erstellen
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
    },
  }

  // In Development-Modus zusätzliche Details hinzufügen
  if (config.nodeEnv === 'development') {
    errorResponse.error.stack = error.stack
    errorResponse.error.details = {
      name: error.name,
      originalMessage: error.message,
    }
  }

  // Security Event loggen für bestimmte Fehler
  if (statusCode === 401 || statusCode === 403) {
    logger.warn('Security Event', {
      event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      error: errorCode,
    })
  }

  res.status(statusCode).json(errorResponse)
}

// Async Error Handler Wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 Handler für unbekannte Routen
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} nicht gefunden`)
  next(error)
}

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  })
  
  // In Production: Graceful Shutdown
  if (config.nodeEnv === 'production') {
    process.exit(1)
  }
})

// Uncaught Exception Handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  })
  
  // Immer beenden bei uncaught exceptions
  process.exit(1)
})