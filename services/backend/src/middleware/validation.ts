import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult, matchedData } from 'express-validator'
import { ValidationError } from './errorHandler'
import { logger } from '../utils/logger'

/**
 * Middleware zur Validierung von Request-Daten mit express-validator
 * Nimmt ein Array von Validierungsregeln und gibt ein Middleware-Array zurück
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return [
    ...validations,
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg).join(', ')
        
        // Log validation errors for security monitoring
        logger.warn('Validation error', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errors: errors.array()
        })
        
        throw new ValidationError(errorMessages)
      }
      
      // Sanitize and filter input data
      const sanitizedData = matchedData(req)
      req.sanitizedBody = sanitizedData
      
      next()
    }
  ]
}

/**
 * Middleware zur Sanitisierung von allen Eingabedaten
 * Entfernt potenziell gefährliche Zeichen und Tags
 */
export const sanitizeAllInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key] as string)
        }
      })
    }
    
    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key])
        }
      })
    }
    
    // Sanitize URL parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeString(req.params[key])
        }
      })
    }
    
    next()
  } catch (error) {
    logger.error('Error sanitizing input', { error })
    next()
  }
}

/**
 * Hilfsfunktion zur Sanitisierung von Strings
 */
function sanitizeString(input: string): string {
  if (!input) return input
  
  // Entferne potenziell gefährliche Zeichen
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Middleware zur Validierung von Array-Eingaben
 */
export const validateArrayInput = (fieldName: string, maxLength: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldValue = req.body[fieldName]
      
      if (fieldValue !== undefined) {
        if (!Array.isArray(fieldValue)) {
          throw new ValidationError(`${fieldName} muss ein Array sein`)
        }
        
        if (fieldValue.length > maxLength) {
          throw new ValidationError(`${fieldName} darf maximal ${maxLength} Elemente enthalten`)
        }
        
        // Validiere jedes Element im Array
        for (let i = 0; i < fieldValue.length; i++) {
          if (typeof fieldValue[i] !== 'string') {
            throw new ValidationError(`Element ${i + 1} in ${fieldName} muss ein String sein`)
          }
          
          if (fieldValue[i].length > 1000) {
            throw new ValidationError(`Element ${i + 1} in ${fieldName} darf maximal 1000 Zeichen lang sein`)
          }
        }
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware zur Validierung von numerischen Eingaben
 */
export const validateNumericInput = (fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldValue = req.body[fieldName]
      
      if (fieldValue !== undefined) {
        const numValue = Number(fieldValue)
        
        if (isNaN(numValue)) {
          throw new ValidationError(`${fieldName} muss eine gültige Zahl sein`)
        }
        
        if (numValue < min || numValue > max) {
          throw new ValidationError(`${fieldName} muss zwischen ${min} und ${max} liegen`)
        }
        
        req.body[fieldName] = numValue
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware zur Validierung von E-Mail-Adressen
 */
export const validateEmailInput = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldValue = req.body[fieldName]
      
      if (fieldValue !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
        if (!emailRegex.test(fieldValue)) {
          throw new ValidationError(`${fieldName} muss eine gültige E-Mail-Adresse sein`)
        }
        
        // Normalisiere die E-Mail-Adresse
        req.body[fieldName] = fieldValue.toLowerCase().trim()
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Erweitere das Request-Interface um die sanitizedBody-Eigenschaft
declare global {
  namespace Express {
    interface Request {
      sanitizedBody?: any
    }
  }
}