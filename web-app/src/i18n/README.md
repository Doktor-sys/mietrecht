# Internationalisierung (i18n)

## Übersicht

Die SmartLaw Web-Anwendung unterstützt drei Sprachen:
- 🇩🇪 **Deutsch** (Standard)
- 🇹🇷 **Türkisch**
- 🇸🇦 **Arabisch**

## Technologie

- **i18next**: Internationalisierungs-Framework
- **react-i18next**: React-Integration
- **localStorage**: Persistente Sprachauswahl

## Struktur

```
src/i18n/
├── index.ts          # i18n Konfiguration
├── types.ts          # TypeScript Definitionen
├── useLanguage.ts    # Custom Hook
└── README.md         # Diese Datei
```

## Verwendung

### In Komponenten

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description')}</p>
    </div>
  );
};
```

### Sprachumschaltung

```typescript
import { useLanguage } from '../i18n/useLanguage';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div>
      <button onClick={() => changeLanguage('de')}>Deutsch</button>
      <button onClick={() => changeLanguage('tr')}>Türkçe</button>
      <button onClick={() => changeLanguage('ar')}>العربية</button>
    </div>
  );
};
```

### Mit Parametern

```typescript
// Translation: "Willkommen, {{name}}!"
t('welcome', { name: 'Max' })
// Output: "Willkommen, Max!"
```

### Pluralisierung

```typescript
// Translations:
// "item": "{{count}} Element"
// "item_plural": "{{count}} Elemente"

t('item', { count: 1 })  // "1 Element"
t('item', { count: 5 })  // "5 Elemente"
```

## Übersetzungsschlüssel

### App
- `app.title`: Anwendungstitel
- `app.description`: Anwendungsbeschreibung

### Navigation
- `nav.home`: Startseite
- `nav.chat`: Chat
- `nav.documents`: Dokumente
- `nav.lawyers`: Anwälte
- `nav.profile`: Profil
- `nav.login`: Anmelden
- `nav.register`: Registrieren
- `nav.logout`: Abmelden

### Authentifizierung
- `auth.email`: E-Mail
- `auth.password`: Passwort
- `auth.login`: Anmelden
- `auth.register`: Registrieren
- `auth.loginTitle`: Login-Titel
- `auth.registerTitle`: Registrierungs-Titel
- `auth.userType`: Benutzertyp
- `auth.tenant`: Mieter
- `auth.landlord`: Vermieter
- `auth.business`: Geschäftskunde

### Chat
- `chat.title`: Chat-Titel
- `chat.placeholder`: Eingabe-Platzhalter
- `chat.send`: Senden-Button
- `chat.typing`: Tipp-Indikator

### Dokumente
- `documents.title`: Dokumente-Titel
- `documents.upload`: Upload-Button
- `documents.analyze`: Analyse-Button
- `documents.noDocuments`: Keine Dokumente

### Anwälte
- `lawyers.title`: Anwälte-Titel
- `lawyers.search`: Suchen-Button
- `lawyers.location`: Standort
- `lawyers.specialization`: Spezialisierung
- `lawyers.book`: Buchen-Button

### Allgemein
- `common.loading`: Lädt...
- `common.error`: Fehlermeldung
- `common.save`: Speichern
- `common.cancel`: Abbrechen
- `common.close`: Schließen

## Features

### 1. Persistente Sprachauswahl

Die gewählte Sprache wird in `localStorage` gespeichert:

```typescript
localStorage.getItem('language') // 'de' | 'tr' | 'ar'
```

### 2. RTL-Support für Arabisch

Automatische Umschaltung der Textrichtung:

```typescript
document.documentElement.dir = 'rtl'; // für Arabisch
document.documentElement.dir = 'ltr'; // für Deutsch/Türkisch
```

### 3. HTML Lang-Attribut

Automatische Aktualisierung des `lang`-Attributs:

```html
<html lang="de">  <!-- Deutsch -->
<html lang="tr">  <!-- Türkisch -->
<html lang="ar">  <!-- Arabisch -->
```

### 4. Debug-Modus

Im Development-Modus werden fehlende Übersetzungen in der Konsole angezeigt:

```typescript
debug: process.env.NODE_ENV === 'development'
```

## Neue Übersetzungen hinzufügen

### 1. In index.ts

```typescript
const resources = {
  de: {
    translation: {
      // Neue Übersetzung
      newFeature: {
        title: 'Neues Feature',
        description: 'Beschreibung',
      },
    },
  },
  tr: {
    translation: {
      newFeature: {
        title: 'Yeni Özellik',
        description: 'Açıklama',
      },
    },
  },
  ar: {
    translation: {
      newFeature: {
        title: 'ميزة جديدة',
        description: 'وصف',
      },
    },
  },
};
```

### 2. In types.ts (optional)

```typescript
export interface TranslationResources {
  // ... existing
  newFeature: {
    title: string;
    description: string;
  };
}
```

### 3. Verwendung

```typescript
const { t } = useTranslation();
<h1>{t('newFeature.title')}</h1>
```

## Best Practices

### 1. Verwende Namespaces

```typescript
// ✅ GOOD - Strukturiert
t('auth.login')
t('nav.home')
t('common.error')

// ❌ BAD - Flach
t('login')
t('home')
t('error')
```

### 2. Vermeide Hardcoded Texte

```typescript
// ✅ GOOD
<Button>{t('common.save')}</Button>

// ❌ BAD
<Button>Speichern</Button>
```

### 3. Verwende Fallback-Werte

```typescript
// ✅ GOOD
t('newKey', 'Fallback Text')

// ❌ BAD
t('newKey') // Zeigt 'newKey' wenn nicht gefunden
```

### 4. Teste alle Sprachen

```typescript
// Test für alle Sprachen
['de', 'tr', 'ar'].forEach(lang => {
  i18n.changeLanguage(lang);
  expect(t('app.title')).toBeDefined();
});
```

## Barrierefreiheit

### ARIA-Labels in allen Sprachen

```typescript
<Button
  aria-label={t('nav.login')}
>
  {t('nav.login')}
</Button>
```

### Screenreader-Support

```typescript
<div role="alert" aria-live="polite">
  {t('common.loading')}
</div>
```

### RTL-Layout für Arabisch

```typescript
const { isRTL } = useLanguage();

<Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
  {/* Content */}
</Box>
```

## Troubleshooting

### Problem: Übersetzung nicht gefunden

```typescript
// Lösung: Prüfe Schlüssel und Fallback
console.log(i18n.exists('app.title')); // true/false
t('app.title', 'Fallback')
```

### Problem: Sprache ändert sich nicht

```typescript
// Lösung: Prüfe Event-Listener
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});
```

### Problem: RTL funktioniert nicht

```typescript
// Lösung: Prüfe dir-Attribut
console.log(document.documentElement.dir); // 'rtl' oder 'ltr'
```

## Testing

### Mock i18next in Tests

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

### Test Übersetzungen

```typescript
test('translations exist', () => {
  expect(i18n.exists('app.title')).toBe(true);
  expect(i18n.exists('nav.home')).toBe(true);
});
```

## Ressourcen

- [i18next Dokumentation](https://www.i18next.com/)
- [react-i18next Dokumentation](https://react.i18next.com/)
- [RTL Best Practices](https://rtlstyling.com/)
- [WCAG Internationalisierung](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)
