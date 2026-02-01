import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Middleware zur Validierung von Request-Daten mit express-validator
 * Nimmt ein Array von Validierungsregeln und gibt ein Middleware-Array zurück
 */
export declare const validateRequest: (validations: ValidationChain[]) => (ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
/**
 * Middleware zur Sanitisierung von allen Eingabedaten
 * Entfernt potenziell gefährliche Zeichen und Tags
 */
export declare const sanitizeAllInput: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware zur Validierung von Array-Eingaben
 */
export declare const validateArrayInput: (fieldName: string, maxLength?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware zur Validierung von numerischen Eingaben
 */
export declare const validateNumericInput: (fieldName: string, min?: number, max?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware zur Validierung von E-Mail-Adressen
 */
export declare const validateEmailInput: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            sanitizedBody?: any;
        }
    }
}
