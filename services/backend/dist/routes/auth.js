"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const ValidationService_1 = require("../services/ValidationService");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
// Öffentliche Routen (keine Authentifizierung erforderlich)
router.post('/register', validation_1.sanitizeAllInput, (0, validation_1.validateRequest)(ValidationService_1.ValidationService.userRegistration()), authController.register);
router.post('/login', validation_1.sanitizeAllInput, (0, validation_1.validateRequest)(ValidationService_1.ValidationService.userLogin()), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', validation_1.sanitizeAllInput, (0, validation_1.validateRequest)(ValidationService_1.ValidationService.passwordReset()), authController.forgotPassword);
router.post('/reset-password', validation_1.sanitizeAllInput, authController.resetPassword);
router.post('/verify-email', validation_1.sanitizeAllInput, authController.verifyEmailWithToken);
router.post('/confirm-email-change', validation_1.sanitizeAllInput, authController.confirmEmailChange);
// Geschützte Routen (Authentifizierung erforderlich)
router.post('/logout', auth_1.authenticate, authController.logout);
router.get('/me', auth_1.authenticate, authController.me);
router.post('/verify-token', auth_1.authenticate, authController.verifyToken);
router.post('/resend-verification', auth_1.authenticate, authController.resendVerificationEmail);
router.post('/change-email', auth_1.authenticate, authController.changeEmail);
exports.default = router;
