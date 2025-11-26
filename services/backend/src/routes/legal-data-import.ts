import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { LegalDataImportController, upload } from '../controllers/LegalDataImportController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { body, param, query } from 'express-validator'

const router = Router()
const prisma = new PrismaClient()
const legalDataController = new LegalDataImportController(prisma)

// Alle Routen benötigen Admin-Authentifizierung
router.use(authenticate, requireAdmin)

/**
 * @swagger
 * /api/legal-data/import:
 *   post:
 *     summary: Importiert Rechtsdaten aus JSON-Body
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *               options:
 *                 type: object
 *                 properties:
 *                   skipDuplicates:
 *                     type: boolean
 *                   updateExisting:
 *                     type: boolean
 *                   validateOnly:
 *                     type: boolean
 *                   batchSize:
 *                     type: number
 *     responses:
 *       200:
 *         description: Import erfolgreich
 */
router.post(
  '/import',
  authenticate,
  [
    body('data')
      .isArray()
      .withMessage('Daten müssen ein Array sein'),
    body('options.skipDuplicates')
      .optional()
      .isBoolean()
      .withMessage('skipDuplicates muss ein Boolean sein'),
    body('options.updateExisting')
      .optional()
      .isBoolean()
      .withMessage('updateExisting muss ein Boolean sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.importData(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/import/file:
 *   post:
 *     summary: Importiert Rechtsdaten aus hochgeladener JSON-Datei
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               skipDuplicates:
 *                 type: boolean
 *               updateExisting:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Datei-Import erfolgreich
 */
router.post(
  '/import/file',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.importFromFile(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/import/bgb:
 *   post:
 *     summary: Importiert BGB-Paragraphen
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paragraphs
 *             properties:
 *               paragraphs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     paragraph:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: BGB-Import erfolgreich
 */
router.post(
  '/import/bgb',
  authenticate,
  [
    body('paragraphs')
      .isArray()
      .withMessage('Paragraphen müssen ein Array sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.importBGB(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/import/court-decisions:
 *   post:
 *     summary: Importiert Gerichtsentscheidungen
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decisions
 *             properties:
 *               decisions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Gerichtsentscheidungen importiert
 */
router.post(
  '/import/court-decisions',
  authenticate,
  [
    body('decisions')
      .isArray()
      .withMessage('Entscheidungen müssen ein Array sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.importCourtDecisions(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/{reference}:
 *   put:
 *     summary: Aktualisiert bestehende Rechtsdaten
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Rechtsdaten aktualisiert
 */
router.put(
  '/:reference',
  authenticate,
  [
    param('reference')
      .notEmpty()
      .withMessage('Referenz ist erforderlich')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.updateData(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/outdated:
 *   delete:
 *     summary: Löscht veraltete Rechtsdaten
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: olderThanDays
 *         schema:
 *           type: number
 *           default: 365
 *     responses:
 *       200:
 *         description: Veraltete Daten gelöscht
 */
router.delete(
  '/outdated',
  authenticate,
  [
    query('olderThanDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('olderThanDays muss eine positive Zahl sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.deleteOutdated(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/duplicates:
 *   get:
 *     summary: Findet Duplikate
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Duplikate gefunden
 */
router.get(
  '/duplicates',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.findDuplicates(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/duplicates/cleanup:
 *   post:
 *     summary: Bereinigt Duplikate
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Duplikate bereinigt
 */
router.post(
  '/duplicates/cleanup',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.cleanupDuplicates(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/statistics:
 *   get:
 *     summary: Ruft Statistiken ab
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiken abgerufen
 */
router.get(
  '/statistics',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.getStatistics(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/updates/check:
 *   get:
 *     summary: Prüft auf verfügbare Updates
 *     tags: [Legal Data Updates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update-Check abgeschlossen
 */
router.get(
  '/updates/check',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.checkUpdates(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/updates/auto:
 *   post:
 *     summary: Führt automatisches Update durch
 *     tags: [Legal Data Updates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-Update abgeschlossen
 */
router.post(
  '/updates/auto',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.performAutoUpdate(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/updates/sync/{sourceName}:
 *   post:
 *     summary: Synchronisiert eine spezifische Quelle
 *     tags: [Legal Data Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sourceName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quelle synchronisiert
 */
router.post(
  '/updates/sync/:sourceName',
  authenticate,
  [
    param('sourceName')
      .notEmpty()
      .withMessage('Quellenname ist erforderlich')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.syncSource(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/updates/sources:
 *   get:
 *     summary: Ruft Update-Quellen ab
 *     tags: [Legal Data Updates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update-Quellen abgerufen
 */
router.get(
  '/updates/sources',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.getUpdateSources(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/updates/sources/{sourceName}:
 *   put:
 *     summary: Aktiviert/Deaktiviert eine Update-Quelle
 *     tags: [Legal Data Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sourceName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Update-Quelle umgeschaltet
 */
router.put(
  '/updates/sources/:sourceName',
  authenticate,
  [
    param('sourceName')
      .notEmpty()
      .withMessage('Quellenname ist erforderlich'),
    body('enabled')
      .isBoolean()
      .withMessage('enabled muss ein Boolean sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.toggleUpdateSource(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/legal-data/outdated:
 *   get:
 *     summary: Findet veraltete Rechtsdaten
 *     tags: [Legal Data Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: olderThanDays
 *         schema:
 *           type: number
 *           default: 365
 *     responses:
 *       200:
 *         description: Veraltete Daten gefunden
 */
router.get(
  '/outdated',
  authenticate,
  [
    query('olderThanDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('olderThanDays muss eine positive Zahl sein')
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await legalDataController.findOutdated(req, res)
    } catch (error) {
      next(error)
    }
  }
)

export default router
