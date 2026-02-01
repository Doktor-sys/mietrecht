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
describe('Authentication Tests', () => {
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
    });
    describe('POST /api/auth/register', () => {
        const validRegistrationData = {
            email: 'test@example.com',
            password: 'SecurePass123',
            userType: 'TENANT',
            acceptedTerms: true,
            firstName: 'Max',
            lastName: 'Mustermann',
            location: 'Berlin'
        };
        it('should register a new user successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validRegistrationData.email);
            expect(response.body.data.user.userType).toBe(validRegistrationData.userType);
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
            // Prüfe ob Benutzer in Datenbank erstellt wurde
            const user = await testPrisma.user.findUnique({
                where: { email: validRegistrationData.email },
                include: { profile: true, preferences: true }
            });
            expect(user).toBeTruthy();
            expect(user?.profile?.firstName).toBe(validRegistrationData.firstName);
            expect(user?.preferences?.language).toBe('de');
        });
        it('should reject registration with invalid email', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                ...validRegistrationData,
                email: 'invalid-email'
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should reject registration with weak password', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                ...validRegistrationData,
                password: '123'
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should reject registration without accepted terms', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                ...validRegistrationData,
                acceptedTerms: false
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should reject duplicate email registration', async () => {
            // Erste Registrierung
            await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(201);
            // Zweite Registrierung mit derselben E-Mail
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CONFLICT_ERROR');
        });
    });
    describe('POST /api/auth/login', () => {
        const userData = {
            email: 'login@example.com',
            password: 'SecurePass123',
            userType: client_1.UserType.TENANT
        };
        beforeEach(async () => {
            // Erstelle Test-Benutzer
            const passwordHash = await bcrypt_1.default.hash(userData.password, 12);
            await testPrisma.user.create({
                data: {
                    email: userData.email,
                    passwordHash,
                    userType: userData.userType,
                    isVerified: true,
                    profile: {
                        create: {
                            firstName: 'Test',
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
        });
        it('should login successfully with valid credentials', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: userData.email,
                password: userData.password
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
            // Prüfe ob lastLoginAt aktualisiert wurde
            const user = await testPrisma.user.findUnique({
                where: { email: userData.email }
            });
            expect(user?.lastLoginAt).toBeTruthy();
        });
        it('should reject login with invalid email', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: userData.password
            })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
        it('should reject login with invalid password', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: userData.email,
                password: 'wrongpassword'
            })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
        it('should reject login for inactive user', async () => {
            // Deaktiviere Benutzer
            await testPrisma.user.update({
                where: { email: userData.email },
                data: { isActive: false }
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: userData.email,
                password: userData.password
            })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
    describe('POST /api/auth/refresh', () => {
        let refreshToken;
        let userId;
        beforeEach(async () => {
            // Erstelle Benutzer und generiere Tokens
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            const user = await testPrisma.user.create({
                data: {
                    email: 'refresh@example.com',
                    passwordHash,
                    userType: client_1.UserType.TENANT,
                    isVerified: true
                }
            });
            userId = user.id;
            // Simuliere Login um Refresh Token zu erhalten
            const loginResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'refresh@example.com',
                password: 'password123'
            });
            refreshToken = loginResponse.body.data.tokens.refreshToken;
        });
        it('should refresh access token successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            // Prüfe ob neuer Token gültig ist
            const payload = jsonwebtoken_1.default.verify(response.body.data.accessToken, config_1.config.jwt.secret);
            expect(payload.userId).toBe(userId);
            expect(payload.type).toBe('access');
        });
        it('should reject invalid refresh token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
        it('should reject expired refresh token', async () => {
            // Erstelle abgelaufenen Token
            const expiredToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh', sessionId: 'test' }, config_1.config.jwt.secret, { expiresIn: '-1h' });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/refresh')
                .send({ refreshToken: expiredToken })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
    describe('POST /api/auth/logout', () => {
        let accessToken;
        let userId;
        beforeEach(async () => {
            // Login um Token zu erhalten
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            const user = await testPrisma.user.create({
                data: {
                    email: 'logout@example.com',
                    passwordHash,
                    userType: client_1.UserType.TENANT,
                    isVerified: true
                }
            });
            userId = user.id;
            const loginResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'logout@example.com',
                password: 'password123'
            });
            accessToken = loginResponse.body.data.tokens.accessToken;
        });
        it('should logout successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Erfolgreich abgemeldet');
            // Prüfe ob Sessions gelöscht wurden
            const sessions = await testPrisma.userSession.findMany({
                where: { userId }
            });
            expect(sessions).toHaveLength(0);
        });
        it('should reject logout without token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/logout')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
    describe('GET /api/auth/me', () => {
        let accessToken;
        let user;
        beforeEach(async () => {
            // Erstelle und logge Benutzer ein
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            user = await testPrisma.user.create({
                data: {
                    email: 'me@example.com',
                    passwordHash,
                    userType: client_1.UserType.TENANT,
                    isVerified: true,
                    profile: {
                        create: {
                            firstName: 'Test',
                            lastName: 'User',
                            location: 'Berlin',
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
            const loginResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'me@example.com',
                password: 'password123'
            });
            accessToken = loginResponse.body.data.tokens.accessToken;
        });
        it('should return current user information', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(user.id);
            expect(response.body.data.email).toBe(user.email);
            expect(response.body.data.profile.firstName).toBe('Test');
            expect(response.body.data.preferences.language).toBe('de');
        });
        it('should reject request without token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/auth/me')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
    describe('Password Reset', () => {
        beforeEach(async () => {
            // Erstelle Test-Benutzer
            const passwordHash = await bcrypt_1.default.hash('oldpassword123', 12);
            await testPrisma.user.create({
                data: {
                    email: 'reset@example.com',
                    passwordHash,
                    userType: client_1.UserType.TENANT,
                    isVerified: true
                }
            });
        });
        it('should request password reset', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/forgot-password')
                .send({ email: 'reset@example.com' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Reset-E-Mail gesendet');
        });
        it('should not reveal if email does not exist', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Reset-E-Mail gesendet');
        });
        it('should reset password with valid token', async () => {
            // Fordere Reset an
            await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/forgot-password')
                .send({ email: 'reset@example.com' });
            // Simuliere gültigen Reset Token
            const user = await testPrisma.user.findUnique({
                where: { email: 'reset@example.com' }
            });
            const resetToken = jsonwebtoken_1.default.sign({ userId: user?.id, type: 'password_reset' }, config_1.config.jwt.secret, { expiresIn: '1h' });
            // Speichere Token in Redis
            await redis_1.redis.set(`password_reset:${user?.id}`, resetToken, 3600);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/reset-password')
                .send({
                token: resetToken,
                newPassword: 'NewSecurePass123'
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Passwort erfolgreich zurückgesetzt');
            // Prüfe ob Passwort geändert wurde
            const updatedUser = await testPrisma.user.findUnique({
                where: { email: 'reset@example.com' }
            });
            const isNewPasswordValid = await bcrypt_1.default.compare('NewSecurePass123', updatedUser.passwordHash);
            expect(isNewPasswordValid).toBe(true);
        });
    });
    describe('Token Verification', () => {
        let accessToken;
        beforeEach(async () => {
            // Login um Token zu erhalten
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            await testPrisma.user.create({
                data: {
                    email: 'verify@example.com',
                    passwordHash,
                    userType: client_1.UserType.TENANT,
                    isVerified: true
                }
            });
            const loginResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'verify@example.com',
                password: 'password123'
            });
            accessToken = loginResponse.body.data.tokens.accessToken;
        });
        it('should verify valid token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/verify-token')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.valid).toBe(true);
            expect(response.body.data.userId).toBeDefined();
            expect(response.body.data.userType).toBe('TENANT');
        });
        it('should reject invalid token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/verify-token')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
});
