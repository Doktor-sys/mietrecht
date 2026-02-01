"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation Service
 * Provides comprehensive input validation for all API endpoints
 */
class ValidationService {
    // User registration validation
    static userRegistration() {
        return [
            (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
            (0, express_validator_1.body)('password')
                .isLength({ min: 8 })
                .withMessage('Das Passwort muss mindestens 8 Zeichen lang sein')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .withMessage('Das Passwort muss Kleinbuchstaben, Großbuchstaben und Zahlen enthalten'),
            (0, express_validator_1.body)('userType')
                .isIn(['TENANT', 'LANDLORD', 'BUSINESS'])
                .withMessage('Ungültiger Benutzertyp'),
            (0, express_validator_1.body)('acceptedTerms')
                .isBoolean()
                .equals('true')
                .withMessage('Sie müssen die Allgemeinen Geschäftsbedingungen akzeptieren'),
            (0, express_validator_1.body)('firstName')
                .optional()
                .isLength({ min: 1, max: 50 })
                .withMessage('Der Vorname muss zwischen 1 und 50 Zeichen lang sein'),
            (0, express_validator_1.body)('lastName')
                .optional()
                .isLength({ min: 1, max: 50 })
                .withMessage('Der Nachname muss zwischen 1 und 50 Zeichen lang sein'),
            (0, express_validator_1.body)('location')
                .optional()
                .isLength({ max: 100 })
                .withMessage('Der Standort darf maximal 100 Zeichen lang sein'),
            (0, express_validator_1.body)('language')
                .optional()
                .isIn(['de', 'en', 'tr', 'ar'])
                .withMessage('Ungültige Sprache')
        ];
    }
    // User login validation
    static userLogin() {
        return [
            (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('Passwort ist erforderlich')
        ];
    }
    // Password reset validation
    static passwordReset() {
        return [
            (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein')
        ];
    }
    // Document upload validation
    static documentUpload() {
        return [
            (0, express_validator_1.body)('documentType')
                .isIn(['RENTAL_CONTRACT', 'UTILITY_BILL', 'WARNING_LETTER', 'OTHER'])
                .withMessage('Ungültiger Dokumenttyp'),
            (0, express_validator_1.body)('title')
                .isLength({ min: 1, max: 200 })
                .withMessage('Der Titel muss zwischen 1 und 200 Zeichen lang sein'),
            (0, express_validator_1.body)('description')
                .optional()
                .isLength({ max: 1000 })
                .withMessage('Die Beschreibung darf maximal 1000 Zeichen lang sein')
        ];
    }
    // Case creation validation
    static caseCreation() {
        return [
            (0, express_validator_1.body)('title')
                .isLength({ min: 5, max: 200 })
                .withMessage('Der Titel muss zwischen 5 und 200 Zeichen lang sein'),
            (0, express_validator_1.body)('description')
                .isLength({ min: 10, max: 5000 })
                .withMessage('Die Beschreibung muss zwischen 10 und 5000 Zeichen lang sein'),
            (0, express_validator_1.body)('category')
                .isIn(['RENTAL_AGREEMENT', 'DEPOSIT', 'MAINTENANCE', 'TERMINATION', 'UTILITY_COSTS', 'OTHER'])
                .withMessage('Ungültige Kategorie'),
            (0, express_validator_1.body)('priority')
                .optional()
                .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
                .withMessage('Ungültige Priorität')
        ];
    }
    // Message validation
    static messageCreation() {
        return [
            (0, express_validator_1.body)('content')
                .isLength({ min: 1, max: 2000 })
                .withMessage('Die Nachricht muss zwischen 1 und 2000 Zeichen lang sein'),
            (0, express_validator_1.body)('caseId')
                .optional()
                .isMongoId()
                .withMessage('Ungültige Fall-ID')
        ];
    }
    // Lawyer data validation
    static lawyerData() {
        return [
            (0, express_validator_1.body)('name')
                .isLength({ min: 2, max: 100 })
                .withMessage('Der Name muss zwischen 2 und 100 Zeichen lang sein'),
            (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
            (0, express_validator_1.body)('law_firm')
                .optional()
                .isLength({ max: 100 })
                .withMessage('Die Kanzlei darf maximal 100 Zeichen lang sein'),
            (0, express_validator_1.body)('practice_areas')
                .optional()
                .isArray({ max: 20 })
                .withMessage('Maximal 20 Praxisbereiche erlaubt'),
            (0, express_validator_1.body)('practice_areas.*')
                .optional()
                .isLength({ max: 50 })
                .withMessage('Jeder Praxisbereich darf maximal 50 Zeichen lang sein'),
            (0, express_validator_1.body)('regions')
                .optional()
                .isArray({ max: 20 })
                .withMessage('Maximal 20 Regionen erlaubt'),
            (0, express_validator_1.body)('regions.*')
                .optional()
                .isLength({ max: 50 })
                .withMessage('Jede Region darf maximal 50 Zeichen lang sein')
        ];
    }
    // Booking validation
    static bookingCreation() {
        return [
            (0, express_validator_1.body)('lawyerId')
                .isMongoId()
                .withMessage('Ungültige Anwalt-ID'),
            (0, express_validator_1.body)('timeSlotId')
                .isMongoId()
                .withMessage('Ungültige Zeitfenster-ID'),
            (0, express_validator_1.body)('consultationType')
                .isIn(['INITIAL', 'FOLLOW_UP', 'EMERGENCY'])
                .withMessage('Ungültiger Beratungstyp'),
            (0, express_validator_1.body)('description')
                .optional()
                .isLength({ max: 500 })
                .withMessage('Die Beschreibung darf maximal 500 Zeichen lang sein')
        ];
    }
    // Payment validation
    static paymentCreation() {
        return [
            (0, express_validator_1.body)('amount')
                .isFloat({ min: 0.01 })
                .withMessage('Der Betrag muss größer als 0 sein'),
            (0, express_validator_1.body)('currency')
                .isLength({ min: 3, max: 3 })
                .withMessage('Ungültige Währung'),
            (0, express_validator_1.body)('description')
                .optional()
                .isLength({ max: 200 })
                .withMessage('Die Beschreibung darf maximal 200 Zeichen lang sein')
        ];
    }
    // Generic ID validation
    static idParam(paramName) {
        return [
            (0, express_validator_1.param)(paramName)
                .isMongoId()
                .withMessage(`Ungültige ${paramName}`)
        ];
    }
    // Pagination validation
    static pagination() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Seite muss eine positive ganze Zahl sein')
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit muss zwischen 1 und 100 liegen')
                .toInt()
        ];
    }
    // Date range validation
    static dateRange() {
        return [
            (0, express_validator_1.query)('startDate')
                .optional()
                .isISO8601()
                .withMessage('Ungültiges Startdatum'),
            (0, express_validator_1.query)('endDate')
                .optional()
                .isISO8601()
                .withMessage('Ungültiges Enddatum')
                .custom((value, { req }) => {
                if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
                    throw new Error('Enddatum muss nach dem Startdatum liegen');
                }
                return true;
            })
        ];
    }
    // Search validation
    static searchQuery() {
        return [
            (0, express_validator_1.query)('q')
                .isLength({ min: 1, max: 100 })
                .withMessage('Suchanfrage muss zwischen 1 und 100 Zeichen lang sein')
        ];
    }
    // Sanitize input to prevent XSS and other injection attacks
    static sanitizeInput() {
        return [
            (0, express_validator_1.body)('*').trim().escape(),
            (0, express_validator_1.query)('*').trim().escape(),
            (0, express_validator_1.param)('*').trim().escape()
        ];
    }
}
exports.ValidationService = ValidationService;
