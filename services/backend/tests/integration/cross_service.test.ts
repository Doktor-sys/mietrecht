import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';

describe('Cross-Service Integration', () => {
    let authToken: string;
    let userId: string;
    let lawyerId: string;

    beforeAll(async () => {
        // Clean up database
        await prisma.booking.deleteMany();
        await prisma.lawyer.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should allow a user to register, login, search for a lawyer, and book an appointment', async () => {
        // 1. Register User
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'integration@test.com',
                password: 'password123',
                userType: 'tenant'
            });
        expect(registerRes.status).toBe(201);
        userId = registerRes.body.user.id;

        // 2. Login User
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'integration@test.com',
                password: 'password123'
            });
        expect(loginRes.status).toBe(200);
        authToken = loginRes.body.token;

        // 3. Create Lawyer (Admin/Seed action)
        const lawyer = await prisma.lawyer.create({
            data: {
                name: 'Max Mustermann',
                email: 'lawyer@test.com',
                specializations: ['Mietrecht'],
                hourlyRate: 150,
                location: 'Berlin'
            }
        });
        lawyerId = lawyer.id;

        // 4. Search Lawyer
        const searchRes = await request(app)
            .get('/api/lawyers?query=Mietrecht')
            .set('Authorization', `Bearer ${authToken}`);
        expect(searchRes.status).toBe(200);
        expect(searchRes.body.length).toBeGreaterThan(0);
        expect(searchRes.body[0].id).toBe(lawyerId);

        // 5. Book Appointment
        const bookingRes = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                lawyerId: lawyerId,
                date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                type: 'video'
            });
        expect(bookingRes.status).toBe(201);
        expect(bookingRes.body.status).toBe('pending');
    });
});
