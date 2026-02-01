import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Authentication Workflow Integration', () => {
    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: 'integration-test'
                }
            }
        });
        await prisma.$disconnect();
        await redis.disconnect();
    });

    const testUser = {
        email: 'auth-workflow-integration-test@example.com',
        password: 'SecurePass123!',
        userType: 'tenant' as const,
        acceptedTerms: true
    };

    it('should complete full authentication workflow', async () => {
        // 1. Register new user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body).toHaveProperty('token');
        expect(registerResponse.body.user.email).toBe(testUser.email);
        expect(registerResponse.body.user.userType).toBe(testUser.userType);

        const userId = registerResponse.body.user.id;
        const authToken = registerResponse.body.token;

        // 2. Verify user is in database
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        expect(dbUser).toBeDefined();
        expect(dbUser?.email).toBe(testUser.email);

        // 3. Login with registered user
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('token');
        expect(loginResponse.body.user.email).toBe(testUser.email);

        const loginToken = loginResponse.body.token;

        // 4. Access protected route with valid token
        const profileResponse = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${loginToken}`);

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.body.email).toBe(testUser.email);

        // 5. Test token refresh
        const refreshResponse = await request(app)
            .post('/api/auth/refresh')
            .set('Authorization', `Bearer ${loginToken}`);

        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body).toHaveProperty('token');
        expect(refreshResponse.body).toHaveProperty('refreshToken');

        // 6. Logout
        const logoutResponse = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${refreshResponse.body.token}`);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.message).toBe('Successfully logged out');
    });

    it('should handle authentication errors gracefully', async () => {
        // Test registration with invalid data
        const invalidRegisterResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: '123', // Too short
                userType: 'invalid-type'
            });

        expect(invalidRegisterResponse.status).toBe(400);

        // Test login with wrong credentials
        const wrongLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

        expect(wrongLoginResponse.status).toBe(401);

        // Test access to protected route without token
        const noTokenResponse = await request(app)
            .get('/api/user/profile');

        expect(noTokenResponse.status).toBe(401);

        // Test access with invalid token
        const invalidTokenResponse = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer invalid-token');

        expect(invalidTokenResponse.status).toBe(401);
    });
});
