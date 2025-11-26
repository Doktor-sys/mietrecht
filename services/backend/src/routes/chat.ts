import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { ChatService } from '../services/ChatService'
import { WebSocketService } from '../services/WebSocketService'
import { logger } from '../utils/logger'

const router = Router()
const prisma = new PrismaClient()
const chatService = new ChatService(prisma)

/**
 * @swagger
 * /api/chat/start:
 *   post:
 *     summary: Neue Konversation starten
 *     tags: [Chat & AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Erste Frage des Benutzers
 *     responses:
 *       201:
 *         description: Konversation erfolgreich erstellt
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/start', authenticate, async (req: Request, res: Response) => {
  try {
    const { query } = req.body
    const userId = req.user!.userId

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Query ist erforderlich',
        },
      })
    }

    // WebSocket Service holen
    const wsService = req.app.get('wsService') as WebSocketService

    // Typing-Indikator senden
    if (wsService) {
      wsService.sendTypingIndicator(userId, true)
    }

    // Konversation starten
    const response = await chatService.startConversation(userId, query)

    // Konversations-ID über WebSocket senden
    if (wsService) {
      wsService.sendConversationId(userId, response.conversationId)
      
      // AI-Antwort über WebSocket senden
      wsService.sendMessageToUser(userId, {
        id: Date.now().toString(),
        content: response.message,
        timestamp: new Date().toISOString(),
        legalReferences: response.legalReferences,
      })
    }

    res.status(201).json({
      success: true,
      data: response,
    })
  } catch (error) {
    logger.error('Error starting conversation', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Starten der Konversation',
      },
    })
  }
})

/**
 * @swagger
 * /api/chat/{conversationId}/message:
 *   post:
 *     summary: Nachricht senden
 *     tags: [Chat & AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: KI-Antwort erhalten
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Konversation nicht gefunden
 */
router.post('/:conversationId/message', authenticate, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    const { message } = req.body
    const userId = req.user!.userId

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message ist erforderlich',
        },
      })
    }

    // WebSocket Service holen
    const wsService = req.app.get('wsService') as WebSocketService

    // Typing-Indikator senden
    if (wsService) {
      wsService.sendTypingIndicator(userId, true)
    }

    // Nachricht senden
    const response = await chatService.sendMessage(conversationId, userId, message)

    // AI-Antwort über WebSocket senden
    if (wsService) {
      wsService.sendMessageToUser(userId, {
        id: Date.now().toString(),
        content: response.message,
        timestamp: new Date().toISOString(),
        legalReferences: response.legalReferences,
      })
    }

    res.status(200).json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    logger.error('Error sending message', { error })
    
    if (error.message === 'Conversation not found or access denied') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Konversation nicht gefunden',
        },
      })
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Senden der Nachricht',
      },
    })
  }
})

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Konversationsverlauf abrufen
 *     tags: [Chat & AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Konversationsverlauf erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const history = await chatService.getConversationHistory(userId)

    res.status(200).json({
      success: true,
      data: history,
    })
  } catch (error) {
    logger.error('Error getting conversation history', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen des Verlaufs',
      },
    })
  }
})

/**
 * @swagger
 * /api/chat/{conversationId}/messages:
 *   get:
 *     summary: Nachrichten einer Konversation abrufen
 *     tags: [Chat & AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Nachrichten erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Konversation nicht gefunden
 */
router.get('/:conversationId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    const userId = req.user!.userId

    const messages = await chatService.getConversationMessages(conversationId, userId)

    res.status(200).json({
      success: true,
      data: messages,
    })
  } catch (error: any) {
    logger.error('Error getting conversation messages', { error })
    
    if (error.message === 'Conversation not found or access denied') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Konversation nicht gefunden',
        },
      })
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Nachrichten',
      },
    })
  }
})

/**
 * @swagger
 * /api/chat/{conversationId}/escalate:
 *   post:
 *     summary: Konversation an Anwalt eskalieren
 *     tags: [Chat & AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Erfolgreich eskaliert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Konversation nicht gefunden
 */
router.post('/:conversationId/escalate', authenticate, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    const userId = req.user!.userId

    await chatService.escalateToLawyer(conversationId, userId)

    res.status(200).json({
      success: true,
      message: 'Konversation erfolgreich eskaliert',
    })
  } catch (error: any) {
    logger.error('Error escalating conversation', { error })
    
    if (error.message === 'Conversation not found or access denied') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Konversation nicht gefunden',
        },
      })
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Eskalieren',
      },
    })
  }
})

export default router