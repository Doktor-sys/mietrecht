import request from 'supertest';
import { PrismaClient, PaymentStatus, BookingStatus } from '@prisma/client';
import app from '../index';
import { generateToken } from '../services/AuthService';

const prisma = new PrismaClient();

describe('Payment Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let lawyerId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Erstelle Test-Nutzer
    const user = await prisma.user.create({
      data: {
        email: 'payment-test@example.com',
        password: 'hashed_password',
        userType: 'tenant',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            language: 'de'
          }
        }
      }
    });
    userId = user.id;
    authToken = generateToken(user);

    // Erstelle Test-Anwalt
    const lawyer = await prisma.lawyer.create({
      data: {
        name: 'Dr. Test Anwalt',
        email: 'lawyer-test@example.com',
        specializations: ['Mietrecht'],
        location: 'Berlin',
        hourlyRate: 200,
        rating: 4.5,
        reviewCount: 10,
        languages: ['de', 'en']
      }
    });
    lawyerId = lawyer.id;

    // Erstelle Test-Zeitslot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        lawyerId,
        startTime: new Date('2024-06-15T10:00:00Z'),
        endTime: new Date('2024-06-15T11:00:00Z'),
        isAvailable: true
      }
    });

    // Erstelle Test-Buchung
    const booking = await prisma.booking.create({
      data: {
        userId,
        lawyerId,
        timeSlotId: timeSlot.id,
        status: BookingStatus.CONFIRMED,
        meetingType: 'VIDEO',
        paymentStatus: 'PENDING'
      }
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.timeSlot.deleteMany({ where: { lawyerId } });
    await prisma.lawyer.delete({ where: { id: lawyerId } });
    await prisma.profile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Complete Payment Flow', () => {
    let paymentId: string;

    it('sollte Payment Intent erstellen', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bookingId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        amount: 20000, // 200€ * 60 min = 200€ in Cent
        currency: 'EUR',
        status: PaymentStatus.PENDING,
        metadata: {
          bookingId,
          userId,
          lawyerId
        }
      });
      expect(response.body.data.clientSecret).toBeDefined();

      paymentId = response.body.data.id;
    });

    it('sollte Zahlung bestätigen', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transactionId: 'txn_test_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: paymentId,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_test_123'
      });
      expect(response.body.data.paidAt).toBeDefined();

      // Prüfe ob Buchungsstatus aktualisiert wurde
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      expect(booking?.paymentStatus).toBe('PAID');
    });

    it('sollte Zahlungsdetails abrufen', async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: paymentId,
        bookingId,
        userId,
        amount: 20000,
        status: PaymentStatus.COMPLETED
      });
    });

    it('sollte Rechnung generieren', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/invoice`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        paymentId,
        amount: 20000,
        taxAmount: 3800, // 19% MwSt
        totalAmount: 23800,
        currency: 'EUR'
      });
      expect(response.body.data.invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        description: expect.stringContaining('Dr. Test Anwalt'),
        quantity: 60,
        taxRate: 0.19
      });
    });

    it('sollte alle Zahlungen des Nutzers auflisten', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toMatchObject({
        id: paymentId,
        userId,
        status: PaymentStatus.COMPLETED
      });
    });
  });

  describe('Refund Flow', () => {
    let refundPaymentId: string;

    beforeAll(async () => {
      // Erstelle neue Buchung für Refund-Test
      const timeSlot = await prisma.timeSlot.create({
        data: {
          lawyerId,
          startTime: new Date('2024-06-16T10:00:00Z'),
          endTime: new Date('2024-06-16T11:00:00Z'),
          isAvailable: true
        }
      });

      const booking = await prisma.booking.create({
        data: {
          userId,
          lawyerId,
          timeSlotId: timeSlot.id,
          status: BookingStatus.CONFIRMED,
          meetingType: 'VIDEO',
          paymentStatus: 'PENDING'
        }
      });

      // Erstelle und bestätige Zahlung
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId,
          lawyerId,
          amount: 20000,
          currency: 'EUR',
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'CREDIT_CARD',
          transactionId: 'txn_refund_test',
          paidAt: new Date()
        }
      });
      refundPaymentId = payment.id;

      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'PAID' }
      });
    });

    it('sollte vollständige Rückerstattung erstellen', async () => {
      const response = await request(app)
        .post(`/api/payments/${refundPaymentId}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Termin wurde vom Anwalt abgesagt'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: refundPaymentId,
        status: PaymentStatus.REFUNDED
      });
    });

    it('sollte Fehler werfen bei Rückerstattung ohne Grund', async () => {
      const response = await request(app)
        .post(`/api/payments/${refundPaymentId}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Partial Refund Flow', () => {
    let partialRefundPaymentId: string;

    beforeAll(async () => {
      // Erstelle neue Buchung für Partial Refund-Test
      const timeSlot = await prisma.timeSlot.create({
        data: {
          lawyerId,
          startTime: new Date('2024-06-17T10:00:00Z'),
          endTime: new Date('2024-06-17T11:00:00Z'),
          isAvailable: true
        }
      });

      const booking = await prisma.booking.create({
        data: {
          userId,
          lawyerId,
          timeSlotId: timeSlot.id,
          status: BookingStatus.CONFIRMED,
          meetingType: 'VIDEO',
          paymentStatus: 'PENDING'
        }
      });

      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId,
          lawyerId,
          amount: 20000,
          currency: 'EUR',
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'CREDIT_CARD',
          transactionId: 'txn_partial_refund_test',
          paidAt: new Date()
        }
      });
      partialRefundPaymentId = payment.id;
    });

    it('sollte Teilerstattung erstellen', async () => {
      const response = await request(app)
        .post(`/api/payments/${partialRefundPaymentId}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10000, // 50% Erstattung
          reason: 'Termin wurde verkürzt'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('Lawyer Payment Stats', () => {
    it('sollte Zahlungsstatistiken für Anwalt abrufen', async () => {
      const response = await request(app)
        .get(`/api/payments/lawyers/${lawyerId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalEarnings: expect.any(Number),
        pendingPayments: expect.any(Number),
        completedPayments: expect.any(Number),
        refundedPayments: expect.any(Number)
      });
      expect(response.body.data.totalEarnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('sollte Fehler werfen bei ungültiger Booking ID', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bookingId: 'invalid-booking-id' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('sollte Fehler werfen bei doppelter Zahlung', async () => {
      // Versuche zweiten Payment Intent für dieselbe Buchung zu erstellen
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bookingId })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('sollte Fehler werfen bei Zugriff auf fremde Zahlung', async () => {
      // Erstelle anderen Nutzer
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-payment-test@example.com',
          password: 'hashed_password',
          userType: 'tenant',
          isVerified: true
        }
      });
      const otherToken = generateToken(otherUser);

      const response = await request(app)
        .get(`/api/payments/${bookingId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('sollte Fehler werfen ohne Authentifizierung', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .send({ bookingId })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Cost Transparency', () => {
    it('sollte Kostenberechnung transparent darstellen', async () => {
      // Erstelle neue Buchung mit bekannten Parametern
      const timeSlot = await prisma.timeSlot.create({
        data: {
          lawyerId,
          startTime: new Date('2024-06-18T10:00:00Z'),
          endTime: new Date('2024-06-18T10:30:00Z'), // 30 Minuten
          isAvailable: true
        }
      });

      const booking = await prisma.booking.create({
        data: {
          userId,
          lawyerId,
          timeSlotId: timeSlot.id,
          status: BookingStatus.CONFIRMED,
          meetingType: 'VIDEO',
          paymentStatus: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bookingId: booking.id })
        .expect(201);

      // Erwartete Kosten: 200€/Stunde * 0.5 Stunden = 100€ = 10000 Cent
      expect(response.body.data.amount).toBe(10000);
      expect(response.body.data.currency).toBe('EUR');

      // Cleanup
      await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.timeSlot.delete({ where: { id: timeSlot.id } });
    });

    it('sollte Rechnung mit detaillierter Kostenaufschlüsselung erstellen', async () => {
      // Verwende existierende abgeschlossene Zahlung
      const payments = await prisma.payment.findMany({
        where: {
          userId,
          status: PaymentStatus.COMPLETED
        },
        take: 1
      });

      if (payments.length === 0) {
        throw new Error('Keine abgeschlossene Zahlung für Test gefunden');
      }

      const paymentId = payments[0].id;

      const response = await request(app)
        .post(`/api/payments/${paymentId}/invoice`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const invoice = response.body.data;

      // Prüfe detaillierte Kostenaufschlüsselung
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0]).toMatchObject({
        description: expect.any(String),
        quantity: expect.any(Number),
        unitPrice: expect.any(Number),
        totalPrice: expect.any(Number),
        taxRate: 0.19
      });

      // Prüfe Steuerberechnung
      const expectedTax = Math.round(invoice.amount * 0.19);
      expect(invoice.taxAmount).toBe(expectedTax);
      expect(invoice.totalAmount).toBe(invoice.amount + invoice.taxAmount);
    });
  });
});
