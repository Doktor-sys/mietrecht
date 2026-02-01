# App Store Assets Requirements

## iOS App Store

### App Icon
- **Größe**: 1024 x 1024 Pixel
- **Format**: PNG
- **Anforderungen**: 
  - Kein Alpha-Kanal
  - Flaches Design ohne Text
  - Runde Ecken werden automatisch hinzugefügt

### Launch Screen (Splash Screen)
- **Größe**: 2208 x 2208 Pixel
- **Format**: PNG
- **Anforderungen**:
  - Branding-Element zentriert
  - Hintergrundfarbe oder -bild

### Screenshots
**iPhone Screenshots:**
- 6.7" Display (iPhone 12 Pro Max): 1290 x 2796
- 5.5" Display (iPhone 8 Plus): 1242 x 2208
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688

**iPad Screenshots:**
- 12.9" iPad Pro: 2048 x 2732
- 11" iPad Pro: 1668 x 2388

**Anforderungen:**
- Reale App-Screenshots (keine Mockups)
- Deutsche Sprache
- Keine Rahmen oder Schatten
- JPEG oder PNG Format

### Promotional Text
- **Max. Länge**: 170 Zeichen
- **Beispiel**: "Rechtliche Unterstützung für Mieter und Vermieter. KI-gestützte Beratung, Dokumentenanalyse und Anwaltvermittlung."

### App Description
- **Deutsch**: Vollständige Beschreibung der App-Funktionen
- **Englisch**: (Optional) Englische Übersetzung

### Keywords
- **Max. Länge**: 100 Zeichen
- **Beispiel**: "mietrecht,recht,juristisch,mieter,vermieter,beratung,ki,rechtsberatung"

## Google Play Store

### App Icon
- **Größe**: 512 x 512 Pixel
- **Format**: PNG
- **Anforderungen**:
  - Volle Farbe
  - Kein Text
  - Kein Alpha-Kanal

### Feature Graphic
- **Größe**: 1024 x 500 Pixel
- **Format**: PNG oder JPEG
- **Anforderungen**:
  - Kein Text
  - Branding-Element
  - Keine Screenshots

### Screenshots
**Phone Screenshots:**
- Mindestens 2 Screenshots
- Maximal 8 Screenshots
- Mindestauflösung: 320 x 480 Pixel

**Tablet Screenshots:**
- 7-Zoll Tablet: 1280 x 800 Pixel
- 10-Zoll Tablet: 1200 x 1920 Pixel

### Promotional Text
- **Max. Länge**: 80 Zeichen
- **Beispiel**: "Rechtliche Unterstützung für Mieter und Vermieter"

### App Description
- **Deutsch**: Vollständige Beschreibung der App-Funktionen
- **Englisch**: (Optional) Englische Übersetzung

### Short Description
- **Max. Länge**: 80 Zeichen
- **Beispiel**: "KI-gestützte Mietrechtsberatung und Dokumentenanalyse"

## Asset-Vorlagen

### App Icon Vorlage
```
assets/
├── ios/
│   ├── AppIcon-1024x1024.png
│   └── iTunesArtwork@2x.png
└── android/
    ├── play_store_icon.png (512x512)
    └── adaptive_icon/
        ├── foreground.png
        └── background.png
```

### Splash Screen Vorlage
```
assets/
├── splash.png (2208x2208)
├── ios/
│   └── splash/
│       ├── splash_iphone.png
│       └── splash_ipad.png
└── android/
    └── splash/
        ├── splash_mdpi.png
        ├── splash_hdpi.png
        ├── splash_xhdpi.png
        ├── splash_xxhdpi.png
        └── splash_xxxhdpi.png
```

### Screenshot Vorlage
```
assets/
├── screenshots/
│   ├── ios/
│   │   ├── iphone_6.7/
│   │   │   ├── screenshot_1.png
│   │   │   ├── screenshot_2.png
│   │   │   └── screenshot_3.png
│   │   └── ipad_12.9/
│   │       ├── screenshot_1.png
│   │       └── screenshot_2.png
│   └── android/
│       ├── phone/
│       │   ├── screenshot_1.png
│       │   ├── screenshot_2.png
│       │   └── screenshot_3.png
│       └── tablet/
│           ├── screenshot_1.png
│           └── screenshot_2.png
```

## Asset-Erstellungsrichtlinien

### Allgemeine Richtlinien
1. **Konsistenz**: Alle Assets sollten ein konsistentes Design haben
2. **Markenrichtlinien**: Folgen Sie den Markenrichtlinien von SmartLaw
3. **Qualität**: Alle Assets sollten hohe Qualität haben
4. **Lokalisierung**: Alle Texte sollten in Deutsch sein

### Farben
- **Primärfarbe**: #1e3c72 (Dunkelblau)
- **Sekundärfarbe**: #2a5298 (Blau)
- **Akzentfarbe**: #f8a500 (Orange)
- **Hintergrund**: #ffffff (Weiß)

### Schriftarten
- **Überschriften**: Roboto Bold
- **Body Text**: Roboto Regular
- **Buttons**: Roboto Medium

## Asset-Validierung

### Vor der Veröffentlichung
1. **Größenprüfung**: Überprüfen Sie alle Asset-Größen
2. **Formatprüfung**: Stellen Sie sicher, dass alle Dateien im richtigen Format sind
3. **Qualitätsprüfung**: Überprüfen Sie die Bildqualität
4. **Konsistenzprüfung**: Stellen Sie sicher, dass alle Assets konsistent sind

### Tools für die Validierung
- **ImageOptim**: Für die Optimierung von PNG-Dateien
- **TinyPNG**: Für die Komprimierung von Bildern
- **App Store Screenshot Validator**: Für die Validierung von App Store Screenshots
- **Google Play Asset Generator**: Für die Generierung von Google Play Assets

## Asset-Ablage

### Lokale Ablage
```
mobile-app/
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── screenshots/
│   │   ├── ios/
│   │   └── android/
│   └── app-store/
│       ├── ios/
│       └── android/
└── app.json
```

### Cloud-Ablage (Empfohlen)
- **Google Drive**: Für die gemeinsame Nutzung von Assets
- **Dropbox**: Für die Synchronisierung von Assets
- **AWS S3**: Für die sichere Speicherung von Assets

## Asset-Pflege

### Regelmäßige Aktualisierungen
1. **Neue Funktionen**: Erstellen Sie neue Screenshots für neue Funktionen
2. **Design-Änderungen**: Aktualisieren Sie alle Assets bei Design-Änderungen
3. **Marken-Änderungen**: Aktualisieren Sie alle Assets bei Marken-Änderungen

### Versionskontrolle
- Verwenden Sie Git für die Versionskontrolle von Assets
- Erstellen Sie Tags für jede veröffentlichte Version
- Dokumentieren Sie alle Änderungen in der README-Datei