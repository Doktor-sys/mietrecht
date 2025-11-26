import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../../config/database';

jest.mock('../../config/database');

describe('User Journey E2E Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Setup vollständige App
    app = require('../../index').app;
  });

  describe('Mieter Journey: Von Registration bis Anwaltsvermittlung', () => {
    let authToken: string;
    let userId: string;
    let conversationId: string;
    let documentId: string;

    it('Schritt 1: Mieter registriert sich', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'mieter@example.com',
          password: 'Sicher123!',
          userType: 'tenant',
          acceptedTerms: true,
          profile: {
            firstName: 'Max',
            lastName: 'Mustermann',
            location: 'Berlin',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.userType).toBe('tenant');

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('Schritt 2: Mieter startet Chat wegen Heizungsausfall', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          initialQuery: 'Meine Heizung ist seit 3 Wochen kaputt und der Vermieter reagiert nicht',
        });

      expect(response.status).toBe(201);
      expect(response.body.category).toBe('rent_reduction');
      expect(response.body.priority).toBe('high');

      conversationId = response.body.id;
    });

    it('Schritt 3: KI gibt Rechtsberatung mit Gesetzesreferenzen', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Wie viel kann ich die Miete mindern?',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.legalReferences).toContainEqual(
        expect.objectContaining({
          reference: '§ 536 BGB',
        })
      );
      expect(response.body.suggestedActions).toBeDefined();
    });

    it('Schritt 4: Mieter lädt Mietvertrag hoch', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('PDF Content'), 'mietvertrag.pdf')
        .field('documentType', 'rental_contract');

      expect(response.status).toBe(201);
      expect(response.body.filename).toBe('mietvertrag.pdf');

      documentId = response.body.id;
    });

    it('Schritt 5: System analysiert Mietvertrag', async () => {
      const response = await request(app)
        .post(`/api/documents/${documentId}/analyze`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.documentType).toBe('rental_contract');
      expect(response.body.issues).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
      expect(response.body.riskLevel).toMatch(/low|medium|high/);
    });

    it('Schritt 6: System generiert Mängelanzeige', async () => {
      const response = await request(app)
        .post('/api/templates/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateType: 'rent_reduction_letter',
          data: {
            defect: 'Heizungsausfall',
            duration: '3 Wochen',
            landlordName: 'Herr Müller',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.document).toBeDefined();
      expect(response.body.instructions).toBeDefined();
    });

    it('Schritt 7: Fall wird zu Anwalt eskaliert', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/escalate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.escalationReason).toBeDefined();
    });

    it('Schritt 8: Mieter sucht Mietrechtsanwalt in Berlin', async () => {
      const response = await request(app)
        .get('/api/lawyers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          location: 'Berlin',
          specialization: 'Mietrecht',
          maxDistance: 10,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('specializations');
      expect(response.body[0].specializations).toContain('Mietrecht');
    });

    it('Schritt 9: Mieter bucht Beratungstermin', async () => {
      // Erst Anwalt auswählen
      const searchResponse = await request(app)
        .get('/api/lawyers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ location: 'Berlin', specialization: 'Mietrecht' });

      const lawyerId = searchResponse.body[0].id;

      // Termin buchen
      const bookingResponse = await request(app)
        .post('/api/lawyers/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lawyerId,
          conversationId,
          timeSlot: {
            date: '2024-12-15',
            time: '14:00',
          },
          consultationType: 'video',
        });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.status).toBe('confirmed');
      expect(bookingResponse.body.caseDataTransferred).toBe(true);
    });

    it('Schritt 10: Mieter bewertet Anwalt nach Beratung', async () => {
      const searchResponse = await request(app)
        .get('/api/lawyers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ location: 'Berlin' });

      const lawyerId = searchResponse.body[0].id;

      const response = await request(app)
        .post(`/api/lawyers/${lawyerId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          comment: 'Sehr kompetente Beratung, hat mir sehr geholfen!',
        });

      expect(response.status).toBe(201);
      expect(response.body.rating).toBe(5);
    });
  });

  describe('Vermieter Journey: Nebenkostenabrechnung prüfen', () => {
    let authToken: string;
    let documentId: string;

    it('Schritt 1: Vermieter registriert sich', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'vermieter@example.com',
          password: 'Sicher123!',
          userType: 'landlord',
          acceptedTerms: true,
        });

      expect(response.status).toBe(201);
      authToken = response.body.token;
    });

    it('Schritt 2: Vermieter lädt Nebenkostenabrechnung hoch', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('PDF Content'), 'nebenkosten.pdf')
        .field('documentType', 'utility_bill');

      expect(response.status).toBe(201);
      documentId = response.body.id;
    });

    it('Schritt 3: System prüft Nebenkostenabrechnung auf Fehler', async () => {
      const response = await request(app)
        .post(`/api/documents/${documentId}/analyze`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.documentType).toBe('utility_bill');
      expect(response.body.issues).toBeDefined();
      
      // Prüfe auf typische Fehler
      const issues = response.body.issues;
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/calculation_error|non_allocable_costs/),
          }),
        ])
      );
    });
  });

  describe('Business Journey: Bulk-Dokumentenanalyse', () => {
    let authToken: string;
    let apiKey: string;

    it('Schritt 1: Business-Kunde registriert sich', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'business@example.com',
          password: 'Sicher123!',
          userType: 'business',
          acceptedTerms: true,
          companyName: 'Hausverwaltung GmbH',
        });

      expect(response.status).toBe(201);
      authToken = response.body.token;
    });

    it('Schritt 2: Business-Kunde erhält API-Key', async () => {
      const response = await request(app)
        .post('/api/b2b/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Production API Key',
          permissions: ['documents:read', 'documents:write', 'documents:analyze'],
        });

      expect(response.status).toBe(201);
      expect(response.body.apiKey).toBeDefined();
      apiKey = response.body.apiKey;
    });

    it('Schritt 3: Bulk-Upload von 10 Dokumenten', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        filename: `document-${i}.pdf`,
        content: Buffer.from(`PDF Content ${i}`),
        type: 'rental_contract',
      }));

      const response = await request(app)
        .post('/api/b2b/documents/bulk-upload')
        .set('X-API-Key', apiKey)
        .send({ documents });

      expect(response.status).toBe(202);
      expect(response.body.batchId).toBeDefined();
      expect(response.body.totalDocuments).toBe(10);
    });

    it('Schritt 4: Batch-Analyse-Status abrufen', async () => {
      const uploadResponse = await request(app)
        .post('/api/b2b/documents/bulk-upload')
        .set('X-API-Key', apiKey)
        .send({ documents: [] });

      const batchId = uploadResponse.body.batchId;

      const statusResponse = await request(app)
        .get(`/api/b2b/batches/${batchId}/status`)
        .set('X-API-Key', apiKey);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).toMatch(/pending|processing|completed/);
      expect(statusResponse.body.progress).toBeDefined();
    });

    it('Schritt 5: Analytics-Report abrufen', async () => {
      const response = await request(app)
        .get('/api/b2b/analytics/report')
        .set('X-API-Key', apiKey)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDocuments');
      expect(response.body).toHaveProperty('issuesByType');
      expect(response.body).toHaveProperty('averageProcessingTime');
    });
  });
});
