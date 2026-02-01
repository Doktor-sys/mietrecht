import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
export declare class MietspiegelController {
    private mietspiegelService;
    constructor(prisma: PrismaClient);
    /**
     * GET /api/mietspiegel/:city
     * Ruft Mietspiegel-Daten für eine Stadt ab
     */
    getMietspiegelData(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/mietspiegel/calculate-rent
     * Berechnet Mietpreis-Range basierend auf Wohnungsdetails
     */
    calculateRentRange(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/mietspiegel/:city/regulations
     * Ruft lokale Bestimmungen für eine Stadt ab
     */
    getLocalRegulations(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/mietspiegel/compare-rent
     * Vergleicht aktuelle Miete mit Mietspiegel
     */
    compareMietWithMietspiegel(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/mietspiegel/cities
     * Ruft verfügbare Städte mit Mietspiegel-Daten ab
     */
    getAvailableCities(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/mietspiegel/update
     * Aktualisiert Mietspiegel-Daten (Admin-Funktion)
     */
    updateMietspiegelData(req: Request, res: Response): Promise<void>;
    /**
     * Private Hilfsmethoden
     */
    private validateApartmentDetails;
}
