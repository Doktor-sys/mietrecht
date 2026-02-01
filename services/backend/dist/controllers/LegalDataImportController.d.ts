import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare class LegalDataImportController {
    private importService;
    private updateService;
    constructor(prisma: PrismaClient);
    /**
     * POST /api/legal-data/import
     * Importiert Rechtsdaten aus JSON-Body
     */
    importData(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/import/file
     * Importiert Rechtsdaten aus hochgeladener JSON-Datei
     */
    importFromFile(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/import/bgb
     * Importiert BGB-Paragraphen
     */
    importBGB(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/import/court-decisions
     * Importiert Gerichtsentscheidungen
     */
    importCourtDecisions(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/legal-data/:reference
     * Aktualisiert bestehende Rechtsdaten
     */
    updateData(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/legal-data/outdated
     * Löscht veraltete Rechtsdaten
     */
    deleteOutdated(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/legal-data/duplicates
     * Findet Duplikate
     */
    findDuplicates(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/duplicates/cleanup
     * Bereinigt Duplikate
     */
    cleanupDuplicates(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/legal-data/statistics
     * Ruft Statistiken ab
     */
    getStatistics(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/legal-data/updates/check
     * Prüft auf verfügbare Updates
     */
    checkUpdates(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/updates/auto
     * Führt automatisches Update durch
     */
    performAutoUpdate(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/legal-data/updates/sync/:sourceName
     * Synchronisiert eine spezifische Quelle
     */
    syncSource(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/legal-data/updates/sources
     * Ruft Update-Quellen ab
     */
    getUpdateSources(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/legal-data/updates/sources/:sourceName
     * Aktiviert/Deaktiviert eine Update-Quelle
     */
    toggleUpdateSource(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/legal-data/outdated
     * Findet veraltete Rechtsdaten
     */
    findOutdated(req: Request, res: Response): Promise<void>;
}
