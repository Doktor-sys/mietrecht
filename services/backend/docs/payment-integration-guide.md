# Payment Integration Guide

## Quick Start

### Entwicklung (Mock-Modus)

Für lokale Entwicklung ohne echte Zahlungen:

```bash
# .env
USE_STRIPE=false
```

Der Mock-Service simuliert Zahlungen ohne Stripe-Verbindung.

### Produktion (Stripe)

Für echte Zahlungen mit Stripe:

```bash
# .env
USE_STRIPE=true
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## Zahlungsablauf

### 1. Payment Intent erstellen (Backend)

```typescript
// Client sendet Buchungs-ID
POST /api/payments/intent
{
  "bookingId": "booking-123"
}

// Backend erstellt Payment Intent
const intent = await stripeService.createPaymentIntent(bookingId, userId);

// Response enthält Client Secret
{
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 18000,
  "currency": "EUR"
}
```

### 2. Zahlung durchführen (Frontend)

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(publishableKey);

const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://your-site.com/payment/success'
  }
});
```

### 3. Webhook-Benachrichtigung (Backend)

```typescript
// Stripe sendet Webhook
POST /api/webhooks/stripe
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe_123",
      "status": "succeeded"
    }
  }
}

// Backend aktualisiert Status
- Payment: PENDING → COMPLETED
- Booking: paymentStatus → PAID
```

### 4. Bestätigung (Frontend)

```typescript
// Nach Redirect zurück zur App
const paymentIntentId = new URLSearchParams(window.location.search).get('payment_intent');

// Bestätige im Backend
await fetch(`/api/payments/${paymentId}/confirm`, {
  method: 'POST',
  body: JSON.stringify({ transactionId: paymentIntentId })
});
```

## Kostenberechnung

### Automatische Berechnung

Der Service berechnet automatisch basierend auf:

```typescript
const duration = endTime - startTime; // in Minuten
const hourlyRate = lawyer.hourlyRate || 150; // €/Stunde
const amount = (hourlyRate / 60) * duration * 100; // in Cent
```

### Beispiele

| Dauer | Stundensatz | Betrag |
|-------|-------------|--------|
| 30 min | 150€ | 75,00€ |
| 60 min | 180€ | 180,00€ |
| 90 min | 200€ | 300,00€ |

## Rückerstattungen

### Vollständige Rückerstattung

```typescript
POST /api/payments/:paymentId/refund
{
  "reason": "Stornierung durch Nutzer"
}
```

### Teilweise Rückerstattung

```typescript
POST /api/payments/:paymentId/refund
{
  "amount": 9000, // 90€ in Cent
  "reason": "Beratung nur 30 statt 60 Minuten"
}
```

## Rechnungserstellung

### Automatische Rechnung

Nach erfolgreicher Zahlung automatisch:

```typescript
POST /api/payments/:paymentId/invoice

// Generiert Rechnung mit:
- Rechnungsnummer: INV-202401-0001
- Nettobetrag: 180,00€
- MwSt (19%): 34,20€
- Gesamtbetrag: 214,20€
```

### Rechnung abrufen

```typescript
GET /api/invoices/:invoiceId

{
  "invoiceNumber": "INV-202401-0001",
  "amount": 18000,
  "taxAmount": 3420,
  "totalAmount": 21420,
  "items": [
    {
      "description": "Rechtsberatung - Dr. Schmidt",
      "quantity": 60,
      "unitPrice": 300,
      "totalPrice": 18000
    }
  ]
}
```

## Transparenz für Nutzer

### Kostenübersicht vor Buchung

```typescript
// Zeige Kosten vor Buchung
GET /api/lawyers/:lawyerId

{
  "hourlyRate": 180,
  "estimatedCost": {
    "30min": 90,
    "60min": 180,
    "90min": 270
  }
}
```

### Zahlungshistorie

```typescript
GET /api/payments

[
  {
    "id": "payment-1",
    "amount": 18000,
    "status": "COMPLETED",
    "paidAt": "2024-01-15T10:30:00Z",
    "booking": {
      "lawyer": "Dr. Schmidt",
      "duration": 60
    }
  }
]
```

## Fehlerbehandlung

### Client-Fehler

```typescript
try {
  const result = await stripe.confirmPayment(...);
} catch (error) {
  if (error.type === 'card_error') {
    // Karte abgelehnt
    showError('Ihre Karte wurde abgelehnt. Bitte verwenden Sie eine andere Zahlungsmethode.');
  } else if (error.type === 'validation_error') {
    // Ungültige Eingabe
    showError('Bitte überprüfen Sie Ihre Eingaben.');
  } else {
    // Allgemeiner Fehler
    showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
}
```

### Server-Fehler

```typescript
// Backend gibt strukturierte Fehler zurück
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Stripe Fehler: Your card was declined",
    "details": {
      "stripeCode": "card_declined"
    }
  }
}
```

## Testing

### Test-Szenarien

```typescript
describe('Payment Flow', () => {
  it('sollte erfolgreiche Zahlung durchführen', async () => {
    // 1. Erstelle Buchung
    const booking = await createBooking();
    
    // 2. Erstelle Payment Intent
    const intent = await createPaymentIntent(booking.id);
    expect(intent.clientSecret).toBeDefined();
    
    // 3. Simuliere Stripe-Zahlung
    const payment = await confirmPayment(intent.id, 'pi_test_123');
    expect(payment.status).toBe('COMPLETED');
    
    // 4. Prüfe Buchungsstatus
    const updatedBooking = await getBooking(booking.id);
    expect(updatedBooking.paymentStatus).toBe('PAID');
  });

  it('sollte Rückerstattung durchführen', async () => {
    const payment = await createCompletedPayment();
    
    const refund = await createRefund({
      paymentId: payment.id,
      reason: 'Test-Stornierung'
    });
    
    expect(refund.status).toBe('REFUNDED');
  });
});
```

### Test-Karten

| Karte | Ergebnis |
|-------|----------|
| 4242 4242 4242 4242 | Erfolg |
| 4000 0000 0000 9995 | Abgelehnt |
| 4000 0025 0000 3155 | 3D Secure |

## Monitoring

### Wichtige Metriken

```typescript
// Zahlungsstatistiken für Anwalt
GET /api/lawyers/:lawyerId/payment-stats

{
  "totalEarnings": 33000, // 330€
  "pendingPayments": 1,
  "completedPayments": 5,
  "refundedPayments": 1
}
```

### Logs

```typescript
// Business Events werden geloggt
loggers.businessEvent('PAYMENT_CONFIRMED', userId, {
  paymentId,
  amount,
  stripeIntentId
});

// Fehler werden geloggt
logger.error('Stripe API error:', {
  type: error.type,
  message: error.message,
  code: error.code
});
```

## Best Practices

### 1. Idempotenz

```typescript
// Verwende eindeutige IDs für Requests
const idempotencyKey = `payment-${bookingId}-${Date.now()}`;

await stripe.paymentIntents.create({
  ...params
}, {
  idempotencyKey
});
```

### 2. Fehler-Retry

```typescript
// Automatischer Retry bei Netzwerkfehlern
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await stripe.paymentIntents.create(...);
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await sleep(1000 * (i + 1));
  }
}
```

### 3. Webhook-Verifizierung

```typescript
// IMMER Webhook-Signatur prüfen
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);
```

### 4. Doppelte Zahlungen vermeiden

```typescript
// Prüfe ob Zahlung bereits existiert
const existing = await prisma.payment.findFirst({
  where: {
    bookingId,
    status: { in: ['PENDING', 'COMPLETED'] }
  }
});

if (existing) {
  throw new ConflictError('Zahlung existiert bereits');
}
```

## Checkliste für Go-Live

- [ ] Stripe Live-Keys konfiguriert
- [ ] Webhook in Produktion eingerichtet
- [ ] SSL/TLS aktiviert
- [ ] Fehlerbehandlung getestet
- [ ] Monitoring eingerichtet
- [ ] Backup-Strategie definiert
- [ ] Support-Prozess etabliert
- [ ] Datenschutz-Dokumentation aktualisiert
- [ ] Erste Test-Transaktion durchgeführt
- [ ] Rückerstattungs-Prozess getestet

## Support-Kontakte

- **Stripe Support**: https://support.stripe.com
- **Technische Dokumentation**: https://stripe.com/docs
- **Status**: https://status.stripe.com
- **Community**: https://github.com/stripe

## Weitere Ressourcen

- [Stripe Integration Guide](./stripe-integration.md)
- [Payment System Documentation](./payment-system.md)
- [API Documentation](http://localhost:3001/api-docs)
