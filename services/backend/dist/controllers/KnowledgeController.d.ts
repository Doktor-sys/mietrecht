import { Request, Response } from 'express';
export declare class KnowledgeController {
    private knowledgeService;
    constructor();
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
    getLegalText: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    findSimilarContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    updateKnowledgeBase: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    addLegalContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    updateLegalContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    deleteLegalContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
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
    initializeIndex: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
