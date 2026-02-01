import { ValidationChain } from 'express-validator';
/**
 * Validation Service
 * Provides comprehensive input validation for all API endpoints
 */
export declare class ValidationService {
    static userRegistration(): ValidationChain[];
    static userLogin(): ValidationChain[];
    static passwordReset(): ValidationChain[];
    static documentUpload(): ValidationChain[];
    static caseCreation(): ValidationChain[];
    static messageCreation(): ValidationChain[];
    static lawyerData(): ValidationChain[];
    static bookingCreation(): ValidationChain[];
    static paymentCreation(): ValidationChain[];
    static idParam(paramName: string): ValidationChain[];
    static pagination(): ValidationChain[];
    static dateRange(): ValidationChain[];
    static searchQuery(): ValidationChain[];
    static sanitizeInput(): ValidationChain[];
}
