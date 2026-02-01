"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
const node_test_3 = require("node:test");
const MietspiegelService_1 = require("../services/MietspiegelService");
(0, node_test_2.describe)('MietspiegelService - Einfache Unit Tests', () => {
    (0, node_test_2.describe)('Validierung und Hilfsfunktionen', () => {
        let service;
        (0, node_test_3.beforeEach)(() => {
            // Erstelle Service mit Mock-Prisma (wird nicht für diese Tests verwendet)
            service = new MietspiegelService_1.MietspiegelService({});
        });
        (0, node_test_2.describe)('Apartment Details Validierung', () => {
            (0, node_test_1.it)('sollte gültige Wohnungsdetails akzeptieren', () => {
                const validDetails = {
                    size: 75,
                    rooms: 3,
                    constructionYear: 2010,
                    condition: 'good',
                    location: 'central'
                };
                // Teste private Methode über öffentliche Methode
                expect(() => {
                    // @ts-ignore - Zugriff auf private Methode für Test
                    service['validateApartmentDetails'](validDetails);
                }).not.toThrow();
            });
            (0, node_test_1.it)('sollte Fehler für ungültige Größe werfen', () => {
                const invalidDetails = {
                    size: -10,
                    rooms: 3
                };
                expect(() => {
                    // @ts-ignore - Zugriff auf private Methode für Test
                    service['validateApartmentDetails'](invalidDetails);
                }).toThrow('Wohnungsgröße muss größer als 0 sein');
            });
            (0, node_test_1.it)('sollte Fehler für ungültige Zimmeranzahl werfen', () => {
                const invalidDetails = {
                    size: 75,
                    rooms: 0
                };
                expect(() => {
                    // @ts-ignore - Zugriff auf private Methode für Test
                    service['validateApartmentDetails'](invalidDetails);
                }).toThrow('Anzahl Zimmer muss größer als 0 sein');
            });
            (0, node_test_1.it)('sollte Fehler für ungültiges Baujahr werfen', () => {
                const invalidDetails = {
                    size: 75,
                    rooms: 3,
                    constructionYear: 1700 // Zu alt
                };
                expect(() => {
                    // @ts-ignore - Zugriff auf private Methode für Test
                    service['validateApartmentDetails'](invalidDetails);
                }).toThrow('Baujahr muss zwischen 1800 und heute liegen');
            });
        });
        (0, node_test_2.describe)('Stadt-Normalisierung', () => {
            (0, node_test_1.it)('sollte Städtenamen korrekt normalisieren', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                expect(service['normalizeCity']('berlin')).toBe('Berlin');
                // @ts-ignore
                expect(service['normalizeCity']('MÜNCHEN')).toBe('Muenchen');
                // @ts-ignore
                expect(service['normalizeCity']('Düsseldorf')).toBe('Duesseldorf');
                // @ts-ignore
                expect(service['normalizeCity']('  Hamburg  ')).toBe('Hamburg');
            });
        });
        (0, node_test_2.describe)('Mietfaktoren-Berechnung', () => {
            (0, node_test_1.it)('sollte Faktoren für Standard-Wohnung korrekt berechnen', () => {
                const apartmentDetails = {
                    size: 75,
                    rooms: 3,
                    constructionYear: 2010,
                    condition: 'normal',
                    location: 'normal'
                };
                const mockMietspiegelData = {
                    id: '1',
                    city: 'Berlin',
                    year: 2024,
                    averageRent: 12.50,
                    rentRanges: [],
                    specialRegulations: [],
                    lastUpdated: new Date()
                };
                // @ts-ignore - Zugriff auf private Methode für Test
                const factors = service['calculateRentFactors'](apartmentDetails, mockMietspiegelData);
                expect(factors).toHaveProperty('sizeFactor');
                expect(factors).toHaveProperty('locationFactor');
                expect(factors).toHaveProperty('conditionFactor');
                expect(factors).toHaveProperty('ageFactor');
                expect(factors).toHaveProperty('featureFactor');
                // Standard-Werte sollten 1.0 sein
                expect(factors.locationFactor).toBe(1.0);
                expect(factors.conditionFactor).toBe(1.0);
            });
            (0, node_test_1.it)('sollte höhere Faktoren für Premium-Lage berechnen', () => {
                const apartmentDetails = {
                    size: 75,
                    rooms: 3,
                    location: 'premium',
                    condition: 'excellent',
                    features: ['balkon', 'garage', 'aufzug']
                };
                const mockMietspiegelData = {
                    id: '1',
                    city: 'Berlin',
                    year: 2024,
                    averageRent: 12.50,
                    rentRanges: [],
                    specialRegulations: [],
                    lastUpdated: new Date()
                };
                // @ts-ignore - Zugriff auf private Methode für Test
                const factors = service['calculateRentFactors'](apartmentDetails, mockMietspiegelData);
                expect(factors.locationFactor).toBe(1.30); // Premium-Lage
                expect(factors.conditionFactor).toBe(1.20); // Excellent condition
                expect(factors.featureFactor).toBeGreaterThan(1.0); // Features
            });
            (0, node_test_1.it)('sollte niedrigere Faktoren für einfache Wohnung berechnen', () => {
                const apartmentDetails = {
                    size: 25, // Kleine Wohnung
                    rooms: 1,
                    location: 'peripheral',
                    condition: 'simple',
                    constructionYear: 1920 // Alt
                };
                const mockMietspiegelData = {
                    id: '1',
                    city: 'Berlin',
                    year: 2024,
                    averageRent: 12.50,
                    rentRanges: [],
                    specialRegulations: [],
                    lastUpdated: new Date()
                };
                // @ts-ignore - Zugriff auf private Methode für Test
                const factors = service['calculateRentFactors'](apartmentDetails, mockMietspiegelData);
                expect(factors.sizeFactor).toBe(1.15); // Kleine Wohnung = höherer Faktor
                expect(factors.locationFactor).toBe(0.85); // Peripheral
                expect(factors.conditionFactor).toBe(0.90); // Simple condition
                expect(factors.ageFactor).toBe(0.95); // Alt (über 50 Jahre)
            });
        });
        (0, node_test_2.describe)('Lokale Bestimmungen', () => {
            (0, node_test_1.it)('sollte Berliner Bestimmungen korrekt zurückgeben', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                const regulations = service['getRegulationsForCity']('Berlin');
                expect(Array.isArray(regulations)).toBe(true);
                expect(regulations.length).toBeGreaterThan(0);
                const rentBrake = regulations.find(reg => reg.type === 'rent_brake');
                expect(rentBrake).toBeDefined();
                expect(rentBrake?.title).toContain('Mietpreisbremse');
                expect(rentBrake?.maxIncrease).toBe(10);
            });
            (0, node_test_1.it)('sollte Münchener Bestimmungen korrekt zurückgeben', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                const regulations = service['getRegulationsForCity']('München');
                expect(Array.isArray(regulations)).toBe(true);
                expect(regulations.length).toBeGreaterThan(0);
                const rentBrake = regulations.find(reg => reg.type === 'rent_brake');
                expect(rentBrake).toBeDefined();
                expect(rentBrake?.title).toContain('Mietpreisbremse München');
            });
            (0, node_test_1.it)('sollte leeres Array für unbekannte Stadt zurückgeben', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                const regulations = service['getRegulationsForCity']('UnbekannteStadt');
                expect(Array.isArray(regulations)).toBe(true);
                expect(regulations.length).toBe(0);
            });
        });
        (0, node_test_2.describe)('Empfehlungen-Generierung', () => {
            (0, node_test_1.it)('sollte Empfehlungen für überdurchschnittliche Miete generieren', () => {
                const apartmentDetails = {
                    size: 75,
                    rooms: 3
                };
                const calculatedRent = {
                    min: 800,
                    max: 1200,
                    average: 1000,
                    recommended: 1000
                };
                const comparison = {
                    belowAverage: false,
                    aboveAverage: true,
                    withinRange: true,
                    percentageDeviation: 15
                };
                const regulations = [
                    {
                        type: 'rent_brake',
                        title: 'Mietpreisbremse',
                        description: 'Test',
                        effectiveDate: new Date()
                    }
                ];
                // @ts-ignore - Zugriff auf private Methode für Test
                const recommendations = service['generateRecommendations'](apartmentDetails, calculatedRent, comparison, regulations);
                expect(Array.isArray(recommendations)).toBe(true);
                expect(recommendations.length).toBeGreaterThan(0);
                expect(recommendations.some(rec => rec.includes('über dem Durchschnitt'))).toBe(true);
                expect(recommendations.some(rec => rec.includes('Mietpreisbremse'))).toBe(true);
            });
        });
        (0, node_test_2.describe)('Datenqualitäts-Bewertung', () => {
            (0, node_test_1.it)('sollte aktuelle Daten als "official" bewerten', () => {
                const currentYear = new Date().getFullYear();
                const recentUpdate = new Date();
                // @ts-ignore - Zugriff auf private Methode für Test
                const quality = service['assessDataQuality'](currentYear, recentUpdate);
                expect(quality).toBe('official');
            });
            (0, node_test_1.it)('sollte alte Daten als "outdated" bewerten', () => {
                const oldYear = new Date().getFullYear() - 5;
                const oldUpdate = new Date();
                oldUpdate.setFullYear(oldYear);
                // @ts-ignore - Zugriff auf private Methode für Test
                const quality = service['assessDataQuality'](oldYear, oldUpdate);
                expect(quality).toBe('outdated');
            });
            (0, node_test_1.it)('sollte mittelalte Daten als "estimated" bewerten', () => {
                const mediumYear = new Date().getFullYear() - 2;
                const mediumUpdate = new Date();
                mediumUpdate.setFullYear(mediumYear);
                // @ts-ignore - Zugriff auf private Methode für Test
                const quality = service['assessDataQuality'](mediumYear, mediumUpdate);
                expect(quality).toBe('estimated');
            });
        });
        (0, node_test_2.describe)('Stadt-Coverage und Sample-Size', () => {
            (0, node_test_1.it)('sollte Coverage für bekannte Städte zurückgeben', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                expect(service['getCityCoverage']('Berlin')).toBe(95);
                // @ts-ignore
                expect(service['getCityCoverage']('München')).toBe(90);
                // @ts-ignore
                expect(service['getCityCoverage']('UnbekannteStadt')).toBe(70); // Default
            });
            (0, node_test_1.it)('sollte Sample-Size für bekannte Städte zurückgeben', () => {
                // @ts-ignore - Zugriff auf private Methode für Test
                expect(service['getCitySampleSize']('Berlin')).toBe(15000);
                // @ts-ignore
                expect(service['getCitySampleSize']('München')).toBe(12000);
                // @ts-ignore
                expect(service['getCitySampleSize']('UnbekannteStadt')).toBe(1000); // Default
            });
        });
    });
});
