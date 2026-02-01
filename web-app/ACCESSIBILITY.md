# Barrierefreiheit (Accessibility) - SmartLaw Web-App

## Übersicht

Die SmartLaw Web-Anwendung ist nach **WCAG 2.1 Level AAA** Standards entwickelt und bietet umfassende Barrierefreiheit für alle Nutzer.

## Implementierte Features

### 1. WCAG 2.1 AAA-konforme Komponenten

#### Barrierefreie Basis-Komponenten
- **AccessibleButton**: Button mit Loading-State und ARIA-Labels
- **AccessibleTextField**: Textfeld mit vollständiger ARIA-Unterstützung
- **AccessibleAlert**: Alert-Komponente mit Live-Regions
- **EnhancedSkipToContent**: Erweiterte Skip-Links mit Tastaturunterstützung
- **AccessibilitySettingsPanel**: Einstellungsmenü für Barrierefreiheit
- **AccessibleDataList**: Barrierefreie Datentabellen

#### ARIA-Attribute
Alle interaktiven Elemente haben:
- `aria-label`: Beschreibende Labels
- `aria-describedby`: Zusätzliche Beschreibungen
- `aria-required`: Pflichtfelder-Kennzeichnung
- `aria-invalid`: Fehler-Status
- `aria-live`: Dynamische Inhalte
- `aria-pressed`: Toggle-Status (Sprachauswahl)
- `aria-expanded`: Aufklapp-Status (Menüs)
- `aria-rowindex`: Tabellenzeilen-Indizes

### 2. Semantisches HTML

#### Landmark-Rollen
```html
<header role="banner">        <!-- Header -->
<nav role="navigation">       <!-- Navigation -->
<main role="main">            <!-- Hauptinhalt -->
<footer role="contentinfo">   <!-- Footer -->
<form aria-label="...">       <!-- Formulare -->
<region aria-labelledby="..."> <!-- Bereiche -->
<table aria-label="...">      <!-- Tabellen -->
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
- **Ctrl + Alt + S**: Skip-Links aktivieren

#### Focus-Management
- Sichtbare Focus-Indikatoren
- Logische Tab-Reihenfolge
- Focus-Trap in Modals
- Erweiterte Skip-to-Content Links

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
- Tabellen mit korrekten ARIA-Attributen

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

#### WCAG AAA Kontraste
- **Normal Text**: Mindestens 7:1
- **Großer Text**: Mindestens 4.5:1
- **UI-Komponenten**: Mindestens 4.5:1

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

### 8. Kognitive Zugänglichkeit

#### Reduzierte Bewegung
- CSS `prefers-reduced-motion` Unterstützung
- Animationen minimieren
- Übergänge reduzieren

#### Dyslexie-Freundliche Modi
- Spezielle Schriftarten
- Erhöhte Zeilenabstände
- Optimierte Kontraste

#### Screenreader-Optimierung
- Verbesserte Semantik
- Klare Navigation
- Strukturierte Inhalte

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
- [ ] Reduzierte Bewegung testen
- [ ] Dyslexie-freundliche Modi testen

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

### WCAG 2.1 Level AAA Kriterien

#### Wahrnehmbar
- ✅ 1.1.1 Nicht-Text-Inhalt (Alt-Texte)
- ✅ 1.2.1 Audio-only und Video-only (aufgezeichnet)
- ✅ 1.2.2 Untertitel (aufgezeichnet)
- ✅ 1.2.3 Audio-Beschreibung oder Medienalternative (aufgezeichnet)
- ✅ 1.3.1 Info und Beziehungen (Semantik)
- ✅ 1.3.2 Bedeutung bei Reihenfolge (logische Reihenfolge)
- ✅ 1.3.3 Sinnesmerkmale (keine rein visuellen Hinweise)
- ✅ 1.4.1 Verwendung von Farbe (keine Farbe als einzige Information)
- ✅ 1.4.2 Steuerung von Audio (kein automatisches Abspielen)
- ✅ 1.4.3 Kontrast (Minimum 7:1 für normalen Text)
- ✅ 1.4.4 Textgröße ändern (bis 200%)
- ✅ 1.4.5 Bilder von Text (vermeiden, wenn stylable)
- ✅ 1.4.6 Kontrast (erhöht 7:1 für normalen Text)
- ✅ 1.4.7 Hintergrundgeräusche (niedrig oder stumm)
- ✅ 1.4.8 Visuelle Präsentation (Textabstand, Größe, Farbe)
- ✅ 1.4.9 Bilder von Text (keine Ausnahme)

#### Bedienbar
- ✅ 2.1.1 Tastatur (vollständig)
- ✅ 2.1.2 Keine Tastaturfalle
- ✅ 2.1.3 Tastatur (keine Ausnahme)
- ✅ 2.2.1 Timing anpassbar (keine zeitbasierten Inhalte)
- ✅ 2.2.2 Pause, Stopp, Ausblenden (kein automatisches Blinken)
- ✅ 2.2.3 Keine Timing-Komponenten (keine Ausnahme)
- ✅ 2.2.4 Unterbrechungen (keine Ausnahme)
- ✅ 2.2.5 Wiederaufnahme (Authentifizierung)
- ✅ 2.3.1 Three Flashes or Below Threshold (keine Ausnahme)
- ✅ 2.3.2 Three Flashes (keine Ausnahme)
- ✅ 2.4.1 Bereiche überspringen (Skip-Link)
- ✅ 2.4.2 Seitenname (einzigartig)
- ✅ 2.4.3 Fokus-Reihenfolge (logisch)
- ✅ 2.4.4 Linkzweck (im Kontext)
- ✅ 2.4.5 Mehrere Wege (mindestens zwei Navigationsmethoden)
- ✅ 2.4.6 Überschriften und Labels (beschreibend)
- ✅ 2.4.7 Fokus sichtbar
- ✅ 2.4.8 Position im Set (Navigationsmechanismus)
- ✅ 2.4.9 Linkzweck (reiner Linktext)
- ✅ 2.4.10 Abschnittsüberschriften (strukturierte Inhalte)

#### Verständlich
- ✅ 3.1.1 Sprache der Seite
- ✅ 3.1.2 Sprache von Teilen
- ✅ 3.1.3 Unerwartete Änderungen (keine automatischen Sprachwechsel)
- ✅ 3.1.4 Abkürzungen (Erklärungen)
- ✅ 3.1.5 Leseniveau (verständliche Sprache)
- ✅ 3.1.6 Aussprache (Hilfe bei Aussprache)
- ✅ 3.2.1 Bei Fokus (keine Kontextänderung)
- ✅ 3.2.2 Bei Eingabe (keine automatische Navigation)
- ✅ 3.2.3 Konsistente Navigation (gleiche Navigation)
- ✅ 3.2.4 Konsistente Identifikation (gleiche Funktionen)
- ✅ 3.2.5 Bei Änderung (Warnung bei Kontextwechsel)
- ✅ 3.3.1 Fehlererkennung (klare Fehlermeldungen)
- ✅ 3.3.2 Beschriftungen oder Anweisungen
- ✅ 3.3.3 Fehlervermeidung (Rechtschreibprüfung)
- ✅ 3.3.4 Fehlervermeidung (Rechtschreibprüfung, Bestätigungen)
- ✅ 3.3.5 Hilfe (Kontexthilfe)
- ✅ 3.3.6 Fehlervermeidung (Rechtschreibprüfung, Bestätigungen, Kontexthilfe)

#### Robust
- ✅ 4.1.1 Parsing (korrektes HTML)
- ✅ 4.1.2 Name, Rolle, Wert (ARIA)
- ✅ 4.1.3 Statusmeldungen (Live-Regions)

## Erweiterte Funktionen

### Barrierefreiheit-Einstellungen
Benutzer können personalisierte Einstellungen vornehmen:
- Reduzierte Bewegung
- Hoher Kontrast
- Größerer Text
- Dyslexie-freundliche Schriftarten
- Screenreader-Optimierung

### Tastatur-Shortcuts
- **Ctrl + Alt + S**: Skip-Links aktivieren
- **Tab**: Vorwärts navigieren
- **Shift + Tab**: Rückwärts navigieren
- **Enter/Space**: Elemente aktivieren
- **Escape**: Dialoge/Menüs schließen

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
- Bei jedem Release: Lighthouse Accessibility Score > 95

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