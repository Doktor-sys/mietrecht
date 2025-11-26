# Testing Guide - SmartLaw Web-App

## Übersicht

Die SmartLaw Web-Anwendung verwendet ein umfassendes Testing-Setup mit:
- **Jest**: Test-Runner
- **React Testing Library**: Component Testing
- **jest-axe**: Accessibility Testing
- **@testing-library/user-event**: User Interaction Testing

## Test-Struktur

```
web-app/src/
├── tests/
│   ├── test-utils.tsx              # Shared test utilities
│   ├── accessibility.test.tsx      # WCAG compliance tests
│   ├── keyboard-navigation.test.tsx # Keyboard tests
│   └── screenreader.test.tsx       # ARIA tests
├── components/
│   ├── Header.test.tsx             # Header component tests
│   └── ...
└── App.test.tsx                    # App integration tests
```

## Test-Utilities

### renderWithProviders

Utility-Funktion zum Rendern von Komponenten mit allen notwendigen Providern:

```typescript
import { renderWithProviders } from './tests/test-utils';

test('my component test', () => {
  renderWithProviders(<MyComponent />);
  // assertions...
});
```

### Mit vorgeladenen State

```typescript
import { renderWithProviders, mockAuthenticatedState } from './tests/test-utils';

test('authenticated user test', () => {
  renderWithProviders(<MyComponent />, {
    preloadedState: mockAuthenticatedState
  });
  // assertions...
});
```

## Test-Kategorien

### 1. Unit Tests

Testen einzelne Komponenten isoliert:

```typescript
describe('AccessibleButton', () => {
  test('renders with aria-label', () => {
    render(<AccessibleButton ariaLabel="Click me">Button</AccessibleButton>);
    expect(screen.getByLabelText('Click me')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<AccessibleButton loading>Button</AccessibleButton>);
    expect(screen.getByLabelText('Lädt')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Testen Komponenten-Interaktionen:

```typescript
describe('LoginPage', () => {
  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
    await user.type(screen.getByLabelText(/passwort/i), 'password123');
    await user.click(screen.getByRole('button', { name: /anmelden/i }));

    // assertions...
  });
});
```

### 3. Accessibility Tests

Testen WCAG-Compliance mit axe-core:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = renderWithProviders(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 4. Keyboard Navigation Tests

Testen Tastatur-Zugänglichkeit:

```typescript
test('form fields are keyboard navigable', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  const emailInput = screen.getByLabelText(/e-mail/i);
  const passwordInput = screen.getByLabelText(/passwort/i);

  await user.tab();
  expect(emailInput).toHaveFocus();

  await user.tab();
  expect(passwordInput).toHaveFocus();
});
```

### 5. Screenreader Tests

Testen ARIA-Attribute und Semantik:

```typescript
test('has proper ARIA labels', () => {
  renderWithProviders(<Header />);

  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByLabelText(/hauptnavigation/i)).toBeInTheDocument();
});
```

## Test-Befehle

### Alle Tests ausführen
```bash
npm test
```

### Tests im Watch-Modus
```bash
npm test -- --watch
```

### Spezifische Tests
```bash
# Nur Accessibility-Tests
npm test -- --testNamePattern="accessibility"

# Nur Keyboard-Tests
npm test -- --testNamePattern="keyboard"

# Nur Screenreader-Tests
npm test -- --testNamePattern="screenreader"

# Spezifische Datei
npm test Header.test.tsx
```

### Coverage Report
```bash
npm test -- --coverage
```

### Coverage für spezifische Dateien
```bash
npm test -- --coverage --collectCoverageFrom="src/components/**/*.tsx"
```

## Best Practices

### 1. Verwende semantische Queries

```typescript
// ✅ GOOD - Semantisch
screen.getByRole('button', { name: /anmelden/i })
screen.getByLabelText(/e-mail/i)
screen.getByText(/willkommen/i)

// ❌ BAD - Implementierungsdetails
screen.getByClassName('login-button')
screen.getByTestId('email-input')
```

### 2. Teste Benutzerverhalten

```typescript
// ✅ GOOD - Wie Benutzer interagieren
await user.type(emailInput, 'test@example.com');
await user.click(submitButton);

// ❌ BAD - Direkte State-Manipulation
fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
```

### 3. Warte auf asynchrone Updates

```typescript
// ✅ GOOD - Warten auf Element
await screen.findByText(/erfolgreich/i);

// ✅ GOOD - Warten auf Verschwinden
await waitForElementToBeRemoved(() => screen.queryByText(/lädt/i));

// ❌ BAD - Kein Warten
expect(screen.getByText(/erfolgreich/i)).toBeInTheDocument();
```

### 4. Teste Accessibility

```typescript
// Immer axe-core Tests hinzufügen
test('should have no accessibility violations', async () => {
  const { container } = renderWithProviders(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 5. Verwende Test-Utilities

```typescript
// ✅ GOOD - Wiederverwendbare Utilities
import { renderWithProviders, mockAuthenticatedState } from './tests/test-utils';

renderWithProviders(<MyComponent />, {
  preloadedState: mockAuthenticatedState
});

// ❌ BAD - Code-Duplikation
const store = configureStore({ /* ... */ });
render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <MyComponent />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);
```

## Mocking

### i18next Mock

Bereits in `setupTests.ts` konfiguriert:

```typescript
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'de',
    },
  }),
}));
```

### API Mocks

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ token: 'mock-token', user: { id: '1' } }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Redux Store Mock

```typescript
import { createMockStore } from './tests/test-utils';

const store = createMockStore({
  auth: {
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
  },
});
```

## Coverage-Ziele

### Minimum Coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Kritische Komponenten
- **Auth-Komponenten**: 90%+
- **Barrierefreie Komponenten**: 95%+
- **Formular-Komponenten**: 90%+

## Continuous Integration

### GitHub Actions Beispiel

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:accessibility
```

## Debugging Tests

### Interaktiver Modus
```bash
npm test -- --watch
```

### Debug einzelner Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand Header.test.tsx
```

### Screen Debug
```typescript
import { screen } from '@testing-library/react';

test('debug test', () => {
  renderWithProviders(<MyComponent />);
  screen.debug(); // Zeigt DOM-Struktur
});
```

### Logge Accessibility Tree
```typescript
import { logRoles } from '@testing-library/react';

test('log roles', () => {
  const { container } = renderWithProviders(<MyComponent />);
  logRoles(container);
});
```

## Troubleshooting

### Problem: "Unable to find element"
```typescript
// Lösung: Verwende findBy statt getBy für async
await screen.findByText(/text/i);

// Oder: Warte explizit
await waitFor(() => {
  expect(screen.getByText(/text/i)).toBeInTheDocument();
});
```

### Problem: "Not wrapped in act(...)"
```typescript
// Lösung: Verwende userEvent statt fireEvent
const user = userEvent.setup();
await user.click(button);
```

### Problem: "axe violations"
```typescript
// Lösung: Prüfe die Violations
const results = await axe(container);
console.log(results.violations);
```

## Ressourcen

### Dokumentation
- [React Testing Library](https://testing-library.com/react)
- [Jest](https://jestjs.io/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)

### Guides
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://testingjavascript.com/)
- [Accessibility Testing](https://www.deque.com/blog/accessibility-testing-with-jest-axe/)

## Beispiel-Tests

Siehe:
- `src/App.test.tsx` - App Integration Tests
- `src/components/Header.test.tsx` - Component Tests
- `src/tests/accessibility.test.tsx` - Accessibility Tests
- `src/tests/keyboard-navigation.test.tsx` - Keyboard Tests
- `src/tests/screenreader.test.tsx` - Screenreader Tests
