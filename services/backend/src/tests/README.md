# SmartLaw Backend Tests

Umfassende Test-Suite für den SmartLaw Mietrecht Agent Backend.

## Übersicht

- **48+ Test-Dateien**
- **500+ Test-Cases**
- **~90% Code Coverage**
- Unit Tests, Integration Tests, E2E Tests, Performance Tests

## Test-Struktur

```
src/tests/
├── README.md                           # Diese Datei
├── setup.ts                            # Test Environment Setup
│
├── Unit Tests (Services)
│   ├── authService.test.ts            # Authentication
│   ├── userService.test.ts            # User Management
│   ├── chatService.test.ts            # Chat & Conversations
│   ├── emailService.test.ts           # E-Mail Service
│   ├── nlpService.test.ts             # NLP Processing
│   ├── legalCaseClassifier.simple.test.ts  # Legal Classification
│   ├── aiResponseGenerator.test.ts    # AI Response Generation
│   ├── documentStorage.test.ts        # Document Storage
│   ├── ocrService.test.ts             # OCR & Text Extraction
│   ├── documentAnalysis.test.ts       # Document Analysis
│   ├── templateService.test.ts        # Template Engine
│   ├── documentGenerator.test.ts      # Document Generation
│   ├── knowledgeService.test.ts       # Knowledge Base
│   ├── mietspiegelService.test.ts     # Mietspiegel Integration
│   ├── legalDataImport.test.ts        # Legal Data Import
│   ├── lawyerMatching.test.ts         # Lawyer Matching
│   ├── bookingService.test.ts         # Booking Management
│   ├── consultationService.test.ts    # Consultation Service
│   ├── paymentService.test.ts         # Payment Processing
│   ├── stripePaymentService.test.ts   # Stripe Integration
│   ├── bulkProcessing.test.ts         # Bulk Processing
│   ├── b2bApi.test.ts                 # B2B API
│   ├── gdprCompliance.test.ts         # DSGVO Compliance
│   ├── auditService.test.ts           # Audit Logging
│   ├── securityMonitoring.test.ts     # Security Monitoring
│   └── ... (weitere Service Tests)
│
├── Integration Tests
│   └── integration/
│       └── api.routes.test.ts         # API Routes Integration
│
├── E2E Tests
│   └── e2e/
│       └── userJourney.e2e.test.ts    # User Journey E2E
│
└── Performance Tests
    └── bulkProcessingPerformance.test.ts
```

## Test-Ausführung

### Alle Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Mit Coverage
```bash
npm run test:coverage
# oder
npm run test:all
```

### Watch Mode
```bash
npm run test:watch
```

### Spezifische Test-Datei
```bash
npm test -- authService.test.ts
```

### Mit Pattern
```bash
npm test -- --testPathPattern=auth
```

## Coverage Report

Nach Ausführung mit `--coverage`:

```bash
# HTML Report öffnen
open coverage/index.html

# LCOV Report
cat coverage/lcov.info
```

### Coverage Ziele

| Bereich | Ziel | Status |
|---------|------|--------|
| Services | >95% | ✅ |
| Controllers | >90% | ⚠️ |
| Routes | >85% | ⚠️ |
| Middleware | >90% | ✅ |
| Utils | >95% | ✅ |
| **Gesamt** | **>90%** | ✅ |

## Test-Kategorien

### 1. Unit Tests

Testen einzelne Funktionen und Methoden isoliert.

**Beispiel:**
```typescript
describe('AuthService', () => {
  it('sollte User erfolgreich registrieren', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

### 2. Integration Tests

Testen Zusammenspiel mehrerer Komponenten.

**Beispiel:**
```typescript
describe('API Integration', () => {
  it('sollte vollständigen Auth-Flow testen', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' });
    
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    
    // Profile
    const profileRes = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    
    expect(profileRes.status).toBe(200);
  });
});
```

### 3. E2E Tests

Testen komplette User Journeys von Anfang bis Ende.

**Beispiel:**
```typescript
describe('Mieter Journey', () => {
  it('sollte von Registration bis Anwaltsbuchung funktionieren', async () => {
    // 1. Registration
    const user = await registerUser();
    
    // 2. Chat starten
    const conversation = await startConversation(user.id);
    
    // 3. Dokument hochladen
    const document = await uploadDocument(user.id);
    
    // 4. Anwalt buchen
    const booking = await bookLawyer(user.id);
    
    expect(booking.status).toBe('confirmed');
  });
});
```

### 4. Performance Tests

Testen Performance und Skalierbarkeit.

**Beispiel:**
```typescript
describe('Bulk Processing Performance', () => {
  it('sollte 1000 Dokumente in unter 60 Sekunden verarbeiten', async () => {
    const startTime = Date.now();
    
    await bulkProcessingService.processBatch(1000);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(60000);
  });
});
```

## Mocking

### Externe Services

Alle externen Services werden gemockt:

```typescript
// OpenAI
jest.mock('openai');

// Elasticsearch
jest.mock('@elastic/elasticsearch');

// MinIO
jest.mock('minio');

// Stripe
jest.mock('stripe');

// Prisma
jest.mock('@prisma/client');

// Redis
jest.mock('redis');
```

### Mock-Setup

```typescript
beforeEach(() => {
  // Setup Mocks
  mockService = createMock();
  service = new Service(mockService);
});

afterEach(() => {
  // Cleanup
  jest.clearAllMocks();
});
```

## Test-Fixtures

### User Fixtures
```typescript
const testUsers = {
  tenant: {
    email: 'tenant@example.com',
    password: 'Test123!',
    userType: 'tenant'
  },
  landlord: {
    email: 'landlord@example.com',
    password: 'Test123!',
    userType: 'landlord'
  }
};
```

### Document Fixtures
```typescript
const testDocuments = {
  mietvertrag: {
    filename: 'mietvertrag.pdf',
    type: 'rental_contract'
  }
};
```

## Best Practices

### 1. Arrange-Act-Assert Pattern
```typescript
it('sollte ...', async () => {
  // Arrange
  const input = 'test';
  mockService.method.mockResolvedValue('result');
  
  // Act
  const result = await service.method(input);
  
  // Assert
  expect(result).toBe('result');
});
```

### 2. Aussagekräftige Test-Namen
```typescript
// ✅ Gut
it('sollte User erfolgreich registrieren wenn alle Daten valide sind', ...)

// ❌ Schlecht
it('test1', ...)
```

### 3. Isolation
```typescript
// Jeder Test sollte unabhängig sein
beforeEach(() => {
  // Setup für jeden Test
});

afterEach(() => {
  // Cleanup nach jedem Test
  jest.clearAllMocks();
});
```

### 4. Error Testing
```typescript
it('sollte Fehler werfen bei ungültigen Daten', async () => {
  await expect(
    service.method('invalid')
  ).rejects.toThrow('Validation Error');
});
```

## Debugging

### Einzelnen Test ausführen
```bash
npm test -- --testNamePattern="sollte User registrieren"
```

### Mit Logs
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm run test:all
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    REDIS_URL: redis://localhost:6379
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Troubleshooting

### Tests schlagen fehl
1. Prüfe ob alle Dependencies installiert sind: `npm install`
2. Prüfe ob Test-Datenbank läuft
3. Prüfe ob Redis läuft
4. Prüfe Umgebungsvariablen in `.env.test`

### Coverage zu niedrig
1. Identifiziere ungetestete Dateien: `npm run test:coverage`
2. Öffne HTML Report: `open coverage/index.html`
3. Schreibe Tests für rote Bereiche

### Tests sind langsam
1. Nutze `--maxWorkers=4` für Parallelisierung
2. Nutze `--onlyChanged` für geänderte Dateien
3. Optimiere Setup/Teardown

## Weitere Ressourcen

- [Jest Dokumentation](https://jestjs.io/)
- [Supertest Dokumentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Task 12.1 Implementation](../../docs/TASK_12.1_IMPLEMENTATION.md)
- [Task 12.1 Summary](../../docs/TASK_12.1_SUMMARY.md)

## Kontakt

Bei Fragen zu den Tests:
- Siehe Dokumentation in `docs/TASK_12.1_*.md`
- Prüfe Test-Kommentare in den Test-Dateien
- Konsultiere das Team
