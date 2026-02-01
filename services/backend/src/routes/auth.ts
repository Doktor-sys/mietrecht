import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'
import { validateRequest, sanitizeAllInput } from '../middleware/validation'
import { ValidationService } from '../services/ValidationService'

const router = Router()
const authController = new AuthController()

// Öffentliche Routen (keine Authentifizierung erforderlich)
router.post('/register', 
  sanitizeAllInput,
  validateRequest(ValidationService.userRegistration()),
  authController.register
)

router.post('/login', 
  sanitizeAllInput,
  validateRequest(ValidationService.userLogin()),
  authController.login
)

router.post('/refresh', authController.refreshToken)

router.post('/forgot-password', 
  sanitizeAllInput,
  validateRequest(ValidationService.passwordReset()),
  authController.forgotPassword
)

router.post('/reset-password', 
  sanitizeAllInput,
  authController.resetPassword
)

router.post('/verify-email', 
  sanitizeAllInput,
  authController.verifyEmailWithToken
)

router.post('/confirm-email-change', 
  sanitizeAllInput,
  authController.confirmEmailChange
)

// Geschützte Routen (Authentifizierung erforderlich)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/verify-token', authenticate, authController.verifyToken)
router.post('/resend-verification', authenticate, authController.resendVerificationEmail)
router.post('/change-email', authenticate, authController.changeEmail)

export default router