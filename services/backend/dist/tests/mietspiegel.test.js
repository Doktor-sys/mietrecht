"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const client_1 = require("@prisma/client");
const index_1 = __importDefault(require("../index"));
const redis_1 = require("../config/redis");
const prisma = new client_1.PrismaClient();
describe('Mietspiegel API Integration Tests', () => {
    let authToken;
    let testUserId;
    beforeAll(async () => {
        // Erstelle Test-User und authentifiziere
        const testUser = await prisma.user.create({
            data: {
                email: 'mietspiegel.test@example.com',
                passwordHash: '$2b$10$test.hash.for.testing',
                userType: 'TENANT',
                isVerified: true,
                profile: {
                    create: {
                        firstName: 'Test',
                        lastName: 'User',
                        city: 'Berlin'
                    }
                }
            }
        });
        testUserId = testUser.id;
        // Mock JWT Token für Tests
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ userId: testUserId, email: testUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        // Erstelle Test-Mietspiegel-Daten
        await prisma.mietspiegelData.create({
            data: {
                city: 'Berlin',
                year: 2024,
                averageRent: 12.50,
                rentRanges: [
                    {
                        minRent: 8.00,
                        maxRent: 15.00,
                        category: 'standard',
                        conditions: ['normal condition', 'central location']
                    },
                    {
                        minRent: 15.00,
                        maxRent: 20.00,
                        category: 'premium',
                        conditions: ['excellent condition', 'premium location']
                    }
                ],
                specialRegulations: ['Mietpreisbremse', 'Modernisierungsumlage-Begrenzung']
            }
        });
    });
    afterAll(async () => {
        // Cleanup
        await prisma.mietspiegelData.deleteMany({
            where: { city: 'Berlin' }
        });
        await prisma.user.delete({
            where: { id: testUserId }
        });
        await prisma.$disconnect();
        await redis_1.redis.getClient().quit();
    });
    beforeEach(async () => {
        // Clear Redis cache before each test
        await redis_1.redis.getClient().flushAll();
    });
    describe('GET /api/mietspiegel/:city', () => {
        it('sollte Mietspiegel-Daten für Berlin abrufen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('city', 'Berlin');
            expect(response.body.data).toHaveProperty('year', 2024);
            expect(response.body.data).toHaveProperty('averageRent', 12.50);
            expect(response.body.data.rentRanges).toHaveLength(2);
        });
        it('sollte 404 für unbekannte Stadt zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/UnbekannteStadt')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
        });
        it('sollte 401 ohne Authentifizierung zurückgeben', async () => {
            await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin')
                .expect(401);
        });
        it('sollte Daten für spezifisches Jahr abrufen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin?year=2024')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.data.year).toBe(2024);
        });
    });
    describe('POST /api/mietspiegel/calculate-rent', () => {
        const validApartmentDetails = {
            size: 75,
            rooms: 3,
            constructionYear: 2010,
            condition: 'good',
            location: 'central',
            features: ['balkon', 'garage'],
            heatingType: 'central',
            energyClass: 'B'
        };
        it('sollte Mietpreis-Range korrekt berechnen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/mietspiegel/calculate-rent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                city: 'Berlin',
                apartmentDetails: validApartmentDetails
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('city', 'Berlin');
            expect(response.body.data).toHaveProperty('calculatedRent');
            expect(response.body.data.calculatedRent).toHaveProperty('min');
            expect(response.body.data.calculatedRent).toHaveProperty('max');
            expect(response.body.data.calculatedRent).toHaveProperty('average');
            expect(response.body.data.calculatedRent).toHaveProperty('recommended');
            expect(response.body.data).toHaveProperty('factors');
            expect(response.body.data).toHaveProperty('recommendations');
        });
        it('sollte Validierungsfehler für ungültige Daten zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/mietspiegel/calculate-rent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                city: 'Berlin',
                apartmentDetails: {
                    size: -10, // Ungültige Größe
                    rooms: 0 // Ungültige Zimmeranzahl
                }
            })
                .expect(400);
            expect(response.body.success).toBe(false);
        });
        it('sollte 400 für fehlende Stadt zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/mietspiegel/calculate-rent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                apartmentDetails: validApartmentDetails
            })
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe('GET /api/mietspiegel/:city/regulations', () => {
        it('sollte lokale Bestimmungen für Berlin abrufen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin/regulations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            // Berlin sollte Mietpreisbremse haben
            const rentBrake = response.body.data.find((reg) => reg.type === 'rent_brake');
            expect(rentBrake).toBeDefined();
            expect(rentBrake.title).toContain('Mietpreisbremse');
        });
        it('sollte leeres Array für Stadt ohne Bestimmungen zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/KleineStadt/regulations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('POST /api/mietspiegel/compare-rent', () => {
        const validComparisonData = {
            city: 'Berlin',
            currentRent: 1000,
            apartmentDetails: {
                size: 75,
                rooms: 3,
                constructionYear: 2010,
                condition: 'good',
                location: 'central'
            }
        };
        it('sollte Mietvergleich korrekt durchführen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/mietspiegel/compare-rent')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validComparisonData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('comparison');
            expect(['below', 'within', 'above']).toContain(response.body.data.comparison);
            expect(response.body.data).toHaveProperty('deviation');
            expect(response.body.data).toHaveProperty('percentageDeviation');
            expect(response.body.data).toHaveProperty('recommendation');
        });
        it('sollte Validierungsfehler für negative Miete zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/mietspiegel/compare-rent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...validComparisonData,
                currentRent: -100
            })
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe('GET /api/mietspiegel/cities', () => {
        it('sollte verfügbare Städte abrufen', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/cities')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            const berlinCity = response.body.data.find((city) => city.city === 'Berlin');
            expect(berlinCity).toBeDefined();
            expect(berlinCity).toHaveProperty('availableYears');
            expect(berlinCity).toHaveProperty('currentYear');
            expect(berlinCity).toHaveProperty('dataQuality');
            expect(berlinCity).toHaveProperty('coverage');
        });
    });
    describe('PUT /api/mietspiegel/update', () => {
        const validUpdateData = {
            city: 'TestStadt',
            year: 2024,
            averageRent: 10.00,
            rentRanges: [
                {
                    minRent: 8.00,
                    maxRent: 12.00,
                    category: 'standard',
                    conditions: ['normal']
                }
            ],
            specialRegulations: ['Test-Bestimmung'],
            dataSource: 'Test-Quelle',
            lastUpdated: new Date().toISOString()
        };
        it('sollte Mietspiegel-Daten erfolgreich aktualisieren', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/mietspiegel/update')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validUpdateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('city', 'TestStadt');
            expect(response.body.data).toHaveProperty('averageRent', 10.00);
            expect(response.body.message).toContain('erfolgreich aktualisiert');
            // Cleanup
            await prisma.mietspiegelData.delete({
                where: {
                    city_year: {
                        city: 'TestStadt',
                        year: 2024
                    }
                }
            });
        });
        it('sollte Validierungsfehler für ungültige Daten zurückgeben', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/mietspiegel/update')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                city: '',
                year: 1999, // Ungültiges Jahr
                averageRent: -5 // Ungültige Miete
            })
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe('Caching Tests', () => {
        it('sollte Daten aus Cache abrufen beim zweiten Request', async () => {
            // Erster Request - lädt aus Datenbank
            const response1 = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            // Zweiter Request - sollte aus Cache kommen
            const response2 = await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response1.body.data).toEqual(response2.body.data);
            // Prüfe ob Cache-Key existiert
            const cacheKey = 'mietspiegel:Berlin:2024';
            const cachedData = await redis_1.redis.get(cacheKey);
            expect(cachedData).toBeDefined();
        });
        it('sollte Cache invalidieren nach Update', async () => {
            // Lade Daten in Cache
            await (0, supertest_1.default)(index_1.default)
                .get('/api/mietspiegel/Berlin')
                .set('Authorization', `Bearer ${authToken}`);
            // Update Daten
            await (0, supertest_1.default)(index_1.default)
                .put('/api/mietspiegel/update')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                city: 'Berlin',
                year: 2024,
                averageRent: 13.00,
                rentRanges: [
                    {
                        minRent: 9.00,
                        maxRent: 16.00,
                        category: 'updated',
                        conditions: ['updated']
                    }
                ],
                specialRegulations: ['Updated-Bestimmung'],
                dataSource: 'Update-Test',
                lastUpdated: new Date().toISOString()
            })
                .expect(200);
            // Cache sollte invalidiert sein
            const cacheKey = 'mietspiegel:Berlin:2024';
            const cachedData = await redis_1.redis.get(cacheKey);
            expect(cachedData).toBeNull();
        });
    });
});
