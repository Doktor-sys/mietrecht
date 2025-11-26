# SmartLaw Agent – Mietrecht

Eine umfassende KI-gestützte Anwendung für mietrechtliche Beratung in Deutschland.

## 🏗️ Projektstruktur

```
smartlaw-mietrecht-agent/
├── services/
│   └── backend/           # Express.js Backend API
├── web-app/              # React.js Web-Anwendung
├── mobile-app/           # React Native Mobile App
├── shared/
│   ├── types/           # Gemeinsame TypeScript-Typen
│   └── utils/           # Gemeinsame Utility-Funktionen
├── docker-compose.dev.yml
└── package.json
```

## 🚀 Schnellstart

### Voraussetzungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

### Installation

1. Repository klonen und Dependencies installieren:
```bash
git clone <repository-url>
cd smartlaw-mietrecht-agent
npm install
```

2. Entwicklungsumgebung mit Docker starten:
```bash
npm run docker:dev
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

## 🛠️ Entwicklung

### Services

- **Backend**: http://localhost:3001
- **Web App**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200
- **MinIO**: http://localhost:9000 (Console: http://localhost:9001)

### Verfügbare Scripts

```bash
npm run dev          # Startet Backend und Frontend
npm run build        # Baut alle Workspaces
npm run test         # Führt Tests in allen Workspaces aus
npm run lint         # Linting für das gesamte Projekt
```

## 📋 Features

- **KI-gestützte Rechtsberatung**: Automatische Analyse mietrechtlicher Fälle
- **Dokumentenanalyse**: Upload und Analyse von Mietverträgen, Abmahnungen, etc.
- **Anwaltsvermittlung**: Nahtlose Verbindung zu Mietrechts-Spezialisten
- **Lokale Anpassung**: Berücksichtigung regionaler Mietrechts-Besonderheiten
- **Barrierefreiheit**: WCAG 2.1 AA-konform
- **Mehrsprachigkeit**: Deutsch, Türkisch, Arabisch
- **DSGVO-konform**: Hosting in Deutschland, Ende-zu-Ende-Verschlüsselung

## 🏛️ Architektur

Das System basiert auf einer Microservices-Architektur mit:

- **Frontend**: React.js (Web) + React Native (Mobile)
- **Backend**: Node.js + Express.js
- **Datenbank**: PostgreSQL + Redis + Elasticsearch
- **KI**: OpenAI GPT-4 Integration
- **Dokumentenspeicherung**: MinIO
- **Container**: Docker + Kubernetes

## 📄 Lizenz

Dieses Projekt ist proprietär und vertraulich.