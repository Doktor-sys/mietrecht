# Barrierefreiheit (Accessibility) - SmartLaw Web-App

## Übersicht

Die SmartLaw Web-Anwendung ist nach **WCAG 2.1 Level AA** Standards entwickelt und bietet umfassende Barrierefreiheit für alle Nutzer.

## Implementierte Features

### 1. WCAG 2.1 AA-konforme Komponenten

#### Barrierefreie Basis-Komponenten
- **AccessibleButton**: Button mit Loading-State und ARIA-Labels
- **AccessibleTextField**: Textfeld mit vollständiger ARIA-Unterstützung
- **AccessibleAlert**: Alert-Komponente mit Live-Regions
- **SkipToContent**: Skip-Link für Tastaturnutzer

#### ARIA-Attribute
Alle interaktiven Elemente haben:
- `aria-label`: Beschreibende Labels
- `aria-describedby`: Zusätzliche Beschreibungen
- `aria-required`: Pflichtfelder-Kennzeichnung
- `aria-invalid`: Fehler-Status
- `aria-live`: Dynamische Inhalte
- `aria-pressed`: Toggle-Status (Sprachauswahl)
- `aria-expanded`: Aufklapp-Status (Menüs)

### 2. Semantisches HTML

#### Landmark-Rollen
```html
<header role="banner">        <!-- Header -->
<nav role="navigation">       <!-- Navigation -->
<main role="main">            <!-- Hauptinhalt -->
<footer role="contentinfo">   <!-- Footer -->
<form aria-label="...">       <!-- Formulare -->
<region aria-labelledby="..."> <!-- Bereiche -->
```

#### Überschriften-Hierarchie
- Korrekte H1-H6 Struktur
- Eindeutige Seitentitel
- Logische Dokumentstruktur

### 3. Keyboard-Navigation

#### Vollständige Tastaturunterstützung
- **Tab**: Vorwärts navigieren
- **Shift + Tab**: Rückwärts navigieren
- **Enter/Space**: Elemente aktivieren
- **Escape**: Dialoge/Menüs schließen
- **Arrow Keys**: In Menüs navigieren

#### Focus-Management
- Sichtbare Focus-Indikatoren
- Logische Tab-Reihenfolge
- Focus-Trap in Modals
- Skip-to-Content Link

#### Beispiel: Login-Formular
```
Tab 1: E-Mail-Feld
Tab 2: Passwort-Feld
Tab 3: Anmelden-Button
Tab 4: Registrierungs-Link
```

### 4. Screenreader-Support

#### NVDA / JAWS / VoiceOver Kompatibilität
- Alle Formularfelder haben Labels
- Fehler werden als Alerts angekündigt
- Loading-States werden kommuniziert
- Dynamische Inhalte nutzen Live-Regions

#### Live-Regions
```typescript
// Fehler: assertive (sofort)
<Alert aria-live="assertive" role="alert">
  Fehler beim Anmelden
</Alert>

// Status: polite (nach aktuellem Inhalt)
<Alert aria-live="polite">
  Erfolgreich gespeichert
</Alert>
```

#### Formular-Feedback
- Fehler werden mit `role="alert"` angekündigt
- Helper-Text mit `aria-describedby` verknüpft
- Required-Felder mit `aria-required="true"`

### 5. Mehrsprachigkeit (i18n)

#### Unterstützte Sprachen
- 🇩🇪 **Deutsch** (Standard)
- 🇹🇷 **Türkisch**
- 🇸🇦 **Arabisch**

#### Sprachumschaltung
- Tastaturzugänglich
- Screenreader-freundlich
- Visuelles Feedback (aria-pressed)
- Persistente Sprachauswahl

#### ARIA-Labels in allen Sprachen
```typescript
// Deutsch
aria-label="Sprache auf Deutsch ändern"

// Türkisch
aria-label="Dili Türkçe olarak değiştir"

// Arabisch
aria-label="تغيير اللغة إلى العربية"
```

### 6. Farbkontrast

#### WCAG AA Kontraste
- **Normal Text**: Mindestens 4.5:1
- **Großer Text**: Mindestens 3:1
- **UI-Komponenten**: Mindestens 3:1

#### Material-UI Theme
```typescript
primary: '#1976d2'    // Kontrast: 4.6:1 auf Weiß
secondary: '#dc004e'  // Kontrast: 6.4:1 auf Weiß
```

### 7. Responsive Design

#### Mobile Barrierefreiheit
- Touch-Targets mindestens 44x44px
- Zoom bis 200% ohne Funktionsverlust
- Responsive Schriftgrößen
- Mobile Screenreader-Support

## Testing

### Automatisierte Tests

#### axe-core Integration
```bash
npm test -- --testNamePattern="accessibility"
```

Tests prüfen:
- ✅ ARIA-Attribute
- ✅ Farbkontraste
- ✅ Formular-Labels
- ✅ Überschriften-Hierarchie
- ✅ Landmark-Rollen

#### Keyboard-Navigation Tests
```bash
npm test -- --testNamePattern="keyboard"
```

Tests prüfen:
- ✅ Tab-Reihenfolge
- ✅ Focus-Management
- ✅ Keyboard-Aktivierung

#### Screenreader Tests
```bash
npm test -- --testNamePattern="screenreader"
```

Tests prüfen:
- ✅ ARIA-Labels
- ✅ Live-Regions
- ✅ Landmark-Rollen
- ✅ Formular-Semantik

### Manuelle Tests

#### Empfohlene Tools
- **NVDA** (Windows, kostenlos)
- **JAWS** (Windows, kommerziell)
- **VoiceOver** (macOS/iOS, integriert)
- **TalkBack** (Android, integriert)

#### Browser-Extensions
- **axe DevTools** (Chrome/Firefox)
- **WAVE** (Chrome/Firefox)
- **Lighthouse** (Chrome DevTools)

#### Test-Checkliste
- [ ] Nur mit Tastatur navigieren
- [ ] Mit Screenreader testen
- [ ] Zoom auf 200% testen
- [ ] Farbkontraste prüfen
- [ ] Mobile Geräte testen

## Best Practices

### Komponenten-Entwicklung

#### DO ✅
```typescript
// Gute ARIA-Labels
<Button aria-label="Dokument löschen">
  <DeleteIcon />
</Button>

// Semantisches HTML
<nav role="navigation" aria-label="Hauptnavigation">
  <Link to="/chat">Chat</Link>
</nav>

// Fehler-Handling
<TextField
  error={hasError}
  helperText={errorMessage}
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
```

#### DON'T ❌
```typescript
// Fehlende Labels
<Button>
  <DeleteIcon />
</Button>

// Div-Suppe
<div onClick={handleClick}>
  Click me
</div>

// Fehlende Fehler-Kommunikation
<TextField error={hasError} />
```

### Formular-Validierung

```typescript
// Accessible Error Handling
<AccessibleTextField
  error={!!errors.email}
  errorMessage={errors.email}
  helperText="Format: name@example.com"
  aria-required={true}
/>

// Error wird als Alert angekündigt
{error && (
  <AccessibleAlert severity="error" ariaLive="assertive">
    {error}
  </AccessibleAlert>
)}
```

### Loading-States

```typescript
// Accessible Loading Button
<AccessibleButton
  loading={isLoading}
  aria-label={isLoading ? 'Lädt...' : 'Absenden'}
>
  Absenden
</AccessibleButton>
```

## Compliance

### WCAG 2.1 Level AA Kriterien

#### Wahrnehmbar
- ✅ 1.1.1 Nicht-Text-Inhalt (Alt-Texte)
- ✅ 1.3.1 Info und Beziehungen (Semantik)
- ✅ 1.4.3 Kontrast (Minimum 4.5:1)
- ✅ 1.4.4 Textgröße ändern (bis 200%)

#### Bedienbar
- ✅ 2.1.1 Tastatur (vollständig)
- ✅ 2.1.2 Keine Tastaturfalle
- ✅ 2.4.1 Bereiche überspringen (Skip-Link)
- ✅ 2.4.3 Fokus-Reihenfolge (logisch)
- ✅ 2.4.7 Fokus sichtbar

#### Verständlich
- ✅ 3.1.1 Sprache der Seite
- ✅ 3.2.1 Bei Fokus (keine Kontextänderung)
- ✅ 3.3.1 Fehlererkennung
- ✅ 3.3.2 Beschriftungen oder Anweisungen

#### Robust
- ✅ 4.1.2 Name, Rolle, Wert (ARIA)
- ✅ 4.1.3 Statusmeldungen (Live-Regions)

## Ressourcen

### Dokumentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Material-UI Accessibility](https://mui.com/material-ui/guides/accessibility/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Wartung

### Regelmäßige Checks
- Monatliche axe-core Tests
- Quartalsweise manuelle Screenreader-Tests
- Bei jedem Release: Lighthouse Accessibility Score > 90

### Neue Features
Jede neue Komponente muss:
1. ARIA-Labels haben
2. Keyboard-zugänglich sein
3. axe-core Tests bestehen
4. Dokumentiert sein

## Support

Bei Barrierefreiheits-Problemen:
- GitHub Issues mit Label "accessibility"
- E-Mail: accessibility@smartlaw.de
- Feedback-Formular in der App
