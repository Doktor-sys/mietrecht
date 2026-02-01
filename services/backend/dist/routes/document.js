"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const DocumentController_1 = require("../controllers/DocumentController");
const auth_1 = require("../middleware/auth");
const config_1 = require("../config/config");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: config_1.config.upload.maxFileSize
    },
    fileFilter: (req, file, cb) => {
        if (config_1.config.upload.allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} is not allowed`));
        }
    }
});
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Dokument hochladen
 *     tags: [Document Analysis]
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
 *               - documentType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
 *               caseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dokument erfolgreich hochgeladen
 *       400:
 *         description: Ungültiges Dateiformat
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/upload', upload.single('file'), DocumentController_1.DocumentController.uploadDocument);
/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Dokumente des Nutzers abrufen
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Dokumente
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/', DocumentController_1.DocumentController.getUserDocuments);
/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Speicherstatistiken abrufen
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Speicherstatistiken
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/stats', DocumentController_1.DocumentController.getStorageStats);
/**
 * @swagger
 * /api/documents/{documentId}:
 *   get:
 *     summary: Spezifisches Dokument abrufen
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dokumentdetails
 *       404:
 *         description: Dokument nicht gefunden
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/:documentId', DocumentController_1.DocumentController.getDocument);
/**
 * @swagger
 * /api/documents/{documentId}/download:
 *   get:
 *     summary: Dokument herunterladen
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dokumentdatei
 *       404:
 *         description: Dokument nicht gefunden
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/:documentId/download', DocumentController_1.DocumentController.downloadDocument);
/**
 * @swagger
 * /api/documents/{documentId}:
 *   delete:
 *     summary: Dokument löschen
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dokument erfolgreich gelöscht
 *       404:
 *         description: Dokument nicht gefunden
 *       401:
 *         description: Nicht authentifiziert
 */
router.delete('/:documentId', DocumentController_1.DocumentController.deleteDocument);
/**
 * @swagger
 * /api/documents/{documentId}/extract-text:
 *   post:
 *     summary: Text aus Dokument extrahieren (OCR)
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Text erfolgreich extrahiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/extract-text', DocumentController_1.DocumentController.extractText);
/**
 * @swagger
 * /api/documents/{documentId}/analyze-rental-contract:
 *   post:
 *     summary: Mietvertrag analysieren
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mietvertrag erfolgreich analysiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/analyze-rental-contract', DocumentController_1.DocumentController.analyzeRentalContract);
/**
 * @swagger
 * /api/documents/{documentId}/analyze-utility-bill:
 *   post:
 *     summary: Nebenkostenabrechnung analysieren
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nebenkostenabrechnung erfolgreich analysiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/analyze-utility-bill', DocumentController_1.DocumentController.analyzeUtilityBill);
/**
 * @swagger
 * /api/documents/{documentId}/analyze-warning-letter:
 *   post:
 *     summary: Abmahnung analysieren
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Abmahnung erfolgreich analysiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/analyze-warning-letter', DocumentController_1.DocumentController.analyzeWarningLetter);
/**
 * @swagger
 * /api/documents/{documentId}/analyze:
 *   post:
 *     summary: Dokument analysieren (wird in Task 5.3 implementiert)
 *     tags: [Document Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analyse erfolgreich durchgeführt
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/analyze', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Document Analysis wird in Task 5.3 implementiert',
        },
    });
});
/**
 * @swagger
 * /api/documents/{documentId}/versions:
 *   get:
 *     summary: Get document versions
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document versions retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Document not found
 */
router.get('/:documentId/versions', DocumentController_1.DocumentController.getDocumentVersions);
/**
 * @swagger
 * /api/documents/{documentId}/annotations:
 *   post:
 *     summary: Eine neue Annotation zu einem Dokument hinzufügen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
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
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Der Text der Annotation
 *               type:
 *                 type: string
 *                 enum: [COMMENT, HIGHLIGHT, STRIKETHROUGH, UNDERLINE, NOTE]
 *                 description: Der Typ der Annotation
 *               parentId:
 *                 type: string
 *                 description: Die ID der übergeordneten Annotation (für Antworten)
 *               page:
 *                 type: integer
 *                 description: Die Seitenzahl, auf der die Annotation platziert ist
 *               positionX:
 *                 type: number
 *                 format: float
 *                 description: Die X-Position der Annotation
 *               positionY:
 *                 type: number
 *                 format: float
 *                 description: Die Y-Position der Annotation
 *     responses:
 *       200:
 *         description: Annotation erfolgreich erstellt
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/annotations', DocumentController_1.DocumentController.createAnnotation);
/**
 * @swagger
 * /api/documents/{documentId}/annotations:
 *   get:
 *     summary: Annotationen für ein Dokument abrufen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Ob Antworten auf Annotationen eingeschlossen werden sollen
 *     responses:
 *       200:
 *         description: Annotationen erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.get('/:documentId/annotations', DocumentController_1.DocumentController.getDocumentAnnotations);
/**
 * @swagger
 * /api/documents/annotations/{annotationId}:
 *   put:
 *     summary: Eine Annotation aktualisieren
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: annotationId
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
 *               text:
 *                 type: string
 *                 description: Der aktualisierte Text der Annotation
 *               resolved:
 *                 type: boolean
 *                 description: Ob die Annotation als gelöst markiert ist
 *     responses:
 *       200:
 *         description: Annotation erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Annotation nicht gefunden
 */
router.put('/annotations/:annotationId', DocumentController_1.DocumentController.updateAnnotation);
/**
 * @swagger
 * /api/documents/annotations/{annotationId}:
 *   delete:
 *     summary: Eine Annotation löschen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Annotation erfolgreich gelöscht
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Annotation nicht gefunden
 */
router.delete('/annotations/:annotationId', DocumentController_1.DocumentController.deleteAnnotation);
/**
 * @swagger
 * /api/documents/annotations/{annotationId}/resolve:
 *   post:
 *     summary: Eine Annotation als gelöst markieren
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Annotation erfolgreich als gelöst markiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Annotation nicht gefunden
 */
router.post('/annotations/:annotationId/resolve', DocumentController_1.DocumentController.resolveAnnotation);
/**
 * @swagger
 * /api/documents/{documentId}/upload-version:
 *   post:
 *     summary: Upload a new version of a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: New version uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Document not found
 */
router.post('/:documentId/upload-version', upload.single('file'), DocumentController_1.DocumentController.uploadDocumentVersion);
/**
 * @swagger
 * /api/documents/{documentId}/share:
 *   post:
 *     summary: Dokument mit einem anderen Benutzer teilen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
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
 *               - sharedWithEmail
 *             properties:
 *               sharedWithEmail:
 *                 type: string
 *                 format: email
 *               permission:
 *                 type: string
 *                 enum: [READ, WRITE, COMMENT]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Dokument erfolgreich geteilt
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/:documentId/share', DocumentController_1.DocumentController.shareDocument);
/**
 * @swagger
 * /api/documents/{documentId}/shares:
 *   get:
 *     summary: Alle Freigaben für ein Dokument abrufen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Freigaben erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.get('/:documentId/shares', DocumentController_1.DocumentController.getDocumentShares);
/**
 * @swagger
 * /api/documents/shared:
 *   get:
 *     summary: Mit dem Benutzer geteilte Dokumente abrufen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geteilte Dokumente erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/shared', DocumentController_1.DocumentController.getSharedDocuments);
/**
 * @swagger
 * /api/documents/shares/{shareId}:
 *   put:
 *     summary: Freigabeeinstellungen aktualisieren
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
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
 *               permission:
 *                 type: string
 *                 enum: [READ, WRITE, COMMENT]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Freigabe erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Freigabe nicht gefunden
 */
router.put('/shares/:shareId', DocumentController_1.DocumentController.updateShare);
/**
 * @swagger
 * /api/documents/shares/{shareId}:
 *   delete:
 *     summary: Freigabe entfernen
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Freigabe erfolgreich entfernt
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Freigabe nicht gefunden
 */
router.delete('/shares/:shareId', DocumentController_1.DocumentController.removeShare);
/**
 * @swagger
 * /api/documents/search:
 *   get:
 *     summary: Dokumente durchsuchen und filtern
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Suchbegriff für Dateinamen oder Dokumentinhalte
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
 *         description: Dokumenttyp filtern
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Startdatum für Upload-Datum-Bereich
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Enddatum für Upload-Datum-Bereich
 *       - in: query
 *         name: minRiskLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Minimales Risikoniveau
 *       - in: query
 *         name: maxRiskLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Maximales Risikoniveau
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [uploadedAt, originalName, size]
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
 *           default: 1
 *         description: Seitennummer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Anzahl der Ergebnisse pro Seite
 *     responses:
 *       200:
 *         description: Gefundene Dokumente
 *       401:
 *         description: Nicht authentifiziert
 */
/**
 * @swagger
 * /api/documents/{documentId}/status:
 *   post:
 *     summary: Change document status through workflow
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [SUBMIT_FOR_REVIEW, APPROVE, REJECT, REQUEST_CHANGES, ARCHIVE, RESTORE]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document status updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Document not found
 */
router.post('/:documentId/status', DocumentController_1.DocumentController.transitionDocumentStatus);
/**
 * @swagger
 * /api/documents/{documentId}/workflow-history:
 *   get:
 *     summary: Get document workflow history
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow history retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Document not found
 */
router.get('/:documentId/workflow-history', DocumentController_1.DocumentController.getDocumentWorkflowHistory);
/**
 * @swagger
 * /api/documents/workflow-rules:
 *   get:
 *     summary: Get all workflow rules
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workflow rules retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/workflow-rules', DocumentController_1.DocumentController.getWorkflowRules);
/**
 * @swagger
 * /api/documents/workflow-rules:
 *   post:
 *     summary: Create a new workflow rule
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - triggerEvent
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               triggerEvent:
 *                 type: string
 *               condition:
 *                 type: string
 *               action:
 *                 type: string
 *               actionParams:
 *                 type: object
 *     responses:
 *       201:
 *         description: Workflow rule created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 */
router.post('/workflow-rules', DocumentController_1.DocumentController.createWorkflowRule);
/**
 * @swagger
 * /api/documents/workflow-rules/{ruleId}:
 *   put:
 *     summary: Update a workflow rule
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               triggerEvent:
 *                 type: string
 *               condition:
 *                 type: string
 *               action:
 *                 type: string
 *               actionParams:
 *                 type: object
 *               enabled:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Workflow rule updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Rule not found
 */
router.put('/workflow-rules/:ruleId', DocumentController_1.DocumentController.updateWorkflowRule);
/**
 * @swagger
 * /api/documents/workflow-rules/{ruleId}:
 *   delete:
 *     summary: Delete a workflow rule
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow rule deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Rule not found
 */
router.delete('/workflow-rules/:ruleId', DocumentController_1.DocumentController.deleteWorkflowRule);
exports.default = router;
