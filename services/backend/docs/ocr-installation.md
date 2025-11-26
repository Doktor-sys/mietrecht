# OCR Service Installation

## Dependencies Installation

Die OCR-Funktionalität benötigt folgende npm-Pakete:

```bash
npm install tesseract.js pdf-parse @types/pdf-parse
```

### Workspace Installation

Da dieses Projekt ein npm-Workspace verwendet, installieren Sie die Dependencies wie folgt:

```bash
# Im Root-Verzeichnis des Projekts
npm install

# Oder spezifisch für das Backend
npm install --workspace=services/backend
```

### Troubleshooting

Falls Sie Peer-Dependency-Konflikte erhalten:

```bash
npm install --legacy-peer-deps
```

Oder:

```bash
npm install --force
```

## Manuelle Installation (falls Workspace-Probleme auftreten)

1. Navigieren Sie zum Backend-Verzeichnis:
```bash
cd services/backend
```

2. Installieren Sie die Dependencies direkt:
```bash
npm install tesseract.js pdf-parse --save
npm install @types/pdf-parse --save-dev
```

## Verifikation

Nach der Installation sollten folgende Pakete in `node_modules` vorhanden sein:
- `tesseract.js` (v5.0.0 oder höher)
- `pdf-parse` (v1.1.1 oder höher)
- `@types/pdf-parse` (v1.1.1 oder höher)

## Tests ausführen

Nach erfolgreicher Installation können Sie die Tests ausführen:

```bash
# Alle OCR-Tests
npm test -- ocrService

# Nur die vereinfachten Tests (ohne externe Dependencies)
npm test -- ocrService.simple.test.ts
```

## Hinweise

- **Tesseract.js** lädt beim ersten Aufruf automatisch die deutschen Sprachdaten herunter
- Die erste OCR-Operation kann daher etwas länger dauern
- Für Produktionsumgebungen sollten die Sprachdaten vorinstalliert werden
