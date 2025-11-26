# Payment System - Fehlerbehandlung

## Übersicht

Dieses Dokument beschreibt die Fehlerbehandlungsstrategien im SmartLaw Payment System, einschließlich Fehlertypen, Retry-Logik und Benutzer-Kommunikation.

## Fehlertypen

### 1. Validierungsfehler (400 Bad Request)

Fehler bei ungültigen Eingabedaten.

**Beispiele:**
```typescript
// Fehlende Booking ID
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Booking ID ist erforderlich",
    "field": "bookingId"
  }
}

// Ungültiger Erstattungsbetrag
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erstattungsbetrag kann nicht höher als Zahlungsbetrag sein",
    "details": {
      "requestedAmount": 25000,
      "maxAmount": 20000
    }
  }
}
```

**Behandlung:**
- Eingaben vor Absenden validieren
- Benutzerfreundliche Fehlermeldungen anzeigen
- Fehlerhafte Felder hervorheben

### 2. Authentifizierungsfehler (401 Unauthorized)

Fehler bei fehlender oder ungültiger Authentifizierung.

```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung erforderlich"
  }
}
```

**Behandlung:**
- Nutzer zur Login-Seite weiterleiten
- Session erneuern
- Refresh Token verwenden

### 3. Autorisierungsfehler (403 Forbidden)

Fehler bei unzureichenden Berechtigungen.

```typescript
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Keine Berechtigung für diese Zahlung"
  }
}
```

**Behandlung:**
- Zugriff verweigern
- Benutzer informieren
- Keine sensiblen Details preisgeben

### 4. Nicht gefunden (404 Not Found)

Ressource existiert nicht.

```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Zahlung nicht gefunden",
    "resourceId": "payment-123"
  }
}
```

**Behandlung:**
- Überprüfen ob ID korrekt ist
- Nutzer zur Übersichtsseite leiten
- Hilfreiche Alternativen anbieten

### 5. Konfliktfehler (409 Conflict)

Ressource existiert bereits oder Zustand erlaubt Operation nicht.

```typescript
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Zahlung für diese Buchung existiert bereits",
    "existingPaymentId": "payment-456"
  }
}
```

**Behandlung:**
- Existierende Ressource verwenden
- Nutzer über Konflikt informieren
- Alternative Aktionen anbieten

### 6. Stripe-Fehler

Fehler von der Stripe-API.

#### 6.1 Kartenfehler

```typescript
{
  "success": false,
  "error": {
    "code": "STRIPE_CARD_ERROR",
    "message": "Ihre Karte wurde abgelehnt",
    "stripeCode": "card_declined",
    "declineCode": "insufficient_funds"
  }
}
```

**Häufige Kartenfehler:**
- `card_declined`: Karte abgelehnt
- `insufficient_funds`: Unzureichende Deckung
- `expired_card`: Karte abgelaufen
- `incorrect_cvc`: Falscher CVC-Code
- `processing_error`: Verarbeitungsfehler

**Behandlung:**
```typescript
switch (error.stripeCode) {
  case 'card_declined':
    if (error.declineCode === 'insufficient_funds') {
      return 'Unzureichende Deckung. Bitte verwenden Sie eine andere Karte.';
    }
    return 'Ihre Karte wurde abgelehnt. Bitte kontaktieren Sie Ihre Bank.';
  
  case 'expired_card':
    return 'Ihre Karte ist abgelaufen. Bitte verwenden Sie eine gültige Karte.';
  
  case 'incorrect_cvc':
    return 'Der CVC-Code ist falsch. Bitte überprüfen Sie Ihre Eingabe.';
  
  default:
    return 'Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.';
}
```

#### 6.2 API-Fehler

```typescript
{
  "success": false,
  "error": {
    "code": "STRIPE_API_ERROR",
    "message": "Stripe-Service vorübergehend nicht verfügbar",
    "retryable": true
  }
}
```

**Behandlung:**
- Automatischer Retry mit Exponential Backoff
- Nutzer über temporäres Problem informieren
- Fallback auf Mock-Service in Entwicklung

#### 6.3 Webhook-Fehler

```typescript
{
  "success": false,
  "error": {
    "code": "WEBHOOK_SIGNATURE_ERROR",
    "message": "Ungültige Webhook-Signatur"
  }
}
```

**Behandlung:**
- Webhook ablehnen
- Security-Team benachrichtigen
- Verdächtige Aktivität loggen

### 7. Datenbankfehler (500 Internal Server Error)

Fehler bei Datenbankoperationen.

```typescript
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Ein interner Fehler ist aufgetreten",
    "requestId": "req-abc-123"
  }
}
```

**Behandlung:**
- Fehler loggen mit vollem Stack Trace
- Generische Fehlermeldung an Nutzer
- Monitoring-Alert auslösen
- Request ID für Support bereitstellen

## Retry-Strategien

### Exponential Backoff

Für transiente Fehler (Netzwerk, API-Limits):

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1 || !isRetryable(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      await sleep(delay + jitter);
      
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
        error: error.message,
        nextDelay: delay
      });
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryable(error: any): boolean {
  // Stripe-spezifische Retry-Logik
  if (error instanceof Stripe.errors.StripeError) {
    return error.type === 'StripeConnectionError' ||
           error.type === 'StripeAPIError' ||
           (error.statusCode && error.statusCode >= 500);
  }
  
  // Datenbank-Timeouts
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
    return true;
  }
  
  return false;
}
```

### Idempotenz

Alle Payment-Operationen sind idempotent:

```typescript
// Payment Intent mit Idempotency Key
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 20000,
    currency: 'eur',
    // ...
  },
  {
    idempotencyKey: `booking-${bookingId}-${userId}`
  }
);
```

**Vorteile:**
- Sichere Wiederholung bei Netzwerkfehlern
- Vermeidung von Doppelzahlungen
- Konsistente Ergebnisse

## Fehlerbehandlung im Code

### Service Layer

```typescript
export class PaymentService {
  async createPaymentIntent(
    bookingId: string,
    userId: string
  ): Promise<PaymentIntent> {
    try {
      // Validierung
      if (!bookingId || !userId) {
        throw new ValidationError('Booking ID und User ID sind erforderlich');
      }

      // Geschäftslogik
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      // Prüfe auf existierende Zahlung
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED] }
        }
      });

      if (existingPayment) {
        throw new ConflictError('Zahlung für diese Buchung existiert bereits');
      }

      // Erstelle Payment
      const payment = await this.prisma.payment.create({
        data: {
          bookingId,
          userId,
          // ...
        }
      });

      logger.info('Payment intent created', { paymentId: payment.id });
      return this.mapToPaymentIntent(payment);

    } catch (error) {
      // Spezifische Fehlerbehandlung
      if (error instanceof ValidationError ||
          error instanceof NotFoundError ||
          error instanceof ConflictError) {
        throw error;
      }

      // Unerwartete Fehler
      logger.error('Error creating payment intent', {
        error: error.message,
        stack: error.stack,
        bookingId,
        userId
      });

      throw new Error('Fehler beim Erstellen der Zahlung');
    }
  }
}
```

### Controller Layer

```typescript
export class PaymentController {
  static async createPaymentIntent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { bookingId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentifizierung erforderlich'
          }
        });
        return;
      }

      const paymentIntent = await paymentService.createPaymentIntent(
        bookingId,
        userId
      );

      res.status(201).json({
        success: true,
        data: paymentIntent
      });

    } catch (error) {
      // Fehler an Error Handler Middleware weiterleiten
      next(error);
    }
  }
}
```

### Error Handler Middleware

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Stripe-Fehler
  if (err instanceof Stripe.errors.StripeError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'STRIPE_ERROR',
        message: getStripeErrorMessage(err),
        stripeCode: err.code,
        type: err.type
      }
    });
  }

  // Validierungsfehler
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }

  // Not Found
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message
      }
    });
  }

  // Conflict
  if (err instanceof ConflictError) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: err.message
      }
    });
  }

  // Generischer Fehler
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ein interner Fehler ist aufgetreten',
      requestId: req.id
    }
  });
}

function getStripeErrorMessage(error: Stripe.errors.StripeError): string {
  switch (error.type) {
    case 'StripeCardError':
      return 'Ihre Karte wurde abgelehnt. Bitte verwenden Sie eine andere Zahlungsmethode.';
    case 'StripeInvalidRequestError':
      return 'Ungültige Zahlungsanfrage. Bitte versuchen Sie es erneut.';
    case 'StripeAPIError':
      return 'Zahlungsservice vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
    case 'StripeConnectionError':
      return 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
    case 'StripeAuthenticationError':
      return 'Authentifizierungsfehler. Bitte kontaktieren Sie den Support.';
    default:
      return 'Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.';
  }
}
```

## Frontend-Fehlerbehandlung

### React Error Boundary

```typescript
class PaymentErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Payment component error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          title="Zahlungsfehler"
          message="Bei der Verarbeitung Ihrer Zahlung ist ein Fehler aufgetreten."
          action={{
            label: 'Erneut versuchen',
            onClick: () => this.setState({ hasError: false, error: null })
          }}
        />
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
async function createPayment(bookingId: string): Promise<PaymentIntent> {
  try {
    const response = await api.post('/payments/intent', { bookingId });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data?.error;
      
      switch (apiError?.code) {
        case 'VALIDATION_ERROR':
          throw new ValidationError(apiError.message);
        case 'NOT_FOUND':
          throw new NotFoundError('Buchung nicht gefunden');
        case 'CONFLICT':
          throw new ConflictError('Zahlung existiert bereits');
        case 'STRIPE_ERROR':
          throw new StripeError(apiError.message, apiError.stripeCode);
        default:
          throw new Error('Zahlung fehlgeschlagen');
      }
    }
    throw error;
  }
}
```

### User Feedback

```typescript
function PaymentForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await createPayment(bookingId);
      
      showSuccessNotification('Zahlung erfolgreich!');
      navigate('/bookings');
      
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else if (err instanceof StripeError) {
        setError(getStripeErrorMessage(err.code));
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
      
      logger.error('Payment failed', { error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Button
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? 'Verarbeite Zahlung...' : 'Jetzt bezahlen'}
      </Button>
    </div>
  );
}
```

## Monitoring und Alerting

### Fehler-Metriken

```typescript
// Prometheus Metriken
const paymentErrorCounter = new Counter({
  name: 'payment_errors_total',
  help: 'Total number of payment errors',
  labelNames: ['error_type', 'error_code']
});

const paymentDuration = new Histogram({
  name: 'payment_duration_seconds',
  help: 'Payment processing duration',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Fehler tracken
paymentErrorCounter.inc({
  error_type: 'stripe_error',
  error_code: 'card_declined'
});
```

### Alert-Regeln

```yaml
# Prometheus Alert Rules
groups:
  - name: payment_alerts
    rules:
      - alert: HighPaymentErrorRate
        expr: rate(payment_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Hohe Fehlerrate bei Zahlungen"
          description: "{{ $value }} Fehler pro Sekunde in den letzten 5 Minuten"

      - alert: StripeAPIDown
        expr: up{job="stripe"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Stripe API nicht erreichbar"
          description: "Stripe API antwortet nicht seit 2 Minuten"
```

## Best Practices

### 1. Immer spezifische Fehlertypen verwenden

```typescript
// ❌ Schlecht
throw new Error('Fehler');

// ✅ Gut
throw new ValidationError('Booking ID ist erforderlich');
```

### 2. Sensible Daten nicht in Fehlermeldungen

```typescript
// ❌ Schlecht
throw new Error(`Zahlung für Karte ${cardNumber} fehlgeschlagen`);

// ✅ Gut
throw new Error('Zahlung fehlgeschlagen');
```

### 3. Fehler immer loggen

```typescript
try {
  await processPayment();
} catch (error) {
  logger.error('Payment processing failed', {
    error: error.message,
    stack: error.stack,
    userId,
    bookingId
  });
  throw error;
}
```

### 4. Benutzerfreundliche Fehlermeldungen

```typescript
// ❌ Schlecht
"Database constraint violation on payment_booking_id_unique"

// ✅ Gut
"Für diese Buchung existiert bereits eine Zahlung"
```

### 5. Request IDs für Debugging

```typescript
// Jeder Request erhält eine eindeutige ID
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// In Fehlermeldungen einschließen
{
  "error": {
    "message": "Ein Fehler ist aufgetreten",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Troubleshooting Guide

### Problem: Zahlung hängt im PENDING-Status

**Ursachen:**
- Webhook nicht empfangen
- Stripe-Callback fehlgeschlagen
- Netzwerkprobleme

**Lösung:**
1. Stripe Dashboard prüfen
2. Webhook-Logs überprüfen
3. Manuell Payment Status synchronisieren:
```typescript
POST /api/payments/:paymentId/sync
```

### Problem: Doppelte Zahlungen

**Ursachen:**
- Fehlende Idempotenz
- Race Conditions
- Mehrfache Button-Clicks

**Lösung:**
1. Idempotency Keys verwenden
2. Button während Verarbeitung deaktivieren
3. Datenbank-Constraints prüfen

### Problem: Rückerstattung schlägt fehl

**Ursachen:**
- Payment Intent bereits erstattet
- Unzureichende Berechtigungen
- Stripe-Limits überschritten

**Lösung:**
1. Payment Status in Stripe prüfen
2. Refund-Historie überprüfen
3. Stripe-Support kontaktieren

## Support-Kontakt

Bei technischen Problemen:
- **E-Mail:** tech-support@smartlaw.de
- **Slack:** #payment-support
- **On-Call:** +49 30 1234567 (24/7)
