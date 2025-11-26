# Payment Integration System

## Übersicht

Das Payment-System ermöglicht die sichere Abwicklung von Zahlungen für Anwaltsberatungen im SmartLaw Mietrecht-Agent. Es unterstützt verschiedene Zahlungsmethoden, automatische Rechnungserstellung und Rückerstattungen.

## Architektur

### Komponenten

1. **PaymentService**: Kernlogik für Zahlungsabwicklung
2. **PaymentController**: REST API Endpunkte
3. **Prisma Models**: Datenbank-Schema für Payments, Invoices, Refunds

### Datenmodelle

```typescript
Payment {
  id: string
  bookingId: string
  userId: string
  lawyerId: string
  amount: number (in Cent)
  currency: string
  status: PaymentStatus
  paymentMethod: PaymentMethod
  transactionId?: string
  invoiceUrl?: string
  refundedAmount?: number
  paidAt?: Date
}

Invoice {
  id: string
  paymentId: string
  invoiceNumber: string
  amount: number (Netto)
  taxAmount: number (19% MwSt)
  totalAmount: number
  issueDate: Date
  dueDate: Date
  pdfUrl?: string
}

Refund {
  id: string
  paymentId: string
  amount: number
  reason: string
  status: string
  processedAt?: Date
}
```

## Features

### 1. Payment Intent Erstellung

Erstellt einen Payment Intent für eine Buchung:

```typescript
POST /api/payments/intent
{
  "bookingId": "booking-123"
}

Response:
{
  "id": "payment-123",
  "amount": 18000,
  "currency": "EUR",
  "status": "PENDING",
  "clientSecret": "pi_xxx_secret_yyy",
  "metadata": {
    "bookingId": "booking-123",
    "userId": "user-123",
    "lawyerId": "lawyer-123"
  }
}
```

**Berechnung:**
- Dauer = Endzeit - Startzeit (in Minuten)
- Betrag = (Stundensatz / 60) * Dauer * 100 (in Cent)
- Standard-Stundensatz: 150€ wenn nicht angegeben

### 2. Zahlungsbestätigung

Bestätigt eine erfolgreiche Zahlung:

```typescript
POST /api/payments/:paymentId/confirm
{
  "transactionId": "txn-123"
}
```

**Aktionen:**
- Aktualisiert Payment-Status auf COMPLETED
- Setzt paidAt Timestamp
- Aktualisiert Booking paymentStatus auf PAID

### 3. Rechnungserstellung

Generiert automatisch eine Rechnung nach erfolgreicher Zahlung:

```typescript
POST /api/payments/:paymentId/invoice

Response:
{
  "id": "invoice-123",
  "invoiceNumber": "INV-202401-0001",
  "amount": 18000,
  "taxAmount": 3420,
  "totalAmount": 21420,
  "currency": "EUR",
  "items": [
    {
      "description": "Rechtsberatung - Dr. Schmidt",
      "quantity": 60,
      "unitPrice": 300,
      "totalPrice": 18000,
      "taxRate": 0.19
    }
  ]
}
```

**Steuerberechnung:**
- MwSt-Satz: 19% (Deutschland)
- Nettobetrag = Zahlungsbetrag
- Steuerbetrag = Nettobetrag * 0.19
- Gesamtbetrag = Nettobetrag + Steuerbetrag

**Rechnungsnummer-Format:**
- `INV-YYYYMM-XXXX`
- Beispiel: `INV-202401-0001`

### 4. Rückerstattungen

Unterstützt vollständige und teilweise Rückerstattungen:

```typescript
POST /api/payments/:paymentId/refund
{
  "amount": 9000,  // Optional für Teilerstattung
  "reason": "Stornierung durch Nutzer"
}
```

**Validierungen:**
- Nur COMPLETED Zahlungen können erstattet werden
- Erstattungsbetrag ≤ Zahlungsbetrag
- Nur Nutzer kann Erstattung anfordern

### 5. Zahlungsstatistiken

Für Anwälte verfügbar:

```typescript
GET /api/lawyers/:lawyerId/payment-stats

Response:
{
  "totalEarnings": 33000,
  "pendingPayments": 1,
  "completedPayments": 2,
  "refundedPayments": 1
}
```

## API Endpunkte

### Payments

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/payments/intent` | Erstellt Payment Intent |
| POST | `/api/payments/:id/confirm` | Bestätigt Zahlung |
| GET | `/api/payments/:id` | Holt Zahlungsdetails |
| GET | `/api/payments` | Listet Nutzerzahlungen |
| POST | `/api/payments/:id/refund` | Erstellt Rückerstattung |

### Invoices

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/payments/:id/invoice` | Generiert Rechnung |
| GET | `/api/invoices/:id` | Holt Rechnungsdetails |

### Statistics

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/lawyers/:id/payment-stats` | Anwalts-Statistiken |

## Sicherheit

### Authentifizierung

Alle Endpunkte erfordern JWT-Authentifizierung:

```typescript
Authorization: Bearer <jwt-token>
```

### Autorisierung

- **Nutzer**: Kann nur eigene Zahlungen sehen und verwalten
- **Anwalt**: Kann Zahlungen für eigene Buchungen sehen
- **Admin**: Voller Zugriff (zukünftig)

### Datenschutz

- Zahlungsdaten werden verschlüsselt gespeichert
- Sensible Daten (Kreditkartennummern) werden nicht gespeichert
- DSGVO-konforme Datenverarbeitung
- Audit-Logging für alle Zahlungsvorgänge

## Payment Gateway Integration

### Entwicklung (Mock)

Für Entwicklung und Tests kann ein Mock-Payment-Gateway verwendet werden:

```bash
# In .env
USE_STRIPE=false
```

Der Mock-Service generiert Test-Client-Secrets ohne echte Zahlungen.

### Produktion (Stripe)

Für Produktion ist Stripe vollständig integriert:

#### Konfiguration

```bash
# In .env
USE_STRIPE=true
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Installation

```bash
npm install stripe
```

#### Features

- **Payment Intents**: Sichere Zahlungsabwicklung mit 3D Secure
- **Webhooks**: Asynchrone Benachrichtigungen über Zahlungsstatus
- **Refunds**: Automatische Rückerstattungen über Stripe API
- **Metadata**: Tracking von Buchungs- und Nutzerdaten
- **Receipt Emails**: Automatische Quittungen an Kunden

#### Webhook-Einrichtung

1. Erstelle Webhook in Stripe Dashboard
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events auswählen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Webhook-Secret kopieren und in `.env` eintragen

#### Code-Beispiel

```typescript
import { StripePaymentService } from './services/StripePaymentService';

const stripeService = new StripePaymentService(
  prisma,
  process.env.STRIPE_SECRET_KEY!
);

// Payment Intent erstellen
const intent = await stripeService.createPaymentIntent(bookingId, userId);

// Zahlung bestätigen
const payment = await stripeService.confirmPayment(
  paymentId,
  stripePaymentIntentId
);

// Rückerstattung erstellen
const refund = await stripeService.createRefund(
  { paymentId, amount, reason },
  userId
);
```

### Unterstützte Zahlungsmethoden

- **CREDIT_CARD**: Kreditkarte (Visa, Mastercard, Amex)
- **DEBIT_CARD**: Debitkarte
- **PAYPAL**: PayPal
- **BANK_TRANSFER**: Banküberweisung
- **SEPA**: SEPA-Lastschrift (für EU)

## Fehlerbehandlung

### Fehlertypen

```typescript
// Zahlung nicht gefunden
{
  "code": "NOT_FOUND",
  "message": "Zahlung nicht gefunden"
}

// Ungültige Anfrage
{
  "code": "VALIDATION_ERROR",
  "message": "Erstattungsbetrag kann nicht höher als Zahlungsbetrag sein"
}

// Konflikt
{
  "code": "CONFLICT",
  "message": "Zahlung für diese Buchung existiert bereits"
}

// Nicht autorisiert
{
  "code": "UNAUTHORIZED",
  "message": "Keine Berechtigung für diese Zahlung"
}
```

### Retry-Logik

Bei Netzwerkfehlern oder temporären Ausfällen:

1. Automatischer Retry nach 1s, 5s, 30s
2. Exponential Backoff
3. Maximum 3 Versuche
4. Fehler-Logging für Monitoring

## Testing

### Unit Tests

```bash
npm test -- paymentService.test.ts
```

**Test-Coverage:**
- Payment Intent Erstellung
- Zahlungsbestätigung
- Rechnungsgenerierung
- Rückerstattungen
- Statistiken
- Fehlerszenarien

### Integration Tests

```typescript
describe('Payment Flow', () => {
  it('sollte kompletten Zahlungsablauf durchführen', async () => {
    // 1. Erstelle Buchung
    const booking = await createBooking();
    
    // 2. Erstelle Payment Intent
    const intent = await createPaymentIntent(booking.id);
    
    // 3. Simuliere Zahlung
    const payment = await confirmPayment(intent.id, 'txn-123');
    
    // 4. Generiere Rechnung
    const invoice = await generateInvoice(payment.id);
    
    expect(invoice.status).toBe('PAID');
  });
});
```

## Monitoring

### Metriken

- **payment_intent_created**: Anzahl erstellter Payment Intents
- **payment_confirmed**: Anzahl bestätigter Zahlungen
- **payment_failed**: Anzahl fehlgeschlagener Zahlungen
- **refund_created**: Anzahl Rückerstattungen
- **average_payment_amount**: Durchschnittlicher Zahlungsbetrag

### Logging

Alle Zahlungsvorgänge werden geloggt:

```typescript
loggers.businessEvent('PAYMENT_CONFIRMED', userId, {
  paymentId,
  bookingId,
  amount,
  transactionId
});
```

## Compliance

### DSGVO

- Datenminimierung: Nur notwendige Zahlungsdaten
- Zweckbindung: Daten nur für Zahlungsabwicklung
- Löschfristen: Zahlungsdaten nach 10 Jahren (gesetzliche Aufbewahrungspflicht)
- Auskunftsrecht: API für Datenabruf
- Löschrecht: Anonymisierung nach Aufbewahrungsfrist

### PCI DSS

Für Kreditkartenzahlungen:
- Keine Speicherung von Kartendaten
- Verwendung von PCI-zertifiziertem Payment Gateway (Stripe)
- Verschlüsselte Übertragung (TLS 1.3)
- Tokenisierung sensibler Daten

## Zukünftige Erweiterungen

1. **Abonnements**: Monatliche Zahlungen für Business-Kunden
2. **Split Payments**: Aufteilung zwischen Plattform und Anwalt
3. **Multi-Currency**: Unterstützung weiterer Währungen
4. **Payment Plans**: Ratenzahlung für hohe Beträge
5. **Wallet**: Guthaben-System für Nutzer
6. **Coupons**: Rabattcodes und Gutscheine

## Troubleshooting

### Häufige Probleme

**Problem**: Payment Intent kann nicht erstellt werden
- **Lösung**: Prüfe ob Buchung existiert und bestätigt ist

**Problem**: Zahlung bleibt im PENDING Status
- **Lösung**: Prüfe Payment Gateway Logs, manuell bestätigen

**Problem**: Rechnung wird nicht generiert
- **Lösung**: Stelle sicher dass Zahlung COMPLETED ist

**Problem**: Rückerstattung schlägt fehl
- **Lösung**: Prüfe ob Betrag korrekt und Zahlung erstattbar

## Support

Bei Fragen oder Problemen:
- **Dokumentation**: `/docs/payment-system.md`
- **API Docs**: `http://localhost:3000/api-docs`
- **Logs**: `services/backend/logs/`
- **Tests**: `services/backend/src/tests/paymentService.test.ts`
