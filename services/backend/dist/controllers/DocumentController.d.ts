import { Request, Response, NextFunction } from 'express';
export declare class DocumentController {
    /**
     * @swagger
     * /api/documents/upload:
     *   post:
     *     summary: Dokument hochladen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *               documentType:
     *                 type: string
     *                 enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
     *               caseId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       201:
     *         description: Dokument erfolgreich hochgeladen
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Document'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    static uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @swagger
     * /api/documents:
     *   get:
     *     summary: Benutzerdokumente abrufen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Dokumente erfolgreich abgerufen
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
     *                     $ref: '#/components/schemas/Document'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    static getUserDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @swagger
     * /api/documents/search:
     *   get:
     *     summary: Dokumente suchen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: query
     *         schema:
     *           type: string
     *         description: Suchbegriff
     *       - in: query
     *         name: documentType
     *         schema:
     *           type: string
     *           enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
     *         description: Dokumenttyp
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Startdatum
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Enddatum
     *       - in: query
     *         name: minRiskLevel
     *         schema:
     *           type: integer
     *           minimum: 0
     *           maximum: 10
     *         description: Minimale Risikostufe
     *       - in: query
     *         name: maxRiskLevel
     *         schema:
     *           type: integer
     *           minimum: 0
     *           maximum: 10
     *         description: Maximale Risikostufe
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [uploadedAt, originalName, documentType]
     *         description: Sortierfeld
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *         description: Sortierreihenfolge
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Seitennummer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Anzahl der Ergebnisse pro Seite
     *     responses:
     *       200:
     *         description: Dokumente erfolgreich gefunden
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
     *                     $ref: '#/components/schemas/Document'
     *                 pagination:
     *                   type: object
     *                   properties:
     *                     page:
     *                       type: integer
     *                     limit:
     *                       type: integer
     *                     totalCount:
     *                       type: integer
     *                     totalPages:
     *                       type: integer
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    static searchDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @swagger
     * /api/documents/{documentId}:
     *   get:
     *     summary: Einzelnes Dokument abrufen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: documentId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Dokument-ID
     *     responses:
     *       200:
     *         description: Dokument erfolgreich abgerufen
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Document'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    static getDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get document versions
     */
    static getDocumentVersions(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Upload a new version of a document
     */
    static uploadDocumentVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @swagger
     * /api/documents/{documentId}/download:
     *   get:
     *     summary: Dokument herunterladen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: documentId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Dokument-ID
     *     responses:
     *       200:
     *         description: Dokument erfolgreich heruntergeladen
     *         content:
     *           application/pdf:
     *             schema:
     *               type: string
     *               format: binary
     *           image/*:
     *             schema:
     *               type: string
     *               format: binary
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    static downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @swagger
     * /api/documents/{documentId}:
     *   delete:
     *     summary: Dokument löschen
     *     tags: [Document Processing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: documentId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Dokument-ID
     *     responses:
     *       200:
     *         description: Dokument erfolgreich gelöscht
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Document deleted successfully"
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    static deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get storage statistics
     */
    static getStorageStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Extract text from document using OCR
     */
    static extractText(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Analyze rental contract document
     */
    static analyzeRentalContract(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Analyze utility bill document
     */
    static analyzeUtilityBill(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Analyze warning letter document
     */
    static analyzeWarningLetter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Share a document
     */
    static shareDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get document shares
     */
    static getDocumentShares(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get shared documents
     */
    static getSharedDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a share
     */
    static updateShare(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Remove a share
     */
    static removeShare(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a document annotation
     */
    static createAnnotation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get document annotations
     */
    static getDocumentAnnotations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a document annotation
     */
    static updateAnnotation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete a document annotation
     */
    static deleteAnnotation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Resolve a document annotation
     */
    static resolveAnnotation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Transition document status
     */
    static transitionDocumentStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get document workflow history
     */
    static getDocumentWorkflowHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all workflow rules
     */
    static getWorkflowRules(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a workflow rule
     */
    static createWorkflowRule(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a workflow rule
     */
    static updateWorkflowRule(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete a workflow rule
     */
    static deleteWorkflowRule(req: Request, res: Response, next: NextFunction): Promise<void>;
}
