import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '../../src/config/database';

// Mock Prisma Client
jest.mock('../../src/config/database', () => ({
    __esModule: true,
    prisma: mockDeep<PrismaClient>(),
    connectDatabase: jest.fn(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    jest.clearAllMocks();
});

// Global setup/teardown if needed
afterAll(async () => {
    // Clean up resources
});
