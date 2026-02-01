"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MietspiegelController = void 0;
const MietspiegelService_1 = require("../services/MietspiegelService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class MietspiegelController {
    constructor(prisma) {
        this.mietspiegelService = new MietspiegelService_1.MietspiegelService(prisma);
    }
    /**
     * GET /api/mietspiegel/:city
     * Ruft Mietspiegel-Daten für eine Stadt ab
     */
    async getMietspiegelData(req, res) {
        try {
            const { city } = req.params;
            const { year } = req.query;
            if (!city) {
                throw new errorHandler_1.ValidationError('Stadt ist erforderlich');
            }
            const yearNumber = year ? parseInt(year) : undefined;
            const data = await this.mietspiegelService.getMietspiegelData(city, yearNumber);
            if (!data) {
                throw new errorHandler_1.NotFoundError(`Keine Mietspiegel-Daten für ${city} verfügbar`);
            }
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen der Mietspiegel-Daten:', error);
            throw error;
        }
    }
    /**
     * POST /api/mietspiegel/calculate-rent
     * Berechnet Mietpreis-Range basierend auf Wohnungsdetails
     */
    async calculateRentRange(req, res) {
        try {
            const { city, apartmentDetails } = req.body;
            if (!city) {
                throw new errorHandler_1.ValidationError('Stadt ist erforderlich');
            }
            if (!apartmentDetails) {
                throw new errorHandler_1.ValidationError('Wohnungsdetails sind erforderlich');
            }
            // Validiere Apartment Details
            this.validateApartmentDetails(apartmentDetails);
            const calculation = await this.mietspiegelService.calculateRentRange(city, apartmentDetails);
            res.json({
                success: true,
                data: calculation
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler bei der Mietpreis-Berechnung:', error);
            throw error;
        }
    }
    /**
     * GET /api/mietspiegel/:city/regulations
     * Ruft lokale Bestimmungen für eine Stadt ab
     */
    async getLocalRegulations(req, res) {
        try {
            const { city } = req.params;
            if (!city) {
                throw new errorHandler_1.ValidationError('Stadt ist erforderlich');
            }
            const regulations = await this.mietspiegelService.getLocalRegulations(city);
            res.json({
                success: true,
                data: regulations
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen lokaler Bestimmungen:', error);
            throw error;
        }
    }
    /**
     * POST /api/mietspiegel/compare-rent
     * Vergleicht aktuelle Miete mit Mietspiegel
     */
    async compareMietWithMietspiegel(req, res) {
        try {
            const { city, currentRent, apartmentDetails } = req.body;
            if (!city) {
                throw new errorHandler_1.ValidationError('Stadt ist erforderlich');
            }
            if (!currentRent || currentRent <= 0) {
                throw new errorHandler_1.ValidationError('Gültige aktuelle Miete ist erforderlich');
            }
            if (!apartmentDetails) {
                throw new errorHandler_1.ValidationError('Wohnungsdetails sind erforderlich');
            }
            this.validateApartmentDetails(apartmentDetails);
            const comparison = await this.mietspiegelService.compareMietWithMietspiegel(city, currentRent, apartmentDetails);
            res.json({
                success: true,
                data: comparison
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Mietvergleich:', error);
            throw error;
        }
    }
    /**
     * GET /api/mietspiegel/cities
     * Ruft verfügbare Städte mit Mietspiegel-Daten ab
     */
    async getAvailableCities(req, res) {
        try {
            const cities = await this.mietspiegelService.getAvailableCities();
            res.json({
                success: true,
                data: cities
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen verfügbarer Städte:', error);
            throw error;
        }
    }
    /**
     * PUT /api/mietspiegel/update
     * Aktualisiert Mietspiegel-Daten (Admin-Funktion)
     */
    async updateMietspiegelData(req, res) {
        try {
            const updateData = req.body;
            if (!updateData.city) {
                throw new errorHandler_1.ValidationError('Stadt ist erforderlich');
            }
            if (!updateData.year) {
                throw new errorHandler_1.ValidationError('Jahr ist erforderlich');
            }
            if (!updateData.averageRent || updateData.averageRent <= 0) {
                throw new errorHandler_1.ValidationError('Gültige Durchschnittsmiete ist erforderlich');
            }
            const updatedData = await this.mietspiegelService.updateMietspiegelData(updateData);
            res.json({
                success: true,
                data: updatedData,
                message: 'Mietspiegel-Daten erfolgreich aktualisiert'
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Aktualisieren der Mietspiegel-Daten:', error);
            throw error;
        }
    }
    /**
     * Private Hilfsmethoden
     */
    validateApartmentDetails(details) {
        const errors = [];
        if (!details.size || details.size <= 0) {
            errors.push('Wohnungsgröße muss größer als 0 sein');
        }
        if (!details.rooms || details.rooms <= 0) {
            errors.push('Anzahl Zimmer muss größer als 0 sein');
        }
        if (details.constructionYear && (details.constructionYear < 1800 || details.constructionYear > new Date().getFullYear())) {
            errors.push('Baujahr muss zwischen 1800 und heute liegen');
        }
        if (details.condition && !['simple', 'normal', 'good', 'excellent'].includes(details.condition)) {
            errors.push('Zustand muss einer der folgenden Werte sein: simple, normal, good, excellent');
        }
        if (details.location && !['peripheral', 'normal', 'central', 'premium'].includes(details.location)) {
            errors.push('Lage muss einer der folgenden Werte sein: peripheral, normal, central, premium');
        }
        if (details.heatingType && !['central', 'individual', 'district'].includes(details.heatingType)) {
            errors.push('Heizungstyp muss einer der folgenden Werte sein: central, individual, district');
        }
        if (details.energyClass && !['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(details.energyClass)) {
            errors.push('Energieklasse muss zwischen A+ und H liegen');
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
}
exports.MietspiegelController = MietspiegelController;
