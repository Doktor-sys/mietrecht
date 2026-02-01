"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MietspiegelService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class MietspiegelService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Ruft Mietspiegel-Daten für eine Stadt ab
     */
    async getMietspiegelData(city, year) {
        try {
            const normalizedCity = this.normalizeCity(city);
            const targetYear = year || new Date().getFullYear();
            // Cache prüfen
            const cacheKey = `mietspiegel:${normalizedCity}:${targetYear}`;
            const cachedData = await redis_1.redis.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            // Aus Datenbank laden
            let mietspiegelData = await this.prisma.mietspiegelData.findUnique({
                where: {
                    city_year: {
                        city: normalizedCity,
                        year: targetYear
                    }
                }
            });
            // Falls nicht gefunden, versuche das neueste verfügbare Jahr
            if (!mietspiegelData) {
                mietspiegelData = await this.prisma.mietspiegelData.findFirst({
                    where: { city: normalizedCity },
                    orderBy: { year: 'desc' }
                });
            }
            if (mietspiegelData) {
                // Cache für 1 Stunde
                await redis_1.redis.set(cacheKey, mietspiegelData, 3600);
            }
            return mietspiegelData;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen der Mietspiegel-Daten:', error);
            throw error;
        }
    }
    /**
     * Berechnet Mietpreis-Range basierend auf Wohnungsdetails
     */
    async calculateRentRange(city, apartmentDetails) {
        try {
            // Validiere Eingabedaten
            this.validateApartmentDetails(apartmentDetails);
            const normalizedCity = this.normalizeCity(city);
            const mietspiegelData = await this.getMietspiegelData(normalizedCity);
            if (!mietspiegelData) {
                throw new errorHandler_1.NotFoundError(`Keine Mietspiegel-Daten für ${city} verfügbar`);
            }
            // Basis-Mietpreis aus Mietspiegel
            const baseRent = mietspiegelData.averageRent;
            // Berechne Faktoren
            const factors = this.calculateRentFactors(apartmentDetails, mietspiegelData);
            // Berechne angepasste Miete
            const adjustedRent = baseRent * factors.sizeFactor * factors.locationFactor *
                factors.conditionFactor * factors.ageFactor * factors.featureFactor;
            // Bestimme Range basierend auf Mietspiegel-Daten
            const rentRanges = mietspiegelData.rentRanges;
            const applicableRange = this.findApplicableRange(apartmentDetails, rentRanges);
            const calculatedRent = {
                min: applicableRange ? applicableRange.minRent : adjustedRent * 0.8,
                max: applicableRange ? applicableRange.maxRent : adjustedRent * 1.2,
                average: adjustedRent,
                recommended: Math.round(adjustedRent * 100) / 100
            };
            // Vergleich mit Durchschnitt
            const comparison = {
                belowAverage: adjustedRent < baseRent,
                aboveAverage: adjustedRent > baseRent,
                withinRange: adjustedRent >= calculatedRent.min && adjustedRent <= calculatedRent.max,
                percentageDeviation: Math.round(((adjustedRent - baseRent) / baseRent) * 100)
            };
            // Lokale Bestimmungen
            const applicableRegulations = await this.getApplicableRegulations(normalizedCity, adjustedRent, baseRent);
            // Empfehlungen generieren
            const recommendations = this.generateRecommendations(apartmentDetails, calculatedRent, comparison, applicableRegulations);
            const result = {
                city: normalizedCity,
                year: mietspiegelData.year,
                apartmentDetails,
                calculatedRent,
                comparison,
                factors,
                applicableRegulations: applicableRegulations.map(reg => reg.title),
                recommendations
            };
            // Log Berechnung
            logger_1.loggers.businessEvent('RENT_CALCULATION_PERFORMED', '', {
                city: normalizedCity,
                size: apartmentDetails.size,
                calculatedRent: calculatedRent.recommended
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Fehler bei der Mietpreis-Berechnung:', error);
            throw error;
        }
    }
    /**
     * Ruft lokale Bestimmungen für eine Stadt ab
     */
    async getLocalRegulations(city) {
        try {
            const normalizedCity = this.normalizeCity(city);
            // Cache prüfen
            const cacheKey = `regulations:${normalizedCity}`;
            const cachedRegulations = await redis_1.redis.get(cacheKey);
            if (cachedRegulations) {
                return cachedRegulations;
            }
            // Lokale Bestimmungen basierend auf Stadt
            const regulations = this.getRegulationsForCity(normalizedCity);
            // Cache für 24 Stunden
            await redis_1.redis.set(cacheKey, regulations, 24 * 60 * 60);
            return regulations;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen lokaler Bestimmungen:', error);
            throw error;
        }
    }
    /**
     * Aktualisiert Mietspiegel-Daten
     */
    async updateMietspiegelData(update) {
        try {
            const normalizedCity = this.normalizeCity(update.city);
            // Validiere Update-Daten
            this.validateMietspiegelUpdate(update);
            // Upsert in Datenbank
            const updatedData = await this.prisma.mietspiegelData.upsert({
                where: {
                    city_year: {
                        city: normalizedCity,
                        year: update.year
                    }
                },
                update: {
                    averageRent: update.averageRent,
                    rentRanges: update.rentRanges,
                    specialRegulations: update.specialRegulations,
                    lastUpdated: update.lastUpdated
                },
                create: {
                    city: normalizedCity,
                    year: update.year,
                    averageRent: update.averageRent,
                    rentRanges: update.rentRanges,
                    specialRegulations: update.specialRegulations,
                    lastUpdated: update.lastUpdated
                }
            });
            // Cache invalidieren
            await this.invalidateCityCache(normalizedCity);
            logger_1.loggers.businessEvent('MIETSPIEGEL_UPDATED', '', {
                city: normalizedCity,
                year: update.year,
                averageRent: update.averageRent
            });
            return updatedData;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Aktualisieren der Mietspiegel-Daten:', error);
            throw error;
        }
    }
    /**
     * Ruft verfügbare Städte mit Mietspiegel-Daten ab
     */
    async getAvailableCities() {
        try {
            // Cache prüfen
            const cacheKey = 'available_cities';
            const cachedCities = await redis_1.redis.get(cacheKey);
            if (cachedCities) {
                return cachedCities;
            }
            // Aus Datenbank laden
            const cities = await this.prisma.mietspiegelData.groupBy({
                by: ['city'],
                _count: { year: true },
                _max: { year: true, lastUpdated: true }
            });
            const cityInfos = [];
            for (const cityGroup of cities) {
                const cityData = await this.prisma.mietspiegelData.findMany({
                    where: { city: cityGroup.city },
                    select: { year: true },
                    orderBy: { year: 'desc' }
                });
                const availableYears = cityData.map(d => d.year);
                const currentYear = cityGroup._max.year || new Date().getFullYear();
                const lastUpdate = cityGroup._max.lastUpdated || new Date();
                // Bestimme Datenqualität
                const dataQuality = this.assessDataQuality(currentYear, lastUpdate);
                cityInfos.push({
                    city: cityGroup.city,
                    availableYears,
                    currentYear,
                    lastUpdate,
                    dataQuality,
                    coverage: this.getCityCoverage(cityGroup.city),
                    sampleSize: this.getCitySampleSize(cityGroup.city)
                });
            }
            // Cache für 6 Stunden
            await redis_1.redis.set(cacheKey, cityInfos, 6 * 60 * 60);
            return cityInfos;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen verfügbarer Städte:', error);
            throw error;
        }
    }
    /**
     * Vergleicht Miete mit Mietspiegel
     */
    async compareMietWithMietspiegel(city, currentRent, apartmentDetails) {
        try {
            const calculation = await this.calculateRentRange(city, apartmentDetails);
            let comparison;
            if (currentRent < calculation.calculatedRent.min) {
                comparison = 'below';
            }
            else if (currentRent > calculation.calculatedRent.max) {
                comparison = 'above';
            }
            else {
                comparison = 'within';
            }
            const deviation = currentRent - calculation.calculatedRent.average;
            const percentageDeviation = Math.round((deviation / calculation.calculatedRent.average) * 100);
            // Empfehlung basierend auf Vergleich
            let recommendation;
            let legalBasis;
            switch (comparison) {
                case 'below':
                    recommendation = 'Die Miete liegt unter dem ortsüblichen Niveau. Eine Mieterhöhung könnte möglich sein.';
                    legalBasis = '§ 558 BGB - Mieterhöhung bis zur ortsüblichen Vergleichsmiete';
                    break;
                case 'above':
                    recommendation = 'Die Miete liegt über dem ortsüblichen Niveau. Eine Mietminderung könnte berechtigt sein.';
                    legalBasis = '§ 556d BGB - Mietpreisbremse';
                    break;
                default:
                    recommendation = 'Die Miete entspricht dem ortsüblichen Niveau.';
            }
            return {
                comparison,
                deviation,
                percentageDeviation,
                recommendation,
                legalBasis
            };
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Mietvergleich:', error);
            throw error;
        }
    }
    /**
     * Private Hilfsmethoden
     */
    normalizeCity(city) {
        return city.trim()
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '')
            .replace(/^(.)/, (match) => match.toUpperCase());
    }
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
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
    calculateRentFactors(details, mietspiegelData) {
        // Größenfaktor (Economies of Scale)
        let sizeFactor = 1.0;
        if (details.size < 30)
            sizeFactor = 1.15;
        else if (details.size < 50)
            sizeFactor = 1.05;
        else if (details.size > 100)
            sizeFactor = 0.95;
        else if (details.size > 150)
            sizeFactor = 0.90;
        // Lagefaktor
        const locationFactor = {
            'peripheral': 0.85,
            'normal': 1.0,
            'central': 1.15,
            'premium': 1.30
        }[details.location || 'normal'] || 1.0;
        // Zustandsfaktor
        const conditionFactor = {
            'simple': 0.90,
            'normal': 1.0,
            'good': 1.10,
            'excellent': 1.20
        }[details.condition || 'normal'] || 1.0;
        // Altersfaktor
        let ageFactor = 1.0;
        if (details.constructionYear) {
            const age = new Date().getFullYear() - details.constructionYear;
            if (age < 5)
                ageFactor = 1.10;
            else if (age < 15)
                ageFactor = 1.05;
            else if (age > 50)
                ageFactor = 0.95;
            else if (age > 80)
                ageFactor = 0.85;
        }
        // Ausstattungsfaktor
        let featureFactor = 1.0;
        if (details.features) {
            const premiumFeatures = ['balkon', 'garten', 'garage', 'aufzug', 'fußbodenheizung'];
            const featureCount = details.features.filter(f => premiumFeatures.includes(f.toLowerCase())).length;
            featureFactor = 1.0 + (featureCount * 0.03);
        }
        return {
            sizeFactor,
            locationFactor,
            conditionFactor,
            ageFactor,
            featureFactor
        };
    }
    findApplicableRange(details, ranges) {
        // Finde passende Range basierend auf Wohnungsdetails
        for (const range of ranges) {
            const category = range.category.toLowerCase();
            // Einfache Kategoriezuordnung
            if (details.constructionYear) {
                const age = new Date().getFullYear() - details.constructionYear;
                if (age > 100 && category.includes('altbau'))
                    return range;
                if (age < 10 && category.includes('neubau'))
                    return range;
            }
            if (details.condition === 'excellent' && category.includes('gehoben'))
                return range;
            if (details.condition === 'simple' && category.includes('einfach'))
                return range;
        }
        return ranges[0] || null; // Fallback auf erste Range
    }
    async getApplicableRegulations(city, currentRent, averageRent) {
        const allRegulations = await this.getLocalRegulations(city);
        return allRegulations.filter(regulation => {
            switch (regulation.type) {
                case 'rent_brake':
                    return currentRent > averageRent * 1.1; // 10% über Durchschnitt
                case 'rent_cap':
                    return currentRent > averageRent * 1.2; // 20% über Durchschnitt
                default:
                    return true;
            }
        });
    }
    generateRecommendations(details, calculatedRent, comparison, regulations) {
        const recommendations = [];
        if (comparison.aboveAverage) {
            recommendations.push('Die berechnete Miete liegt über dem Durchschnitt. Prüfen Sie lokale Mietpreisbremse.');
        }
        if (comparison.belowAverage) {
            recommendations.push('Die berechnete Miete liegt unter dem Durchschnitt. Eine Mieterhöhung könnte möglich sein.');
        }
        if (details.constructionYear && new Date().getFullYear() - details.constructionYear > 50) {
            recommendations.push('Bei Altbauten können besondere Regelungen gelten.');
        }
        if (regulations.some(r => r.type === 'rent_brake')) {
            recommendations.push('In diesem Gebiet gilt die Mietpreisbremse.');
        }
        return recommendations;
    }
    getRegulationsForCity(city) {
        // Statische Daten für deutsche Städte
        const cityRegulations = {
            'Berlin': [
                {
                    type: 'rent_brake',
                    title: 'Mietpreisbremse Berlin',
                    description: 'Mietpreisbremse gilt in ganz Berlin',
                    effectiveDate: new Date('2015-06-01'),
                    maxIncrease: 10,
                    applicableAreas: ['Gesamtes Stadtgebiet']
                },
                {
                    type: 'modernization_limit',
                    title: 'Modernisierungsumlage-Begrenzung',
                    description: 'Begrenzung der Modernisierungsumlage auf 8% der Kosten',
                    effectiveDate: new Date('2019-01-01'),
                    maxIncrease: 8
                }
            ],
            'München': [
                {
                    type: 'rent_brake',
                    title: 'Mietpreisbremse München',
                    description: 'Verschärfte Mietpreisbremse in München',
                    effectiveDate: new Date('2015-08-01'),
                    maxIncrease: 10,
                    applicableAreas: ['Gesamtes Stadtgebiet']
                }
            ],
            'Hamburg': [
                {
                    type: 'rent_brake',
                    title: 'Mietpreisbremse Hamburg',
                    description: 'Mietpreisbremse in Hamburg',
                    effectiveDate: new Date('2015-11-01'),
                    maxIncrease: 10
                }
            ]
        };
        return cityRegulations[city] || [];
    }
    validateMietspiegelUpdate(update) {
        const errors = [];
        if (!update.city || update.city.trim().length === 0) {
            errors.push('Stadt ist erforderlich');
        }
        if (!update.year || update.year < 2000 || update.year > new Date().getFullYear() + 1) {
            errors.push('Gültiges Jahr ist erforderlich');
        }
        if (!update.averageRent || update.averageRent <= 0) {
            errors.push('Durchschnittsmiete muss größer als 0 sein');
        }
        if (!Array.isArray(update.rentRanges) || update.rentRanges.length === 0) {
            errors.push('Mindestens eine Mietspanne ist erforderlich');
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
    assessDataQuality(currentYear, lastUpdate) {
        const now = new Date();
        const yearsSinceUpdate = now.getFullYear() - currentYear;
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        if (yearsSinceUpdate <= 1 && daysSinceUpdate <= 365) {
            return 'official';
        }
        else if (yearsSinceUpdate <= 3) {
            return 'estimated';
        }
        else {
            return 'outdated';
        }
    }
    getCityCoverage(city) {
        // Statische Abdeckungsdaten (in Realität würde dies aus einer Datenbank kommen)
        const coverage = {
            'Berlin': 95,
            'München': 90,
            'Hamburg': 85,
            'Köln': 80,
            'Frankfurt': 85
        };
        return coverage[city] || 70; // Default 70%
    }
    getCitySampleSize(city) {
        // Statische Stichprobengröße (in Realität würde dies aus einer Datenbank kommen)
        const sampleSizes = {
            'Berlin': 15000,
            'München': 12000,
            'Hamburg': 8000,
            'Köln': 6000,
            'Frankfurt': 5000
        };
        return sampleSizes[city] || 1000; // Default 1000
    }
    async invalidateCityCache(city) {
        try {
            const patterns = [
                `mietspiegel:${city}:*`,
                `regulations:${city}`,
                'available_cities'
            ];
            for (const pattern of patterns) {
                const keys = await redis_1.redis.getClient().keys(pattern);
                if (keys.length > 0) {
                    await redis_1.redis.getClient().del(keys);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Fehler beim Invalidieren des City-Cache:', error);
        }
    }
}
exports.MietspiegelService = MietspiegelService;
