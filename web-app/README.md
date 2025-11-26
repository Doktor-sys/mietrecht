# SmartLaw Agent - Web Frontend

React.js Web-Anwendung für den SmartLaw Mietrecht Agent.

## Technologie-Stack

- **React 18** mit TypeScript
- **Material-UI (MUI)** für UI-Komponenten
- **Redux Toolkit** für State Management
- **React Router** für Navigation
- **i18next** für Mehrsprachigkeit (Deutsch, Türkisch, Arabisch)
- **Axios** für API-Kommunikation
- **React Testing Library** für Tests

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000).

## Tests

```bash
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm test -- --coverage

# Accessibility Tests
npm run accessibility-test
```

## Build

```bash
npm run build
```

## Umgebungsvariablen

Kopiere `.env.example` zu `.env` und passe die Werte an:

```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

## Projektstruktur

```
src/
├── components/       # Wiederverwendbare UI-Komponenten
├── pages/           # Seiten-Komponenten
├── store/           # Redux Store und Slices
├── services/        # API Services
├── i18n/            # Internationalisierung
├── App.tsx          # Haupt-App-Komponente
├── index.tsx        # Entry Point
└── theme.ts         # MUI Theme-Konfiguration
```

## Features

- ✅ Responsive Design mit Material-UI
- ✅ Redux Toolkit für State Management
- ✅ React Router für Navigation
- ✅ Mehrsprachigkeit (DE, TR, AR)
- ✅ JWT-basierte Authentifizierung
- ✅ Barrierefreie Komponenten (WCAG 2.1 AA)
- ✅ Accessibility Tests mit axe-core
- ✅ Keyboard-Navigation
- ✅ Screenreader-Support
- ✅ Chat-Interface (Aufgabe 8.3)
- ✅ Dokumenten-Upload (Aufgabe 8.4)
- ✅ Anwaltssuche (Aufgabe 8.5)

## Barrierefreiheit

Die Anwendung ist nach WCAG 2.1 AA-Standards entwickelt:
- ARIA-Labels für alle interaktiven Elemente
- Vollständige Keyboard-Navigation mit Skip-to-Content
- Screenreader-Unterstützung (NVDA, JAWS, VoiceOver)
- Kontrastverhältnisse nach WCAG-Standards (min. 4.5:1)
- Semantisches HTML mit Landmark-Rollen
- Live-Regions für dynamische Inhalte
- Barrierefreie Formularvalidierung

Siehe [ACCESSIBILITY.md](./ACCESSIBILITY.md) für Details.
