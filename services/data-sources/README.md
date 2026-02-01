# Data Sources Service

Der Data Sources Service ist ein Microservice, der als zentrale Schnittstelle für den Zugriff auf verschiedene juristische Datenquellen fungiert. Er kapselt die Kommunikation mit externen APIs und bietet eine einheitliche Schnittstelle für den Zugriff auf Gerichtsentscheidungen und juristische Artikel.

## Funktionen

- **BGH API Client**: Zugriff auf Entscheidungen des Bundesgerichtshofs
- **Landgerichte API Client**: Zugriff auf regionale Gerichtsentscheidungen
- **Beck Online API Client**: Zugriff auf juristische Artikel aus der Beck Online-Datenbank
- **juris API Client**: Zugriff auf Dokumente aus der juris-Datenbank
- **BVerfG API Client**: Zugriff auf Entscheidungen des Bundesverfassungsgerichts

## Technologie-Stack

- Node.js
- TypeScript
- Express.js
- Axios für HTTP-Anfragen
- Node-Cache für Zwischenspeicherung

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Starten

```bash
npm start
```

## API-Endpunkte

### Gesundheitsprüfung
- `GET /health` - Überprüft den Status des Dienstes

### BGH Entscheidungen
- `GET /api/bgh/decisions` - Ruft aktuelle BGH-Entscheidungen ab

### Landgerichtsentscheidungen
- `GET /api/landgerichte/decisions` - Ruft regionale Gerichtsentscheidungen ab

### Beck Online Artikel
- `GET /api/beck-online/articles` - Ruft juristische Artikel aus Beck Online ab

### juris Dokumente
- `GET /api/juris/documents` - Ruft juristische Dokumente aus juris ab

### BVerfG Entscheidungen
- `GET /api/bverfg/decisions` - Ruft Entscheidungen des Bundesverfassungsgerichts ab

## Umgebungsvariablen

- `PORT` - Port, auf dem der Service läuft (Standard: 3004)
- `BGH_API_BASE_URL` - Basis-URL für die BGH API
- `LANDGERICHTE_API_BASE_URL` - Basis-URL für die Landgerichte API
- `BECK_ONLINE_API_BASE_URL` - Basis-URL für die Beck Online API
- `JURIS_API_BASE_URL` - Basis-URL für die juris API
- `BVERFG_API_BASE_URL` - Basis-URL für die BVerfG API

## Docker

Der Service kann auch als Docker-Container ausgeführt werden:

```bash
docker-compose up
```