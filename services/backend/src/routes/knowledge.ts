import { Router } from 'express'
import { KnowledgeController } from '../controllers/KnowledgeController'
import { authenticate, authorize, optionalAuth } from '../middleware/auth'
import { UserType } from '@prisma/client'

const router = Router()
const knowledgeController = new KnowledgeController()

// Öffentliche Routen (keine Authentifizierung erforderlich)
router.get('/search', knowledgeController.searchLegalContent)
router.get('/legal-text/:reference', knowledgeController.getLegalText)
router.get('/similar/:reference', knowledgeController.findSimilarContent)
router.get('/health', knowledgeController.healthCheck)

// Business-Benutzer Routen (Authentifizierung und Autorisierung erforderlich)
router.post('/update', authenticate, authorize(UserType.BUSINESS), knowledgeController.updateKnowledgeBase)
router.post('/add', authenticate, authorize(UserType.BUSINESS), knowledgeController.addLegalContent)
router.put('/update/:reference', authenticate, authorize(UserType.BUSINESS), knowledgeController.updateLegalContent)
router.delete('/delete/:reference', authenticate, authorize(UserType.BUSINESS), knowledgeController.deleteLegalContent)
router.post('/initialize', authenticate, authorize(UserType.BUSINESS), knowledgeController.initializeIndex)

export default router