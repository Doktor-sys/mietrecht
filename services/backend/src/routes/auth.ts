import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

const router = Router()
const authController = new AuthController()

// Öffentliche Routen (keine Authentifizierung erforderlich)
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refreshToken)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.post('/verify-email', authController.verifyEmailWithToken)
router.post('/confirm-email-change', authController.confirmEmailChange)

// Geschützte Routen (Authentifizierung erforderlich)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/verify-token', authenticate, authController.verifyToken)
router.post('/resend-verification', authenticate, authController.resendVerificationEmail)
router.post('/change-email', authenticate, authController.changeEmail)

export default router