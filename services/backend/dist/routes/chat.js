"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const ChatService_1 = require("../services/ChatService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const chatService = new ChatService_1.ChatService(prisma);
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
router.post('/start', auth_1.authenticate, async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Query ist erforderlich',
                },
            });
        }
        // WebSocket Service holen
        const wsService = req.app.get('wsService');
        // Typing-Indikator senden
        if (wsService) {
            wsService.sendTypingIndicator(userId, true);
        }
        // Konversation starten
        const response = await chatService.startConversation(userId, query);
        // Konversations-ID über WebSocket senden
        if (wsService) {
            wsService.sendConversationId(userId, response.conversationId);
            // AI-Antwort über WebSocket senden
            wsService.sendMessageToUser(userId, {
                id: Date.now().toString(),
                content: response.message,
                timestamp: new Date().toISOString(),
                legalReferences: response.legalReferences,
            });
        }
        res.status(201).json({
            success: true,
            data: response,
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting conversation', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Starten der Konversation',
            },
        });
    }
});
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
router.post('/:conversationId/message', auth_1.authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Message ist erforderlich',
                },
            });
        }
        // WebSocket Service holen
        const wsService = req.app.get('wsService');
        // Typing-Indikator senden
        if (wsService) {
            wsService.sendTypingIndicator(userId, true);
        }
        // Nachricht senden
        const response = await chatService.sendMessage(conversationId, userId, message);
        // AI-Antwort über WebSocket senden
        if (wsService) {
            wsService.sendMessageToUser(userId, {
                id: Date.now().toString(),
                content: response.message,
                timestamp: new Date().toISOString(),
                legalReferences: response.legalReferences,
            });
        }
        res.status(200).json({
            success: true,
            data: response,
        });
    }
    catch (error) {
        logger_1.logger.error('Error sending message', { error });
        if (error.message === 'Conversation not found or access denied') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Konversation nicht gefunden',
                },
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Senden der Nachricht',
            },
        });
    }
});
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
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        const history = await chatService.getConversationHistory(userId);
        res.status(200).json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting conversation history', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen des Verlaufs',
            },
        });
    }
});
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
router.get('/:conversationId/messages', auth_1.authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        const messages = await chatService.getConversationMessages(conversationId, userId);
        res.status(200).json({
            success: true,
            data: messages,
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting conversation messages', { error });
        if (error.message === 'Conversation not found or access denied') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Konversation nicht gefunden',
                },
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Nachrichten',
            },
        });
    }
});
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
router.post('/:conversationId/escalate', auth_1.authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        await chatService.escalateToLawyer(conversationId, userId);
        res.status(200).json({
            success: true,
            message: 'Konversation erfolgreich eskaliert',
        });
    }
    catch (error) {
        logger_1.logger.error('Error escalating conversation', { error });
        if (error.message === 'Conversation not found or access denied') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Konversation nicht gefunden',
                },
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Eskalieren',
            },
        });
    }
});
/**
 * @swagger
 * /api/chat/{conversationId}/feedback:
 *   post:
 *     summary: Feedback zu einer KI-Antwort geben
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID der Nachricht, zu der Feedback gegeben wird
 *               feedback:
 *                 type: string
 *                 description: Feedback des Nutzers zur Antwort
 *             required:
 *               - messageId
 *               - feedback
 *     responses:
 *       200:
 *         description: Verfeinerte Antwort
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:conversationId/feedback', auth_1.authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { messageId, feedback } = req.body;
        const userId = req.user?.id;
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Benutzer nicht authentifiziert',
                },
            });
        }
        if (!messageId || !feedback) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'messageId und feedback sind erforderlich',
                },
            });
        }
        // Get the original message and conversation
        const originalMessage = await prisma.message.findFirst({
            where: {
                id: messageId,
                caseId: conversationId,
                sender: 'AI'
            }
        });
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MESSAGE_NOT_FOUND',
                    message: 'Nachricht nicht gefunden',
                },
            });
        }
        // Get the user's original query for this message
        const userMessage = await prisma.message.findFirst({
            where: {
                caseId: conversationId,
                sender: 'USER',
                timestamp: {
                    lt: originalMessage.timestamp
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        });
        // Refine the AI response based on feedback
        const originalResponse = {
            message: originalMessage.content,
            confidence: originalMessage.metadata?.confidence || 0.8,
            legalReferences: originalMessage.metadata?.legalReferences || [],
            actionRecommendations: originalMessage.metadata?.actionRecommendations || [],
            templateReferences: originalMessage.metadata?.templateReferences || [],
            escalationRecommended: originalMessage.metadata?.escalationRecommended || false,
            escalationReason: originalMessage.metadata?.escalationReason
        };
        const refinedResponse = await chatService.refineResponse(originalResponse, feedback, userMessage?.content || '');
        // Save the refined response
        const refinedMessage = await prisma.message.create({
            data: {
                caseId: conversationId,
                sender: 'AI',
                content: refinedResponse.message,
                metadata: {
                    category: originalMessage.metadata?.category,
                    confidence: refinedResponse.confidence,
                    riskLevel: originalMessage.metadata?.riskLevel,
                    escalationRecommended: refinedResponse.escalationRecommended,
                    legalReferences: JSON.parse(JSON.stringify(refinedResponse.legalReferences)),
                    actionRecommendations: JSON.parse(JSON.stringify(refinedResponse.actionRecommendations)),
                    templateReferences: JSON.parse(JSON.stringify(refinedResponse.templateReferences)),
                    isRefined: true,
                    originalMessageId: messageId
                }
            }
        });
        // WebSocket Service holen
        const wsService = req.app.get('wsService');
        // Verfeinerte Antwort über WebSocket senden
        if (wsService) {
            wsService.sendMessageToUser(userId, {
                id: refinedMessage.id,
                content: refinedResponse.message,
                timestamp: refinedMessage.timestamp.toISOString(),
                legalReferences: refinedResponse.legalReferences,
                isRefined: true
            });
        }
        res.status(200).json({
            success: true,
            data: {
                id: refinedMessage.id,
                content: refinedResponse.message,
                timestamp: refinedMessage.timestamp,
                sender: 'AI',
                legalReferences: refinedResponse.legalReferences,
                isRefined: true
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing feedback', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Verarbeiten des Feedbacks',
            },
        });
    }
});
exports.default = router;
