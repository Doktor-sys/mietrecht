"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../index"));
const config_1 = require("../config/config");
const redis_1 = require("../config/redis");
// Test-spezifische Prisma-Instanz
const testPrisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
        },
    },
});
describe('User Management API Tests', () => {
    let tenantToken;
    let businessToken;
    let tenantUserId;
    let businessUserId;
    beforeAll(async () => {
        await testPrisma.$connect();
        await redis_1.redis.connect();
    });
    afterAll(async () => {
        await testPrisma.$disconnect();
        await redis_1.redis.disconnect();
    });
    beforeEach(async () => {
        // Cleanup vor jedem Test
        await testPrisma.userSession.deleteMany();
        await testPrisma.userPreferences.deleteMany();
        await testPrisma.userProfile.deleteMany();
        await testPrisma.user.deleteMany();
        // Redis cleanup
        const client = redis_1.redis.getClient();
        if (client.isOpen) {
            await client.flushDb();
        }
        // Erstelle Test-Benutzer
        const passwordHash = await bcrypt_1.default.hash('password123', 12);
        const tenantUser = await testPrisma.user.create({
            data: {
                email: 'tenant@example.com',
                passwordHash,
                userType: client_1.UserType.TENANT,
                isVerified: true,
                profile: {
                    create: {
                        firstName: 'Max',
                        lastName: 'Mieter',
                        location: 'Berlin',
                        language: 'de'
                    }
                },
                preferences: {
                    create: {
                        language: 'de',
                        notifications: {
                            email: true,
                            push: true,
                            sms: false
                        },
                        privacy: {
                            dataSharing: false,
                            analytics: true,
                            marketing: false
                        }
                    }
                }
            }
        });
        const businessUser = await testPrisma.user.create({
            data: {
                email: 'business@example.com',
                passwordHash,
                userType: client_1.UserType.BUSINESS,
                isVerified: true,
                profile: {
                    create: {
                        firstName: 'Business',
                        lastName: 'User',
                        language: 'de'
                    }
                },
                preferences: {
                    create: {
                        language: 'de'
                    }
                }
            }
        });
        tenantUserId = tenantUser.id;
        businessUserId = businessUser.id;
        // Generiere Tokens
        const sessionId1 = 'session_tenant_test';
        const sessionId2 = 'session_business_test';
        await redis_1.redis.setSession(sessionId1, { userId: tenantUserId });
        await redis_1.redis.setSession(sessionId2, { userId: businessUserId });
        tenantToken = jsonwebtoken_1.default.sign({ userId: tenantUserId, email: tenantUser.email, userType: client_1.UserType.TENANT, sessionId: sessionId1, type: 'access' }, config_1.config.jwt.secret, { expiresIn: '1h' });
        businessToken = jsonwebtoken_1.default.sign({ userId: businessUserId, email: businessUser.email, userType: client_1.UserType.BUSINESS, sessionId: sessionId2, type: 'access' }, config_1.config.jwt.secret, { expiresIn: '1h' });
    });
    describe('GET /api/users/profile', () => {
        it('should return user profile', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(tenantUserId);
            expect(response.body.data.email).toBe('tenant@example.com');
            expect(response.body.data.profile.firstName).toBe('Max');
            expect(response.body.data.preferences.language).toBe('de');
        });
        it('should reject request without token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/profile')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
    describe('PUT /api/users/profile', () => {
        it('should update user profile', async () => {
            const updateData = {
                firstName: 'John',
                lastName: 'Doe',
                location: 'München',
                language: 'en',
                accessibilityNeeds: {
                    screenReader: true,
                    highContrast: false
                }
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe('John');
            expect(response.body.data.lastName).toBe('Doe');
            expect(response.body.data.location).toBe('München');
            expect(response.body.data.language).toBe('en');
            expect(response.body.data.accessibilityNeeds.screenReader).toBe(true);
        });
        it('should reject invalid data', async () => {
            const invalidData = {
                firstName: '', // Zu kurz
                language: 'invalid' // Ungültige Sprache
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('GET /api/users/preferences', () => {
        it('should get user preferences', async () => {
            // First update preferences
            const updateData = {
                language: 'en',
                notifications: {
                    email: false,
                    push: true
                }
            };
            await (0, supertest_1.default)(index_1.default)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            // Then get preferences
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.language).toBe('en');
            expect(response.body.data.notifications.email).toBe(false);
            expect(response.body.data.notifications.push).toBe(true);
        });
        it('should get enhanced profile preferences', async () => {
            // First update preferences with enhanced profile data
            const updateData = {
                accessibility: {
                    highContrast: true,
                    dyslexiaFriendly: false
                },
                legalTopics: ['tenant-protection'],
                frequentDocuments: ['rental-contract'],
                alerts: {
                    newCaseLaw: 'weekly',
                    documentUpdates: 'daily'
                }
            };
            await (0, supertest_1.default)(index_1.default)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            // Then get preferences
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessibility.highContrast).toBe(true);
            expect(response.body.data.accessibility.dyslexiaFriendly).toBe(false);
            expect(response.body.data.legalTopics).toEqual(['tenant-protection']);
            expect(response.body.data.frequentDocuments).toEqual(['rental-contract']);
            expect(response.body.data.alerts.newCaseLaw).toBe('weekly');
            expect(response.body.data.alerts.documentUpdates).toBe('daily');
        });
    });
    describe('PUT /api/users/preferences', () => {
        it('should update user preferences', async () => {
            const updateData = {
                notifications: {
                    email: false,
                    push: true,
                    sms: true
                },
                privacy: {
                    dataSharing: true,
                    analytics: false,
                    marketing: true
                },
                language: 'en'
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.language).toBe('en');
            expect(response.body.data.notifications.email).toBe(false);
            expect(response.body.data.privacy.dataSharing).toBe(true);
        });
        it('should merge with existing preferences', async () => {
            const updateData = {
                notifications: {
                    email: false // Nur E-Mail ändern
                }
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.data.notifications.email).toBe(false);
            expect(response.body.data.notifications.push).toBe(true); // Sollte unverändert bleiben
        });
        it('should update enhanced profile preferences', async () => {
            const updateData = {
                accessibility: {
                    highContrast: true,
                    dyslexiaFriendly: true,
                    reducedMotion: false
                },
                legalTopics: ['tenant-protection', 'modernization'],
                frequentDocuments: ['rental-contract'],
                alerts: {
                    newCaseLaw: 'daily',
                    documentUpdates: 'instant',
                    newsletter: 'monthly'
                }
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessibility.highContrast).toBe(true);
            expect(response.body.data.accessibility.dyslexiaFriendly).toBe(true);
            expect(response.body.data.legalTopics).toEqual(['tenant-protection', 'modernization']);
            expect(response.body.data.frequentDocuments).toEqual(['rental-contract']);
            expect(response.body.data.alerts.newCaseLaw).toBe('daily');
            expect(response.body.data.alerts.documentUpdates).toBe('instant');
            expect(response.body.data.alerts.newsletter).toBe('monthly');
        });
    });
    describe('POST /api/users/verify-email', () => {
        beforeEach(async () => {
            // Setze Benutzer als nicht verifiziert
            await testPrisma.user.update({
                where: { id: tenantUserId },
                data: { isVerified: false }
            });
        });
        it('should verify email successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/users/verify-email')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('verifiziert');
            // Prüfe Datenbank
            const user = await testPrisma.user.findUnique({
                where: { id: tenantUserId }
            });
            expect(user?.isVerified).toBe(true);
        });
    });
    describe('POST /api/users/deactivate', () => {
        it('should deactivate user account', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/users/deactivate')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({ reason: 'Test deactivation' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deaktiviert');
            // Prüfe Datenbank
            const user = await testPrisma.user.findUnique({
                where: { id: tenantUserId }
            });
            expect(user?.isActive).toBe(false);
        });
    });
    describe('GET /api/users/export-data', () => {
        it('should export user data', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/export-data')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.exportDate).toBeDefined();
            expect(response.body.data.userData.id).toBe(tenantUserId);
            expect(response.body.data.userData.email).toBe('tenant@example.com');
            expect(response.body.data.userData).not.toHaveProperty('passwordHash');
        });
    });
    describe('DELETE /api/users/delete-data', () => {
        it('should delete all user data', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .delete('/api/users/delete-data')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('gelöscht');
            // Prüfe ob Benutzer gelöscht wurde
            const user = await testPrisma.user.findUnique({
                where: { id: tenantUserId }
            });
            expect(user).toBeNull();
        });
    });
    describe('GET /api/users/search', () => {
        beforeEach(async () => {
            // Erstelle zusätzliche Test-Benutzer
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            await testPrisma.user.create({
                data: {
                    email: 'landlord@example.com',
                    passwordHash,
                    userType: client_1.UserType.LANDLORD,
                    isVerified: true,
                    profile: {
                        create: {
                            firstName: 'Anna',
                            lastName: 'Vermieter',
                            location: 'München',
                            language: 'de'
                        }
                    }
                }
            });
        });
        it('should search users for business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/search?userType=TENANT')
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].userType).toBe('TENANT');
            expect(response.body.data.total).toBe(1);
        });
        it('should filter by location', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/search?location=München')
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].profile.location).toBe('München');
        });
        it('should handle pagination', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/search?page=1&limit=2')
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.data.page).toBe(1);
            expect(response.body.data.users.length).toBeLessThanOrEqual(2);
        });
        it('should reject search for non-business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/search')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
        });
    });
    describe('GET /api/users/stats', () => {
        it('should return user statistics for business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/stats')
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalUsers).toBeGreaterThan(0);
            expect(response.body.data.usersByType).toBeDefined();
            expect(response.body.data.usersByType.tenant).toBeGreaterThanOrEqual(0);
            expect(response.body.data.usersByType.business).toBeGreaterThanOrEqual(0);
        });
        it('should reject stats request for non-business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/users/stats')
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
        });
    });
    describe('GET /api/users/:userId', () => {
        it('should return own user data', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/users/${tenantUserId}`)
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(tenantUserId);
            expect(response.body.data.email).toBe('tenant@example.com');
        });
        it('should return other user data for business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/users/${tenantUserId}`)
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(tenantUserId);
            expect(response.body.data.preferences).toBeDefined(); // Business user sieht Präferenzen
        });
        it('should reject access to other user data for non-business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/users/${businessUserId}`)
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/users/:userId/reactivate', () => {
        beforeEach(async () => {
            // Deaktiviere Tenant-Benutzer
            await testPrisma.user.update({
                where: { id: tenantUserId },
                data: { isActive: false }
            });
        });
        it('should reactivate user for business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post(`/api/users/${tenantUserId}/reactivate`)
                .set('Authorization', `Bearer ${businessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('reaktiviert');
            // Prüfe Datenbank
            const user = await testPrisma.user.findUnique({
                where: { id: tenantUserId }
            });
            expect(user?.isActive).toBe(true);
        });
        it('should reject reactivation for non-business user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post(`/api/users/${businessUserId}/reactivate`)
                .set('Authorization', `Bearer ${tenantToken}`)
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
});
