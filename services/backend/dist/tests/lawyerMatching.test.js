"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const LawyerMatchingService_1 = require("../services/LawyerMatchingService");
jest.mock('../utils/logger');
describe('LawyerMatchingService', () => {
    let prisma;
    let service;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        service = new LawyerMatchingService_1.LawyerMatchingService(prisma);
        jest.clearAllMocks();
    });
    afterEach(async () => {
        await prisma.$disconnect();
    });
    const mockLawyers = [
        {
            id: 'lawyer-1',
            name: 'Dr. Max Mustermann',
            email: 'max@law.de',
            specializations: ['Mietminderung', 'Kündigungsschutz'],
            location: 'Berlin, 10115',
            rating: 4.8,
            reviewCount: 25,
            hourlyRate: 200,
            languages: ['de', 'en'],
            verified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            availableSlots: [
                {
                    id: 'slot-1',
                    lawyerId: 'lawyer-1',
                    startTime: new Date('2024-12-20T10:00:00'),
                    endTime: new Date('2024-12-20T11:00:00'),
                    available: true
                }
            ],
            reviews: [
                {
                    id: 'review-1',
                    lawyerId: 'lawyer-1',
                    userId: 'user-1',
                    bookingId: 'booking-1',
                    rating: 5,
                    comment: 'Sehr kompetent',
                    createdAt: new Date()
                }
            ]
        },
        {
            id: 'lawyer-2',
            name: 'Erika Musterfrau',
            email: 'erika@law.de',
            specializations: ['Nebenkostenabrechnung', 'Mieterhöhung'],
            location: 'Berlin, 10178',
            rating: 4.5,
            reviewCount: 15,
            hourlyRate: 180,
            languages: ['de'],
            verified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            availableSlots: [],
            reviews: []
        }
    ];
    describe('searchLawyers', () => {
        it('should search lawyers with basic criteria', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const result = await service.searchLawyers({
                specializations: ['Mietminderung']
            });
            expect(result.lawyers).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
        });
        it('should filter by minimum rating', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue([mockLawyers[0]]);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(1);
            const result = await service.searchLawyers({
                minRating: 4.7
            });
            expect(result.lawyers).toHaveLength(1);
            expect(result.lawyers[0].rating).toBeGreaterThanOrEqual(4.7);
        });
        it('should filter by max hourly rate', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue([mockLawyers[1]]);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(1);
            const result = await service.searchLawyers({
                maxHourlyRate: 190
            });
            expect(result.lawyers).toHaveLength(1);
            expect(result.lawyers[0].hourlyRate).toBeLessThanOrEqual(190);
        });
        it('should include available slots', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const result = await service.searchLawyers({});
            expect(result.lawyers[0].availableSlots).toBeDefined();
            expect(result.lawyers[0].availableSlots?.length).toBeGreaterThan(0);
        });
        it('should include review summary', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const result = await service.searchLawyers({});
            expect(result.lawyers[0].reviewSummary).toBeDefined();
            expect(result.lawyers[0].reviewSummary?.averageRating).toBe(4.8);
            expect(result.lawyers[0].reviewSummary?.totalReviews).toBe(25);
        });
    });
    describe('findBestMatches', () => {
        it('should find best matches for a case', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const matches = await service.findBestMatches('Meine Heizung ist kaputt und ich möchte die Miete mindern', 'Berlin, 10115', 3);
            expect(matches.length).toBeGreaterThan(0);
            expect(matches[0].specializations).toContain('Mietminderung');
        });
        it('should extract specializations from case description', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const matches = await service.findBestMatches('Der Vermieter will mir kündigen', 'Berlin, 10115', 3);
            expect(matches.length).toBeGreaterThan(0);
        });
    });
    describe('getLawyerProfile', () => {
        it('should get lawyer profile with details', async () => {
            jest.spyOn(prisma.lawyer, 'findUnique').mockResolvedValue(mockLawyers[0]);
            const profile = await service.getLawyerProfile('lawyer-1');
            expect(profile).toBeDefined();
            expect(profile?.name).toBe('Dr. Max Mustermann');
            expect(profile?.availableSlots).toBeDefined();
            expect(profile?.reviewSummary).toBeDefined();
        });
        it('should return null for non-existent lawyer', async () => {
            jest.spyOn(prisma.lawyer, 'findUnique').mockResolvedValue(null);
            const profile = await service.getLawyerProfile('non-existent');
            expect(profile).toBeNull();
        });
    });
    describe('addReview', () => {
        it('should add review for completed booking', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                timeSlotId: 'slot-1',
                status: 'COMPLETED',
                meetingType: 'VIDEO',
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            jest.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBooking);
            jest.spyOn(prisma.lawyerReview, 'findUnique').mockResolvedValue(null);
            jest.spyOn(prisma.lawyerReview, 'create').mockResolvedValue({});
            jest.spyOn(prisma.lawyerReview, 'findMany').mockResolvedValue([
                { rating: 5 },
                { rating: 4 }
            ]);
            jest.spyOn(prisma.lawyer, 'update').mockResolvedValue({});
            await service.addReview('lawyer-1', 'user-1', 'booking-1', 5, 'Excellent');
            expect(prisma.lawyerReview.create).toHaveBeenCalled();
        });
        it('should throw error for invalid rating', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                status: 'COMPLETED'
            };
            jest.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBooking);
            await expect(service.addReview('lawyer-1', 'user-1', 'booking-1', 6)).rejects.toThrow('Rating must be between 1 and 5');
        });
        it('should throw error for non-completed booking', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                status: 'PENDING'
            };
            jest.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBooking);
            await expect(service.addReview('lawyer-1', 'user-1', 'booking-1', 5)).rejects.toThrow('Can only review completed bookings');
        });
        it('should throw error for already reviewed booking', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                status: 'COMPLETED'
            };
            const mockReview = {
                id: 'review-1',
                bookingId: 'booking-1'
            };
            jest.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBooking);
            jest.spyOn(prisma.lawyerReview, 'findUnique').mockResolvedValue(mockReview);
            await expect(service.addReview('lawyer-1', 'user-1', 'booking-1', 5)).rejects.toThrow('Booking already reviewed');
        });
    });
    describe('recommendLawyerForCase', () => {
        it('should recommend lawyer for termination case', async () => {
            const mockCase = {
                id: 'case-1',
                userId: 'user-1',
                category: 'TERMINATION',
                priority: 'HIGH',
                description: 'Kündigung erhalten',
                user: {
                    profile: {
                        location: 'Berlin, 10115'
                    }
                }
            };
            jest.spyOn(prisma.case, 'findUnique').mockResolvedValue(mockCase);
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const result = await service.recommendLawyerForCase('case-1', 'user-1');
            expect(result.shouldRecommend).toBe(true);
            expect(result.reason).toContain('Kündigung');
            expect(result.lawyers).toBeDefined();
            expect(result.lawyers?.length).toBeGreaterThan(0);
        });
        it('should recommend lawyer for high priority case', async () => {
            const mockCase = {
                id: 'case-1',
                userId: 'user-1',
                category: 'RENT_REDUCTION',
                priority: 'HIGH',
                description: 'Dringender Fall',
                user: {
                    profile: {
                        location: 'Berlin, 10115'
                    }
                }
            };
            jest.spyOn(prisma.case, 'findUnique').mockResolvedValue(mockCase);
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue(mockLawyers);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(2);
            const result = await service.recommendLawyerForCase('case-1', 'user-1');
            expect(result.shouldRecommend).toBe(true);
            expect(result.lawyers).toBeDefined();
        });
        it('should not recommend for low priority case', async () => {
            const mockCase = {
                id: 'case-1',
                userId: 'user-1',
                category: 'OTHER',
                priority: 'LOW',
                description: 'Einfache Frage',
                user: {
                    profile: {
                        location: 'Berlin, 10115'
                    }
                }
            };
            jest.spyOn(prisma.case, 'findUnique').mockResolvedValue(mockCase);
            const result = await service.recommendLawyerForCase('case-1', 'user-1');
            expect(result.shouldRecommend).toBe(false);
            expect(result.lawyers).toBeUndefined();
        });
    });
    describe('calculateMatchScore', () => {
        it('should calculate high score for perfect match', async () => {
            jest.spyOn(prisma.lawyer, 'findMany').mockResolvedValue([mockLawyers[0]]);
            jest.spyOn(prisma.lawyer, 'count').mockResolvedValue(1);
            const matches = await service.findBestMatches('Ich brauche Hilfe bei Mietminderung und Kündigung', 'Berlin, 10115', 1);
            expect(matches[0].rating).toBeGreaterThan(4.5);
        });
    });
});
