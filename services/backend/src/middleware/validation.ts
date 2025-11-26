import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { ValidationError } from './errorHandler'

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
        throw new ValidationError(errorMessages)
      }
      
      next()
    }
  ]
}