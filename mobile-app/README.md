# SmartLaw Mietrecht - Mobile App

React Native Mobile App für iOS und Android.

## Technologie-Stack

- **Framework**: React Native mit Expo
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **UI Library**: React Native Paper
- **Testing**: Jest + React Native Testing Library
- **E2E Testing**: Detox (geplant)

## Installation

```bash
npm install
```

## Entwicklung

```bash
# Start Expo Development Server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on Web
npm run web
```

## Tests

```bash
# Run unit tests
npm test

# Run E2E tests (Detox)
npm run test:e2e
```

## Projektstruktur

```
mobile-app/
├── src/
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   │   ├── Auth/         # Authentication screens
│   │   └── Main/         # Main app screens
│   ├── store/            # Redux store and slices
│   ├── services/         # API services
│   ├── components/       # Reusable components
│   ├── i18n/             # Internationalization
│   ├── theme.ts          # Theme configuration
│   └── types/            # TypeScript types
├── __tests__/            # Test files
├── App.tsx               # Root component
├── app.json              # Expo configuration
└── package.json
```

## Features

### Implementiert (Task 9.1)

- ✅ React Native Grundstruktur mit Expo
- ✅ Navigation mit React Navigation (Stack + Bottom Tabs)
- ✅ Redux Toolkit State Management
- ✅ Authentication Flow (Login/Register)
- ✅ Main Screens (Home, Chat, Documents, Lawyers, Profile)
- ✅ API Service Layer
- ✅ Theme Configuration
- ✅ i18n Setup (Deutsch)
- ✅ Basic Tests

### Geplant (Task 9.2)

- ⏳ Chat-Funktionalität mit WebSocket
- ⏳ Kamera-Integration für Dokument-Scanning
- ⏳ Push-Notifications
- ⏳ Detox E2E Tests

## Barrierefreiheit

Die App ist nach WCAG 2.1 AA-Standards entwickelt:
- Screenreader-Support
- Ausreichende Kontrastverhältnisse
- Touch-Target-Größen
- Keyboard-Navigation

## Sicherheit

- Sichere Token-Speicherung mit Expo SecureStore
- HTTPS-only API-Kommunikation
- Input-Validierung
- DSGVO-konforme Datenverarbeitung

## Build

```bash
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

## Deployment

Die App kann über Expo EAS Build deployed werden:

```bash
eas build --platform android
eas build --platform ios
```

## Lizenz

Proprietary - SmartLaw GmbH
