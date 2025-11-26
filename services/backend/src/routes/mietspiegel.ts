import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { MietspiegelController } from '../controllers/MietspiegelController'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { body, param, query } from 'express-validator'

const router = Router()
const prisma = new PrismaClient()
const mietspiegelController = new MietspiegelController(prisma)

/**
 * @swagger
 * components:
 *   schemas:
 *     ApartmentDetails:
 *       type: object
 *       required:
 *         - size
 *         - rooms
 *       properties:
 *         size:
 *           type: number
 *           description: Wohnungsgröße in Quadratmetern
 *           minimum: 1
 *         rooms:
 *           type: number
 *           description: Anzahl der Zimmer
 *           minimum: 1
 *         constructionYear:
 *           type: number
 *           description: Baujahr der Wohnung
 *           minimum: 1800
 *         condition:
 *           type: string
 *           enum: [simple, normal, good, excellent]
 *           description: Zustand der Wohnung
 *         location:
 *           type: string
 *           enum: [peripheral, normal, central, premium]
 *           description: Lage der Wohnung
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: Ausstattungsmerkmale
 *         heatingType:
 *           type: string
 *           enum: [central, individual, district]
 *           description: Art der Heizung
 *         energyClass:
 *           type: string
 *           enum: [A+, A, B, C, D, E, F, G, H]
 *           description: Energieeffizienzklasse
 *     
 *     MietspiegelData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         city:
 *           type: string
 *         year:
 *           type: number
 *         averageRent:
 *           type: number
 *         rentRanges:
 *           type: array
 *           items:
 *             type: object
 *         specialRegulations:
 *           type: array
 *           items:
 *             type: string
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     
 *     RentCalculationResult:
 *       type: object
 *       properties:
 *         city:
 *           type: string
 *         year:
 *           type: number
 *         apartmentDetails:
 *           $ref: '#/components/schemas/ApartmentDetails'
 *         calculatedRent:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             average:
 *               type: number
 *             recommended:
 *               type: number
 *         comparison:
 *           type: object
 *         factors:
 *           type: object
 *         applicableRegulations:
 *           type: array
 *           items:
 *             type: string
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/mietspiegel/{city}:
 *   get:
 *     summary: Ruft Mietspiegel-Daten für eine Stadt ab
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Name der Stadt
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Jahr der Mietspiegel-Daten (optional)
 *     responses:
 *       200:
 *         description: Mietspiegel-Daten erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MietspiegelData'
 *       404:
 *         description: Keine Daten für die Stadt gefunden
 *       401:
 *         description: Nicht authentifiziert
 */
router.get(
  '/:city',
  authenticateToken,
  [
    param('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein'),
    query('year')
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage('Jahr muss zwischen 2000 und nächstem Jahr liegen')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.getMietspiegelData(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/calculate-rent:
 *   post:
 *     summary: Berechnet Mietpreis-Range basierend auf Wohnungsdetails
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - apartmentDetails
 *             properties:
 *               city:
 *                 type: string
 *                 description: Name der Stadt
 *               apartmentDetails:
 *                 $ref: '#/components/schemas/ApartmentDetails'
 *     responses:
 *       200:
 *         description: Mietpreis-Berechnung erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RentCalculationResult'
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht authentifiziert
 */
router.post(
  '/calculate-rent',
  authenticateToken,
  [
    body('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein'),
    body('apartmentDetails')
      .notEmpty()
      .withMessage('Wohnungsdetails sind erforderlich'),
    body('apartmentDetails.size')
      .isFloat({ min: 1 })
      .withMessage('Wohnungsgröße muss größer als 0 sein'),
    body('apartmentDetails.rooms')
      .isFloat({ min: 1 })
      .withMessage('Anzahl Zimmer muss größer als 0 sein'),
    body('apartmentDetails.constructionYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Baujahr muss zwischen 1800 und heute liegen'),
    body('apartmentDetails.condition')
      .optional()
      .isIn(['simple', 'normal', 'good', 'excellent'])
      .withMessage('Zustand muss simple, normal, good oder excellent sein'),
    body('apartmentDetails.location')
      .optional()
      .isIn(['peripheral', 'normal', 'central', 'premium'])
      .withMessage('Lage muss peripheral, normal, central oder premium sein')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.calculateRentRange(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/{city}/regulations:
 *   get:
 *     summary: Ruft lokale Bestimmungen für eine Stadt ab
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Name der Stadt
 *     responses:
 *       200:
 *         description: Lokale Bestimmungen erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Nicht authentifiziert
 */
router.get(
  '/:city/regulations',
  authenticateToken,
  [
    param('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.getLocalRegulations(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/compare-rent:
 *   post:
 *     summary: Vergleicht aktuelle Miete mit Mietspiegel
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - currentRent
 *               - apartmentDetails
 *             properties:
 *               city:
 *                 type: string
 *                 description: Name der Stadt
 *               currentRent:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Aktuelle Miete in Euro
 *               apartmentDetails:
 *                 $ref: '#/components/schemas/ApartmentDetails'
 *     responses:
 *       200:
 *         description: Mietvergleich erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     comparison:
 *                       type: string
 *                       enum: [below, within, above]
 *                     deviation:
 *                       type: number
 *                     percentageDeviation:
 *                       type: number
 *                     recommendation:
 *                       type: string
 *                     legalBasis:
 *                       type: string
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht authentifiziert
 */
router.post(
  '/compare-rent',
  authenticateToken,
  [
    body('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein'),
    body('currentRent')
      .isFloat({ min: 0.01 })
      .withMessage('Aktuelle Miete muss größer als 0 sein'),
    body('apartmentDetails')
      .notEmpty()
      .withMessage('Wohnungsdetails sind erforderlich'),
    body('apartmentDetails.size')
      .isFloat({ min: 1 })
      .withMessage('Wohnungsgröße muss größer als 0 sein'),
    body('apartmentDetails.rooms')
      .isFloat({ min: 1 })
      .withMessage('Anzahl Zimmer muss größer als 0 sein')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.compareMietWithMietspiegel(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/cities:
 *   get:
 *     summary: Ruft verfügbare Städte mit Mietspiegel-Daten ab
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verfügbare Städte erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       city:
 *                         type: string
 *                       availableYears:
 *                         type: array
 *                         items:
 *                           type: number
 *                       currentYear:
 *                         type: number
 *                       lastUpdate:
 *                         type: string
 *                         format: date-time
 *                       dataQuality:
 *                         type: string
 *                         enum: [official, estimated, outdated]
 *                       coverage:
 *                         type: number
 *                       sampleSize:
 *                         type: number
 *       401:
 *         description: Nicht authentifiziert
 */
router.get(
  '/cities',
  authenticateToken,
  async (req, res, next) => {
    try {
      await mietspiegelController.getAvailableCities(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/update:
 *   put:
 *     summary: Aktualisiert Mietspiegel-Daten (Admin-Funktion)
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - year
 *               - averageRent
 *               - rentRanges
 *             properties:
 *               city:
 *                 type: string
 *                 description: Name der Stadt
 *               year:
 *                 type: number
 *                 description: Jahr der Mietspiegel-Daten
 *               averageRent:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Durchschnittsmiete in Euro
 *               rentRanges:
 *                 type: array
 *                 items:
 *                   type: object
 *               specialRegulations:
 *                 type: array
 *                 items:
 *                   type: string
 *               dataSource:
 *                 type: string
 *               lastUpdated:
 *                 type: string
 *                 format: date-time
      await mietspiegelController.getLocalRegulations(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/compare-rent:
 *   post:
 *     summary: Vergleicht aktuelle Miete mit Mietspiegel
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - currentRent
 *               - apartmentDetails
 *             properties:
 *               city:
 *                 type: string
 *                 description: Name der Stadt
 *               currentRent:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Aktuelle Miete in Euro
 *               apartmentDetails:
 *                 $ref: '#/components/schemas/ApartmentDetails'
 *     responses:
 *       200:
 *         description: Mietvergleich erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     comparison:
 *                       type: string
 *                       enum: [below, within, above]
 *                     deviation:
 *                       type: number
 *                     percentageDeviation:
 *                       type: number
 *                     recommendation:
 *                       type: string
 *                     legalBasis:
 *                       type: string
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht authentifiziert
 */
router.post(
  '/compare-rent',
  authenticateToken,
  [
    body('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein'),
    body('currentRent')
      .isFloat({ min: 0.01 })
      .withMessage('Aktuelle Miete muss größer als 0 sein'),
    body('apartmentDetails')
      .notEmpty()
      .withMessage('Wohnungsdetails sind erforderlich'),
    body('apartmentDetails.size')
      .isFloat({ min: 1 })
      .withMessage('Wohnungsgröße muss größer als 0 sein'),
    body('apartmentDetails.rooms')
      .isFloat({ min: 1 })
      .withMessage('Anzahl Zimmer muss größer als 0 sein')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.compareMietWithMietspiegel(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/cities:
 *   get:
 *     summary: Ruft verfügbare Städte mit Mietspiegel-Daten ab
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verfügbare Städte erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       city:
 *                         type: string
 *                       availableYears:
 *                         type: array
 *                         items:
 *                           type: number
 *                       currentYear:
 *                         type: number
 *                       lastUpdate:
 *                         type: string
 *                         format: date-time
 *                       dataQuality:
 *                         type: string
 *                         enum: [official, estimated, outdated]
 *                       coverage:
 *                         type: number
 *                       sampleSize:
 *                         type: number
 *       401:
 *         description: Nicht authentifiziert
 */
router.get(
  '/cities',
  authenticateToken,
  async (req, res, next) => {
    try {
      await mietspiegelController.getAvailableCities(req, res)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/mietspiegel/update:
 *   put:
 *     summary: Aktualisiert Mietspiegel-Daten (Admin-Funktion)
 *     tags: [Mietspiegel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - year
 *               - averageRent
 *               - rentRanges
 *             properties:
 *               city:
 *                 type: string
 *                 description: Name der Stadt
 *               year:
 *                 type: number
 *                 description: Jahr der Mietspiegel-Daten
 *               averageRent:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Durchschnittsmiete in Euro
 *               rentRanges:
 *                 type: array
 *                 items:
 *                   type: object
 *               specialRegulations:
 *                 type: array
 *                 items:
 *                   type: string
 *               dataSource:
 *                 type: string
 *               lastUpdated:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Mietspiegel-Daten erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MietspiegelData'
 *                 message:
 *                   type: string
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung (Admin erforderlich)
 */
router.put(
  '/update',
  authenticateToken,
  requireAdmin,
  [
    body('city')
      .notEmpty()
      .withMessage('Stadt ist erforderlich')
      .isLength({ min: 2, max: 50 })
      .withMessage('Stadt muss zwischen 2 und 50 Zeichen lang sein'),
    body('year')
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage('Jahr muss zwischen 2000 und nächstem Jahr liegen'),
    body('averageRent')
      .isFloat({ min: 0.01 })
      .withMessage('Durchschnittsmiete muss größer als 0 sein'),
    body('rentRanges')
      .isArray({ min: 1 })
      .withMessage('Mindestens eine Mietspanne ist erforderlich'),
    body('specialRegulations')
      .optional()
      .isArray()
      .withMessage('Besondere Bestimmungen müssen ein Array sein')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await mietspiegelController.updateMietspiegelData(req, res)
    } catch (error) {
      next(error)
    }
  }
)

export default router