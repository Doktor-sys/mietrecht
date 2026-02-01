"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDataImportController = exports.upload = void 0;
const LegalDataImportService_1 = require("../services/LegalDataImportService");
const LegalDataUpdateService_1 = require("../services/LegalDataUpdateService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Multer-Konfiguration für File-Upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/legal-data/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'legal-import-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, true);
        }
        else {
            cb(new Error('Nur JSON-Dateien sind erlaubt'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
class LegalDataImportController {
    constructor(prisma) {
        this.importService = new LegalDataImportService_1.LegalDataImportService(prisma);
        this.updateService = new LegalDataUpdateService_1.LegalDataUpdateService(prisma);
    }
    /**
     * POST /api/legal-data/import
     * Importiert Rechtsdaten aus JSON-Body
     */
    async importData(req, res) {
        try {
            const { data, options } = req.body;
            if (!data || !Array.isArray(data)) {
                throw new errorHandler_1.ValidationError('Daten müssen ein Array sein');
            }
            const importOptions = {
                skipDuplicates: options?.skipDuplicates || false,
                updateExisting: options?.updateExisting !== false,
                validateOnly: options?.validateOnly || false,
                batchSize: options?.batchSize || 100
            };
            const result = await this.importService.importLegalData(data, importOptions);
            res.json({
                success: true,
                data: result,
                message: `Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert, ${result.failed} fehlgeschlagen`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Import:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/import/file
     * Importiert Rechtsdaten aus hochgeladener JSON-Datei
     */
    async importFromFile(req, res) {
        try {
            if (!req.file) {
                throw new errorHandler_1.ValidationError('Keine Datei hochgeladen');
            }
            const options = {
                skipDuplicates: req.body.skipDuplicates === 'true',
                updateExisting: req.body.updateExisting !== 'false',
                validateOnly: req.body.validateOnly === 'true',
                batchSize: parseInt(req.body.batchSize) || 100
            };
            const result = await this.importService.importFromFile(req.file.path, options);
            res.json({
                success: true,
                data: result,
                message: `Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Datei-Import:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/import/bgb
     * Importiert BGB-Paragraphen
     */
    async importBGB(req, res) {
        try {
            const { paragraphs } = req.body;
            if (!paragraphs || !Array.isArray(paragraphs)) {
                throw new errorHandler_1.ValidationError('BGB-Paragraphen müssen ein Array sein');
            }
            const result = await this.importService.importBGBParagraphs(paragraphs);
            res.json({
                success: true,
                data: result,
                message: `BGB-Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim BGB-Import:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/import/court-decisions
     * Importiert Gerichtsentscheidungen
     */
    async importCourtDecisions(req, res) {
        try {
            const { decisions } = req.body;
            if (!decisions || !Array.isArray(decisions)) {
                throw new errorHandler_1.ValidationError('Gerichtsentscheidungen müssen ein Array sein');
            }
            const result = await this.importService.importCourtDecisions(decisions);
            res.json({
                success: true,
                data: result,
                message: `Gerichtsentscheidungen importiert: ${result.imported} neu, ${result.updated} aktualisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Import von Gerichtsentscheidungen:', error);
            throw error;
        }
    }
    /**
     * PUT /api/legal-data/:reference
     * Aktualisiert bestehende Rechtsdaten
     */
    async updateData(req, res) {
        try {
            const { reference } = req.params;
            const updates = req.body;
            const result = await this.importService.updateLegalData(reference, updates);
            res.json({
                success: true,
                data: result,
                message: `Rechtsdaten ${reference} erfolgreich aktualisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Aktualisieren:', error);
            throw error;
        }
    }
    /**
     * DELETE /api/legal-data/outdated
     * Löscht veraltete Rechtsdaten
     */
    async deleteOutdated(req, res) {
        try {
            const { olderThanDays } = req.query;
            const days = parseInt(olderThanDays) || 365;
            const olderThan = new Date();
            olderThan.setDate(olderThan.getDate() - days);
            const count = await this.importService.deleteOutdatedData(olderThan);
            res.json({
                success: true,
                data: { count },
                message: `${count} veraltete Einträge gelöscht`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Löschen veralteter Daten:', error);
            throw error;
        }
    }
    /**
     * GET /api/legal-data/duplicates
     * Findet Duplikate
     */
    async findDuplicates(req, res) {
        try {
            const duplicates = await this.importService.findDuplicates();
            res.json({
                success: true,
                data: duplicates,
                message: `${duplicates.length} Duplikate gefunden`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Suchen nach Duplikaten:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/duplicates/cleanup
     * Bereinigt Duplikate
     */
    async cleanupDuplicates(req, res) {
        try {
            const count = await this.importService.cleanupDuplicates();
            res.json({
                success: true,
                data: { count },
                message: `${count} Duplikate bereinigt`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Bereinigen von Duplikaten:', error);
            throw error;
        }
    }
    /**
     * GET /api/legal-data/statistics
     * Ruft Statistiken ab
     */
    async getStatistics(req, res) {
        try {
            const stats = await this.importService.getStatistics();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen der Statistiken:', error);
            throw error;
        }
    }
    /**
     * GET /api/legal-data/updates/check
     * Prüft auf verfügbare Updates
     */
    async checkUpdates(req, res) {
        try {
            const updateCheck = await this.updateService.checkForUpdates();
            res.json({
                success: true,
                data: updateCheck
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Prüfen auf Updates:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/updates/auto
     * Führt automatisches Update durch
     */
    async performAutoUpdate(req, res) {
        try {
            const result = await this.updateService.performAutoUpdate();
            res.json({
                success: result.success,
                data: result,
                message: `Auto-Update abgeschlossen: ${result.sourcesUpdated} Quellen aktualisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim automatischen Update:', error);
            throw error;
        }
    }
    /**
     * POST /api/legal-data/updates/sync/:sourceName
     * Synchronisiert eine spezifische Quelle
     */
    async syncSource(req, res) {
        try {
            const { sourceName } = req.params;
            const result = await this.updateService.syncSource(sourceName);
            res.json({
                success: result.success,
                data: result,
                message: `${sourceName} erfolgreich synchronisiert`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Synchronisieren:', error);
            throw error;
        }
    }
    /**
     * GET /api/legal-data/updates/sources
     * Ruft Update-Quellen ab
     */
    async getUpdateSources(req, res) {
        try {
            const sources = this.updateService.getUpdateSources();
            res.json({
                success: true,
                data: sources
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen der Update-Quellen:', error);
            throw error;
        }
    }
    /**
     * PUT /api/legal-data/updates/sources/:sourceName
     * Aktiviert/Deaktiviert eine Update-Quelle
     */
    async toggleUpdateSource(req, res) {
        try {
            const { sourceName } = req.params;
            const { enabled } = req.body;
            this.updateService.toggleUpdateSource(sourceName, enabled);
            res.json({
                success: true,
                message: `Update-Quelle ${sourceName} ${enabled ? 'aktiviert' : 'deaktiviert'}`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Umschalten der Update-Quelle:', error);
            throw error;
        }
    }
    /**
     * GET /api/legal-data/outdated
     * Findet veraltete Rechtsdaten
     */
    async findOutdated(req, res) {
        try {
            const { olderThanDays } = req.query;
            const days = parseInt(olderThanDays) || 365;
            const outdated = await this.updateService.findOutdatedData(days);
            res.json({
                success: true,
                data: outdated,
                message: `${outdated.length} veraltete Einträge gefunden`
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Suchen veralteter Daten:', error);
            throw error;
        }
    }
}
exports.LegalDataImportController = LegalDataImportController;
