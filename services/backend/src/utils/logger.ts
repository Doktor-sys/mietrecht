import winston from 'winston'
import { config } from '../config/config'

// Custom Log Format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    if (stack) {
      log += `\n${stack}`
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// Console Format für Development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`
    if (stack) {
      log += `\n${stack}`
    }
    return log
  })
)

// Logger Configuration
export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: {
    service: 'smartlaw-backend',
    environment: config.nodeEnv,
  },
  transports: [
    // Console Transport
    new winston.transports.Console({
      format: config.nodeEnv === 'production' ? logFormat : consoleFormat,
    }),
    
    // File Transports für Production
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
  
  // Exception Handling
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: 'logs/exceptions.log',
      }),
    ] : []),
  ],
  
  // Rejection Handling
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: 'logs/rejections.log',
      }),
    ] : []),
  ],
})

// Utility Functions für strukturiertes Logging
export const loggers = {
  // HTTP Request Logging
  httpRequest: (req: any, res: any, responseTime: number) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    })
  },

  // Database Operation Logging
  dbOperation: (operation: string, table: string, duration: number, success: boolean) => {
    logger.debug('Database Operation', {
      operation,
      table,
      duration: `${duration}ms`,
      success,
    })
  },

  // AI Operation Logging
  aiOperation: (operation: string, model: string, tokens: number, confidence: number) => {
    logger.info('AI Operation', {
      operation,
      model,
      tokens,
      confidence,
    })
  },

  // Security Event Logging
  securityEvent: (event: string, userId?: string, ip?: string, details?: any) => {
    logger.warn('Security Event', {
      event,
      userId,
      ip,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  // Business Logic Logging
  businessEvent: (event: string, userId: string, details?: any) => {
    logger.info('Business Event', {
      event,
      userId,
      details,
    })
  },
}

// Error Logging Helper
export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  })
}