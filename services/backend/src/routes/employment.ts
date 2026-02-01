import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { NLPService } from '../services/NLPService';
import { KnowledgeService } from '../services/KnowledgeService';
import { AIResponseGenerator } from '../services/AIResponseGenerator';
import { LegalCaseClassifier } from '../services/LegalCaseClassifier';
import { CATEGORY_NAMES, MANDATORY_REFERENCES, ACTION_RECOMMENDATIONS_MAP } from '../config/LegalDataConfig';

const router = Router();
const prisma = new PrismaClient();
const nlpService = new NLPService();
const knowledgeService = new KnowledgeService(prisma);
const aiResponseGenerator = new AIResponseGenerator(prisma);
const legalCaseClassifier = new LegalCaseClassifier();

/**
 * @swagger
 * /api/employment/chat:
 *   post:
 *     summary: Arbeitsrechtliche Beratung starten
 *     tags: [Employment Law]
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
 *                 description: Die arbeitsrechtliche Frage des Nutzers
 *     responses:
 *       200:
 *         description: Arbeitsrechtliche Beratung erfolgreich gestartet
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/chat', authenticate, async (req: Request, res: Response) => {
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

    // KI-gestützte Klassifizierung der Anfrage
    const intentResult = await nlpService.recognizeIntent(query);
    
    // Kontextextraktion
    const context = await nlpService.extractContext(query, intentResult);
    
    // Generierung der KI-Antwort
    const aiResponse = await aiResponseGenerator.generateResponse(
      {
        classification: {
          category: intentResult.category,
          confidence: intentResult.confidence,
          intent: intentResult.intent,
          riskLevel: 'low',
          estimatedComplexity: 'simple',
          escalationRecommended: false
        },
        context: {
          facts: context.facts,
          legalIssues: context.legalIssues,
          urgency: context.urgency
        },
        recommendations: []
      },
      query,
      undefined, // conversationContext
      req.user // userProfile
    );
    
    res.status(200).json({
      success: true,
      data: {
        category: intentResult.category,
        categoryName: CATEGORY_NAMES[intentResult.category as keyof typeof CATEGORY_NAMES] || 'Arbeitsrecht',
        intent: intentResult.intent,
        message: aiResponse.message,
        legalReferences: aiResponse.legalReferences,
        actionRecommendations: aiResponse.actionRecommendations,
        facts: context.facts,
        legalIssues: context.legalIssues,
        urgency: context.urgency,
      },
    });
  } catch (error) {
    logger.error('Error in employment law consultation', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler bei der arbeitsrechtlichen Beratung',
      },
    });
  }
});

/**
 * @swagger
 * /api/employment/categories:
 *   get:
 *     summary: Alle Arbeitsrecht-Kategorien abrufen
 *     tags: [Employment Law]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Arbeitsrecht-Kategorien
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/categories', authenticate, async (_req: Request, res: Response) => {
  try {
    // Filtern auf Arbeitsrecht-Kategorien
    const employmentCategories = [
      'employment_contract',
      'termination_protection',
      'severance',
      'vacation',
      'wage_continuation',
      'discrimination',
      'working_time'
    ];
    
    const categories = employmentCategories.map(category => ({
      id: category,
      name: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category,
      description: `Informationen und Beratung zu ${CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category}`
    }));
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching employment categories', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Kategorien',
      },
    });
  }
});

/**
 * @swagger
 * /api/employment/knowledge/{category}:
 *   get:
 *     summary: Wissensdaten für eine Arbeitsrecht-Kategorie abrufen
 *     tags: [Employment Law]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wissensdaten für die Kategorie
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Kategorie nicht gefunden
 */
router.get('/knowledge/:category', authenticate, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    // Prüfen, ob es sich um eine gültige Arbeitsrecht-Kategorie handelt
    const employmentCategories = [
      'employment_contract',
      'termination_protection',
      'severance',
      'vacation',
      'wage_continuation',
      'discrimination',
      'working_time'
    ];
    
    if (!employmentCategories.includes(category)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Kategorie nicht gefunden',
        },
      });
    }
    
    // Abrufen der Wissensdaten
    const legalReferences = MANDATORY_REFERENCES[category as keyof typeof MANDATORY_REFERENCES] || [];
    const actionRecommendations = ACTION_RECOMMENDATIONS_MAP[category as keyof typeof ACTION_RECOMMENDATIONS_MAP] || [];
    
    res.status(200).json({
      success: true,
      data: {
        category,
        categoryName: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category,
        legalReferences,
        actionRecommendations,
      },
    });
  } catch (error) {
    logger.error('Error fetching employment knowledge', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Wissensdaten',
      },
    });
  }
});

/**
 * @swagger
 * /api/employment/conversations:
 *   get:
 *     summary: Vorherige arbeitsrechtliche Konversationen abrufen
 *     tags: [Employment Law]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Konversationen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
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
    
    // Da es kein eigenes EmploymentConversation-Modell gibt, geben wir eine leere Liste zurück
    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error) {
    logger.error('Error fetching employment conversations', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Konversationen',
      },
    });
  }
});

/**
 * @swagger
 * /api/employment/conversations/{conversationId}:
 *   get:
 *     summary: Eine spezifische arbeitsrechtliche Konversation abrufen
 *     tags: [Employment Law]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Konversation
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Konversation nicht gefunden
 */
router.get('/conversations/:conversationId', authenticate, async (req: Request, res: Response) => {
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
    
    // Da es kein eigenes EmploymentConversation-Modell gibt, geben wir einen Fehler zurück
    return res.status(404).json({
      success: false,
      error: {
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Konversation nicht gefunden',
      },
    });
  } catch (error) {
    logger.error('Error fetching employment conversation', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Konversation',
      },
    });
  }
});

export default router;