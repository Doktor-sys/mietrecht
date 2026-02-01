"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserService_1 = require("../services/UserService");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("../middleware/errorHandler");
// Test-spezifische Prisma-Instanz
const testPrisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
        },
    },
});
describe('UserService Unit Tests', () => {
    let userService;
    let testUserId;
    beforeAll(async () => {
        await testPrisma.$connect();
        await redis_1.redis.connect();
        userService = new UserService_1.UserService(testPrisma);
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
        const user = await testPrisma.user.create({
            data: {
                email: 'test@example.com',
                passwordHash,
                userType: client_1.UserType.TENANT,
                isVerified: true,
                profile: {
                    create: {
                        firstName: 'Max',
                        lastName: 'Mustermann',
                        city: 'Berlin',
                        language: 'de'
                    }
                },
                preferences: {
                    create: {
                        language: 'de',
                        emailNotifications: true,
                        pushNotifications: true,
                        smsNotifications: false,
                        privacy: {
                            dataSharing: false,
                            analytics: true,
                            marketing: false
                        }
                    }
                }
            }
        });
        testUserId = user.id;
    });
    describe('getUserById', () => {
        it('should return user with profile and preferences', async () => {
            const user = await userService.getUserById(testUserId);
            expect(user).toBeTruthy();
            expect(user?.id).toBe(testUserId);
            expect(user?.email).toBe('test@example.com');
            expect(user?.profile?.firstName).toBe('Max');
            expect(user?.preferences?.language).toBe('de');
            expect(user).not.toHaveProperty('passwordHash');
        });
        it('should return null for non-existent user', async () => {
            const user = await userService.getUserById('non-existent-id');
            expect(user).toBeNull();
        });
    });
    describe('getUserByEmail', () => {
        it('should return user by email', async () => {
            const user = await userService.getUserByEmail('test@example.com');
            expect(user).toBeTruthy();
            expect(user?.email).toBe('test@example.com');
            expect(user?.profile?.firstName).toBe('Max');
        });
        it('should be case insensitive', async () => {
            const user = await userService.getUserByEmail('TEST@EXAMPLE.COM');
            expect(user).toBeTruthy();
            expect(user?.email).toBe('test@example.com');
        });
        it('should return null for non-existent email', async () => {
            const user = await userService.getUserByEmail('nonexistent@example.com');
            expect(user).toBeNull();
        });
    });
    describe('updateProfile', () => {
        it('should update profile successfully', async () => {
            const updateData = {
                firstName: 'John',
                lastName: 'Doe',
                location: 'München',
                language: 'en'
            };
            const updatedProfile = await userService.updateProfile(testUserId, updateData);
            expect(updatedProfile.firstName).toBe('John');
            expect(updatedProfile.lastName).toBe('Doe');
            expect(updatedProfile.location).toBe('München');
            expect(updatedProfile.language).toBe('en');
        });
        it('should update accessibility needs', async () => {
            const updateData = {
                accessibilityNeeds: {
                    screenReader: true,
                    highContrast: true,
                    largeText: false,
                    keyboardNavigation: true
                }
            };
            const updatedProfile = await userService.updateProfile(testUserId, updateData);
            expect(updatedProfile.accessibilityNeeds).toEqual(updateData.accessibilityNeeds);
        });
        it('should create profile if it does not exist', async () => {
            // Lösche existierendes Profil
            await testPrisma.userProfile.delete({
                where: { userId: testUserId }
            });
            const updateData = {
                firstName: 'New',
                lastName: 'User'
            };
            const profile = await userService.updateProfile(testUserId, updateData);
            expect(profile.firstName).toBe('New');
            expect(profile.lastName).toBe('User');
            expect(profile.language).toBe('de'); // Default
        });
        it('should reject invalid data', async () => {
            const invalidData = {
                firstName: '', // Zu kurz
                language: 'invalid' // Ungültige Sprache
            };
            await expect(userService.updateProfile(testUserId, invalidData)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should throw error for non-existent user', async () => {
            const updateData = {
                firstName: 'Test'
            };
            await expect(userService.updateProfile('non-existent', updateData)).rejects.toThrow(errorHandler_1.NotFoundError);
        });
    });
    describe('getPreferences', () => {
        it('should get preferences successfully', async () => {
            // First update preferences
            const updateData = {
                language: 'en',
                notifications: {
                    email: false,
                    push: true
                }
            };
            await userService.updatePreferences(testUserId, updateData);
            // Then get preferences
            const preferences = await userService.getPreferences(testUserId);
            expect(preferences).toBeDefined();
            expect(preferences?.language).toBe('en');
            expect((preferences?.notifications).email).toBe(false);
            expect((preferences?.notifications).push).toBe(true);
        });
        it('should return null if preferences do not exist', async () => {
            // Delete existing preferences
            await testPrisma.userPreferences.delete({
                where: { userId: testUserId }
            });
            const preferences = await userService.getPreferences(testUserId);
            expect(preferences).toBeNull();
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
            await userService.updatePreferences(testUserId, updateData);
            // Then get preferences
            const preferences = await userService.getPreferences(testUserId);
            expect(preferences).toBeDefined();
            expect(preferences['accessibility']['highContrast']).toBe(true);
            expect(preferences['accessibility']['dyslexiaFriendly']).toBe(false);
            expect(preferences['legalTopics']).toEqual(['tenant-protection']);
            expect(preferences['frequentDocuments']).toEqual(['rental-contract']);
            expect(preferences['alerts']['newCaseLaw']).toBe('weekly');
            expect(preferences['alerts']['documentUpdates']).toBe('daily');
        });
    });
    describe('updatePreferences', () => {
        it('should update preferences successfully', async () => {
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
            const updatedPreferences = await userService.updatePreferences(testUserId, updateData);
            expect(updatedPreferences.language).toBe('en');
            expect(updatedPreferences.notifications.email).toBe(false);
            expect(updatedPreferences.privacy.dataSharing).toBe(true);
        });
        it('should merge with existing preferences', async () => {
            const updateData = {
                notifications: {
                    email: false // Nur E-Mail ändern
                }
            };
            const updatedPreferences = await userService.updatePreferences(testUserId, updateData);
            // E-Mail sollte geändert sein
            expect(updatedPreferences.notifications.email).toBe(false);
            // Push sollte unverändert bleiben
            expect(updatedPreferences.notifications.push).toBe(true);
        });
        it('should create preferences if they do not exist', async () => {
            // Lösche existierende Präferenzen
            await testPrisma.userPreferences.delete({
                where: { userId: testUserId }
            });
            const updateData = {
                language: 'en'
            };
            const preferences = await userService.updatePreferences(testUserId, updateData);
            expect(preferences.language).toBe('en');
        });
        it('should reject invalid language', async () => {
            const invalidData = {
                language: 'invalid'
            };
            await expect(userService.updatePreferences(testUserId, invalidData)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should update enhanced profile preferences successfully', async () => {
            const updateData = {
                accessibility: {
                    highContrast: true,
                    dyslexiaFriendly: true,
                    reducedMotion: false,
                    largerText: true,
                    screenReaderMode: false
                },
                legalTopics: ['tenant-protection', 'modernization'],
                frequentDocuments: ['rental-contract', 'warning-letter'],
                alerts: {
                    newCaseLaw: 'daily',
                    documentUpdates: 'instant',
                    newsletter: 'monthly'
                }
            };
            const updatedPreferences = await userService.updatePreferences(testUserId, updateData);
            // Access the new fields through bracket notation to avoid TypeScript errors
            expect(updatedPreferences['accessibility']['highContrast']).toBe(true);
            expect(updatedPreferences['accessibility']['dyslexiaFriendly']).toBe(true);
            expect(updatedPreferences['legalTopics']).toEqual(['tenant-protection', 'modernization']);
            expect(updatedPreferences['frequentDocuments']).toEqual(['rental-contract', 'warning-letter']);
            expect(updatedPreferences['alerts']['newCaseLaw']).toBe('daily');
            expect(updatedPreferences['alerts']['documentUpdates']).toBe('instant');
            expect(updatedPreferences['alerts']['newsletter']).toBe('monthly');
        });
        it('should validate enhanced profile preferences', async () => {
            const invalidData = {
                alerts: {
                    newCaseLaw: 'invalid-value',
                    documentUpdates: 'daily',
                    newsletter: 'monthly'
                }
            };
            await expect(userService.updatePreferences(testUserId, invalidData)).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('deactivateUser', () => {
        it('should deactivate user successfully', async () => {
            await userService.deactivateUser(testUserId, 'Test reason');
            const user = await testPrisma.user.findUnique({
                where: { id: testUserId }
            });
            expect(user?.isActive).toBe(false);
        });
        it('should delete all user sessions', async () => {
            // Erstelle Test-Session
            const sessionToken = 'test-session';
            await testPrisma.userSession.create({
                data: {
                    userId: testUserId,
                    token: sessionToken,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            await redis_1.redis.setSession(sessionToken, { userId: testUserId });
            await userService.deactivateUser(testUserId);
            // Prüfe ob Sessions gelöscht wurden
            const sessions = await testPrisma.userSession.findMany({
                where: { userId: testUserId }
            });
            expect(sessions).toHaveLength(0);
            const redisSession = await redis_1.redis.getSession(sessionToken);
            expect(redisSession).toBeNull();
        });
        it('should throw error for already deactivated user', async () => {
            // Deaktiviere Benutzer
            await testPrisma.user.update({
                where: { id: testUserId },
                data: { isActive: false }
            });
            await expect(userService.deactivateUser(testUserId)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should throw error for non-existent user', async () => {
            await expect(userService.deactivateUser('non-existent')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
    });
    describe('reactivateUser', () => {
        beforeEach(async () => {
            // Deaktiviere Benutzer für Tests
            await testPrisma.user.update({
                where: { id: testUserId },
                data: { isActive: false }
            });
        });
        it('should reactivate user successfully', async () => {
            await userService.reactivateUser(testUserId);
            const user = await testPrisma.user.findUnique({
                where: { id: testUserId }
            });
            expect(user?.isActive).toBe(true);
        });
        it('should throw error for already active user', async () => {
            // Reaktiviere Benutzer
            await testPrisma.user.update({
                where: { id: testUserId },
                data: { isActive: true }
            });
            await expect(userService.reactivateUser(testUserId)).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('verifyEmail', () => {
        beforeEach(async () => {
            // Setze Benutzer als nicht verifiziert
            await testPrisma.user.update({
                where: { id: testUserId },
                data: { isVerified: false }
            });
        });
        it('should verify email successfully', async () => {
            await userService.verifyEmail(testUserId);
            const user = await testPrisma.user.findUnique({
                where: { id: testUserId }
            });
            expect(user?.isVerified).toBe(true);
        });
        it('should throw error for already verified user', async () => {
            // Verifiziere Benutzer
            await testPrisma.user.update({
                where: { id: testUserId },
                data: { isVerified: true }
            });
            await expect(userService.verifyEmail(testUserId)).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('searchUsers', () => {
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
                            city: 'München',
                            language: 'de'
                        }
                    }
                }
            });
            await testPrisma.user.create({
                data: {
                    email: 'business@example.com',
                    passwordHash,
                    userType: client_1.UserType.BUSINESS,
                    isVerified: false,
                    profile: {
                        create: {
                            firstName: 'Business',
                            lastName: 'User',
                            city: 'Hamburg',
                            language: 'en'
                        }
                    }
                }
            });
        });
        it('should search users successfully for business user', async () => {
            const result = await userService.searchUsers({ userType: client_1.UserType.TENANT }, 1, 10, client_1.UserType.BUSINESS);
            expect(result.users).toHaveLength(1);
            expect(result.users[0].userType).toBe(client_1.UserType.TENANT);
            expect(result.total).toBe(1);
        });
        it('should filter by location', async () => {
            const result = await userService.searchUsers({ location: 'München' }, 1, 10, client_1.UserType.BUSINESS);
            expect(result.users).toHaveLength(1);
            expect(result.users[0].profile?.location).toBe('München');
        });
        it('should filter by verification status', async () => {
            const result = await userService.searchUsers({ isVerified: false }, 1, 10, client_1.UserType.BUSINESS);
            expect(result.users).toHaveLength(1);
            expect(result.users[0].isVerified).toBe(false);
        });
        it('should reject search for non-business user', async () => {
            await expect(userService.searchUsers({}, 1, 10, client_1.UserType.TENANT)).rejects.toThrow(errorHandler_1.AuthorizationError);
        });
        it('should handle pagination correctly', async () => {
            const result = await userService.searchUsers({}, 1, 2, client_1.UserType.BUSINESS);
            expect(result.users).toHaveLength(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(2); // 3 Benutzer total, 2 pro Seite
        });
    });
    describe('getUserStats', () => {
        beforeEach(async () => {
            // Erstelle zusätzliche Benutzer für Statistiken
            const passwordHash = await bcrypt_1.default.hash('password123', 12);
            await testPrisma.user.create({
                data: {
                    email: 'landlord@example.com',
                    passwordHash,
                    userType: client_1.UserType.LANDLORD,
                    isVerified: true,
                    isActive: false, // Inaktiv
                    profile: {
                        create: {
                            city: 'München',
                            language: 'de'
                        }
                    }
                }
            });
            await testPrisma.user.create({
                data: {
                    email: 'business@example.com',
                    passwordHash,
                    userType: client_1.UserType.BUSINESS,
                    isVerified: false,
                    profile: {
                        create: {
                            city: 'Berlin',
                            language: 'de'
                        }
                    }
                }
            });
        });
        it('should return user statistics for business user', async () => {
            const stats = await userService.getUserStats(client_1.UserType.BUSINESS);
            expect(stats.totalUsers).toBe(3);
            expect(stats.activeUsers).toBe(2); // Ein Benutzer ist inaktiv
            expect(stats.verifiedUsers).toBe(2); // Ein Benutzer ist nicht verifiziert
            expect(stats.usersByType.tenant).toBe(1);
            expect(stats.usersByType.landlord).toBe(1);
            expect(stats.usersByType.business).toBe(1);
            expect(stats.usersByLocation.Berlin).toBe(2); // Test-Benutzer + Business-Benutzer
            expect(stats.usersByLocation.München).toBe(1);
        });
        it('should reject stats request for non-business user', async () => {
            await expect(userService.getUserStats(client_1.UserType.TENANT)).rejects.toThrow(errorHandler_1.AuthorizationError);
        });
        it('should cache statistics', async () => {
            // Erster Aufruf
            const stats1 = await userService.getUserStats(client_1.UserType.BUSINESS);
            // Zweiter Aufruf sollte aus Cache kommen
            const stats2 = await userService.getUserStats(client_1.UserType.BUSINESS);
            expect(stats1).toEqual(stats2);
        });
    });
    describe('exportUserData', () => {
        it('should export all user data', async () => {
            const exportData = await userService.exportUserData(testUserId);
            expect(exportData.exportDate).toBeDefined();
            expect(exportData.userData.id).toBe(testUserId);
            expect(exportData.userData.email).toBe('test@example.com');
            expect(exportData.userData.profile).toBeDefined();
            expect(exportData.userData.preferences).toBeDefined();
            expect(exportData.userData).not.toHaveProperty('passwordHash');
        });
        it('should throw error for non-existent user', async () => {
            await expect(userService.exportUserData('non-existent')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
    });
    describe('deleteUserData', () => {
        it('should delete all user data', async () => {
            // Erstelle Session
            const sessionToken = 'test-session';
            await testPrisma.userSession.create({
                data: {
                    userId: testUserId,
                    token: sessionToken,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            await redis_1.redis.setSession(sessionToken, { userId: testUserId });
            await userService.deleteUserData(testUserId);
            // Prüfe ob Benutzer gelöscht wurde
            const user = await testPrisma.user.findUnique({
                where: { id: testUserId }
            });
            expect(user).toBeNull();
            // Prüfe ob Profile gelöscht wurden (Cascading Delete)
            const profile = await testPrisma.userProfile.findUnique({
                where: { userId: testUserId }
            });
            expect(profile).toBeNull();
            // Prüfe ob Sessions gelöscht wurden
            const redisSession = await redis_1.redis.getSession(sessionToken);
            expect(redisSession).toBeNull();
        });
        it('should throw error for non-existent user', async () => {
            await expect(userService.deleteUserData('non-existent')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
    });
});
