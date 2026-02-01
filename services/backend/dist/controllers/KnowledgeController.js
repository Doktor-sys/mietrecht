"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const KnowledgeService_1 = require("../services/KnowledgeService");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
class KnowledgeController {
    constructor() {
        /**
         * @swagger
         * /api/knowledge/search:
         *   get:
         *     summary: Rechtsdatenbank durchsuchen
         *     tags: [Legal Knowledge]
         *     parameters:
         *       - in: query
         *         name: q
         *         required: true
         *         schema:
         *           type: string
         *         description: Suchbegriff
         *         example: "Mietminderung"
         *       - in: query
         *         name: type
         *         schema:
         *           type: string
         *           enum: [LAW, COURT_DECISION, REGULATION]
         *         description: Art des Rechtsinhalts
         *       - in: query
         *         name: jurisdiction
         *         schema:
         *           type: string
         *         description: Jurisdiktion
         *         example: "Deutschland"
         *       - in: query
         *         name: tags
         *         schema:
         *           type: array
         *           items:
         *             type: string
         *         description: Tags zum Filtern
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           default: 1
         *         description: Seitennummer
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 20
         *           maximum: 100
         *         description: Anzahl Ergebnisse pro Seite
         *       - in: query
         *         name: relevanceThreshold
         *         schema:
         *           type: number
         *         description: Mindest-Relevanz-Score
         *     responses:
         *       200:
         *         description: Suchergebnisse erfolgreich abgerufen
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: object
         *                   properties:
         *                     results:
         *                       type: array
         *                       items:
         *                         $ref: '#/components/schemas/SearchResult'
         *                     total:
         *                       type: integer
         *                     page:
         *                       type: integer
         *                     totalPages:
       *   get:
       *     summary: Spezifischen Rechtstext abrufen
       *     tags: [Legal Knowledge]
       *     parameters:
       *       - in: path
       *         name: reference
       *         required: true
       *         schema:
       *           type: string
       *         description: Referenz des Rechtstexts
       *         example: "§ 536 BGB"
       *     responses:
       *       200:
       *         description: Rechtstext erfolgreich abgerufen
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 success:
       *                   type: boolean
       *                   example: true
       *                 data:
       *                   $ref: '#/components/schemas/LegalText'
       *       404:
       *         $ref: '#/components/responses/NotFoundError'
       */
        this.getLegalText = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { reference } = req.params;
            if (!reference) {
                throw new errorHandler_2.ValidationError('Referenz ist erforderlich');
            }
            const legalText = await this.knowledgeService.getLegalText(reference);
            if (!legalText) {
                throw new errorHandler_2.ValidationError('Rechtstext nicht gefunden');
            }
            res.json({
                success: true,
                data: legalText
            });
        });
        /**
         * @swagger
         * /api/knowledge/similar/{reference}:
         *   get:
         *     summary: Ähnliche Rechtstexte finden
         *     tags: [Legal Knowledge]
         *     parameters:
         *       - in: path
         *         name: reference
         *         required: true
         *         schema:
         *           type: string
         *         description: Referenz des Rechtstexts
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 5
         *           maximum: 20
         *         description: Anzahl ähnlicher Texte
         *     responses:
         *       200:
         *         description: Ähnliche Rechtstexte gefunden
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/SearchResult'
         *       404:
         *         $ref: '#/components/responses/NotFoundError'
         */
        this.findSimilarContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { reference } = req.params;
            const limit = Math.min(parseInt(req.query.limit) || 5, 20);
            if (!reference) {
                throw new errorHandler_2.ValidationError('Referenz ist erforderlich');
            }
            const similarContent = await this.knowledgeService.findSimilarContent(reference, limit);
            res.json({
                success: true,
                data: similarContent
            });
        });
        /**
         * @swagger
         * /api/knowledge/update:
         *   post:
         *     summary: Rechtsdatenbank aktualisieren (nur für Business-Benutzer)
         *     tags: [Legal Knowledge]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Datenbank erfolgreich aktualisiert
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: object
         *                   properties:
         *                     updated:
         *                       type: integer
         *                     created:
         *                       type: integer
         *                     errors:
         *                       type: array
         *                       items:
         *                         type: string
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       403:
         *         $ref: '#/components/responses/AuthorizationError'
         */
        this.updateKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            // Nur Business-Benutzer dürfen die Datenbank aktualisieren
            if (userType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert für Datenbank-Updates');
            }
            const result = await this.knowledgeService.updateKnowledgeBase();
            res.json({
                success: true,
                data: result,
                message: 'Rechtsdatenbank erfolgreich aktualisiert'
            });
        });
        /**
         * @swagger
         * /api/knowledge/add:
         *   post:
         *     summary: Neuen Rechtstext hinzufügen (nur für Business-Benutzer)
         *     tags: [Legal Knowledge]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - reference
         *               - title
         *               - content
         *               - type
         *               - jurisdiction
         *               - effectiveDate
         *             properties:
         *               reference:
         *                 type: string
         *                 example: "§ 123 BGB"
         *               title:
         *                 type: string
         *                 example: "Beispielparagraph"
         *               content:
         *                 type: string
         *                 example: "Inhalt des Paragraphen..."
         *               type:
         *                 type: string
         *                 enum: [LAW, COURT_DECISION, REGULATION]
         *               jurisdiction:
         *                 type: string
         *                 example: "Deutschland"
         *               effectiveDate:
         *                 type: string
         *                 format: date
         *               tags:
         *                 type: array
         *                 items:
         *                   type: string
         *     responses:
         *       201:
         *         description: Rechtstext erfolgreich hinzugefügt
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       403:
         *         $ref: '#/components/responses/AuthorizationError'
         */
        this.addLegalContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            if (userType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert für das Hinzufügen von Rechtsinhalten');
            }
            const { reference, title, content, type, jurisdiction, effectiveDate, tags } = req.body;
            const legalContent = await this.knowledgeService.addLegalContent({
                reference,
                title,
                content,
                type,
                jurisdiction,
                effectiveDate: new Date(effectiveDate),
                tags
            });
            res.status(201).json({
                success: true,
                data: legalContent,
                message: 'Rechtstext erfolgreich hinzugefügt'
            });
        });
        /**
         * @swagger
         * /api/knowledge/update/{reference}:
         *   put:
         *     summary: Bestehenden Rechtstext aktualisieren (nur für Business-Benutzer)
         *     tags: [Legal Knowledge]
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
         *             properties:
         *               title:
         *                 type: string
         *               content:
         *                 type: string
         *               jurisdiction:
         *                 type: string
         *               effectiveDate:
         *                 type: string
         *                 format: date
         *               tags:
         *                 type: array
         *                 items:
         *                   type: string
         *     responses:
         *       200:
         *         description: Rechtstext erfolgreich aktualisiert
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       403:
         *         $ref: '#/components/responses/AuthorizationError'
         *       404:
         *         $ref: '#/components/responses/NotFoundError'
         */
        this.updateLegalContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            const { reference } = req.params;
            if (userType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert für das Aktualisieren von Rechtsinhalten');
            }
            const updateData = {};
            if (req.body.title)
                updateData.title = req.body.title;
            if (req.body.content)
                updateData.content = req.body.content;
            if (req.body.jurisdiction)
                updateData.jurisdiction = req.body.jurisdiction;
            if (req.body.effectiveDate)
                updateData.effectiveDate = new Date(req.body.effectiveDate);
            if (req.body.tags)
                updateData.tags = req.body.tags;
            const updatedContent = await this.knowledgeService.updateLegalContent(reference, updateData);
            res.json({
                success: true,
                data: updatedContent,
                message: 'Rechtstext erfolgreich aktualisiert'
            });
        });
        /**
         * @swagger
         * /api/knowledge/delete/{reference}:
         *   delete:
         *     summary: Rechtstext löschen (nur für Business-Benutzer)
         *     tags: [Legal Knowledge]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: reference
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Rechtstext erfolgreich gelöscht
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       403:
         *         $ref: '#/components/responses/AuthorizationError'
         *       404:
         *         $ref: '#/components/responses/NotFoundError'
         */
        this.deleteLegalContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            const { reference } = req.params;
            if (userType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert für das Löschen von Rechtsinhalten');
            }
            await this.knowledgeService.deleteLegalContent(reference);
            res.json({
                success: true,
                message: 'Rechtstext erfolgreich gelöscht'
            });
        });
        /**
         * @swagger
         * /api/knowledge/health:
         *   get:
         *     summary: Health Check für Rechtsdatenbank
         *     tags: [Legal Knowledge]
         *     responses:
         *       200:
         *         description: Health Status
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
         *                     elasticsearch:
         *                       type: boolean
         *                     database:
         *                       type: boolean
         */
        this.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const health = await this.knowledgeService.healthCheck();
            res.json({
                success: true,
                data: health
            });
        });
        /**
         * @swagger
         * /api/knowledge/initialize:
         *   post:
         *     summary: Elasticsearch Index initialisieren (nur für Business-Benutzer)
         *     tags: [Legal Knowledge]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Index erfolgreich initialisiert
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       403:
         *         $ref: '#/components/responses/AuthorizationError'
         */
        this.initializeIndex = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            if (userType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert für Index-Initialisierung');
            }
            await this.knowledgeService.initializeIndex();
            res.json({
                success: true,
                message: 'Elasticsearch Index erfolgreich initialisiert'
            });
        });
        this.knowledgeService = new KnowledgeService_1.KnowledgeService(database_1.prisma);
    }
}
exports.KnowledgeController = KnowledgeController;
