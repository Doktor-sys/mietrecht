# 🚀 Getting Started Guide — SmartLaw Mietrecht für Neue Entwickler

**Version:** 1.2.4 (7. Dezember 2025)  
**Target Audience:** Neue Entwickler, 0-6 Monate Erfahrung  
**Estimated Reading Time:** 20 Minuten  
**Estimated Setup Time:** 30 Minuten

Willkommen! Diese Anleitung führt dich Schritt-für-Schritt in das SmartLaw Mietrecht Projekt ein.

---

## 📋 Inhaltsverzeichnis

1. [Before You Start](#-before-you-start)
2. [Development Environment Setup](#-development-environment-setup)
3. [First Code Changes](#-first-code-changes)
4. [Understanding the Architecture](#-understanding-the-architecture)
5. [Common Tasks](#-common-tasks)
6. [Testing Your Code](#-testing-your-code)
7. [Git Workflow](#-git-workflow)
8. [Getting Help](#-getting-help)

---

## ⚡ Before You Start

### Voraussetzungen prüfen

Du brauchst folgende Programme:

```bash
# Überprüfe deine Versionen
node --version          # ✅ v18.16.0 oder höher
npm --version           # ✅ 9.6.0 oder höher
git --version           # ✅ 2.37 oder höher
docker --version        # ✅ 20.10 oder höher (optional)
```

Nicht installiert? Hier sind die Downloads:

- **Node.js:** https://nodejs.org (wähle LTS version)
- **Git:** https://git-scm.com
- **Docker:** https://docker.com/products/docker-desktop (optional)

### Git konfigurieren

Wenn du noch nie Git verwendet hast:

```bash
# Setze deinen Namen und Email
git config --global user.name "Dein Name"
git config --global user.email "dein.email@example.com"

# Überprüfe die Konfiguration
git config --global --list
```

---

## 🖥️ Development Environment Setup

### Schritt 1: Repository klonen

```bash
# Klone das Repo
git clone https://github.com/smartlaw/mietrecht.git
cd "JurisMind - Mietrecht 01"

# Oder mit SSH (wenn du SSH-Keys hast)
git clone git@github.com:smartlaw/mietrecht.git
cd "JurisMind - Mietrecht 01"
```

### Schritt 2: Dependencies installieren

```bash
# Installiere npm packages (dauert ~3-5 Minuten)
npm install

# Überprüfe, dass alles funktioniert
npm --version
node --version
```

### Schritt 3: Umgebungsvariablen konfigurieren

```bash
# Kopiere das Beispiel-Template
cp .env.example .env

# Öffne .env und überprüfe die Werte
nano .env
# Oder mit VS Code:
code .env

# Wichtige Variablen für Development:
# DATABASE_URL sollte auf local PostgreSQL zeigen
# REDIS_URL sollte auf local Redis zeigen
# NODE_ENV=development
```

### Schritt 4: Services mit Docker starten

```bash
# Starte alle Services
docker-compose -f docker-compose.dev.yml up -d

# Überprüfe, dass alles läuft
docker-compose ps
# Output sollte zeigen: All containers "Up"

# Überprüfe die Logs (um Fehler zu sehen)
docker-compose logs backend
```

### Schritt 5: Datenbank initialisieren

```bash
# Migriere die Datenbank
docker-compose exec backend npm run db:migrate

# Optional: Lade Test-Daten
docker-compose exec backend npm run db:seed

# Überprüfe die Verbindung
docker-compose exec postgres psql -U smartlaw -d smartlaw_dev -c "SELECT COUNT(*) FROM users;"
```

### Schritt 6: Services überprüfen

```bash
# Backend Health Check
curl http://localhost:3001/health
# Response: { "status": "ok" }

# Web-App öffnen
# Öffne http://localhost:3000 im Browser
# Du solltest die Login-Seite sehen

# API Dokumentation
# Öffne http://localhost:3001/api-docs
# Du siehst alle verfügbaren API-Endpoints
```

✅ **Fertig!** Deine Entwicklungsumgebung ist komplett!

---

## 💻 First Code Changes

### First Task: "Hello World" für die API

Lass uns einen einfachen API-Endpoint erstellen!

#### Schritt 1: Backend-Service öffnen

```bash
# Navigiere zum Backend-Verzeichnis
cd services/backend

# Öffne die Projektstruktur
# Du solltest folgende Struktur sehen:
# src/
#   ├── routes/          # API Routes
#   ├── controllers/     # Business Logic
#   ├── models/          # Database Models
#   ├── middleware/      # Custom Middleware
#   └── app.js           # Main Express App
```

#### Schritt 2: Neue Route erstellen

Öffne `src/routes/hello.js`:

```javascript
// src/routes/hello.js
const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/hello/world
 * Einfacher Hello World Endpoint
 */
router.get('/world', (req, res) => {
  res.json({
    message: 'Hello World',
    timestamp: new Date().toISOString(),
    version: '1.2.4'
  });
});

/**
 * GET /api/v1/hello/:name
 * Personalisierter Greeting
 */
router.get('/:name', (req, res) => {
  const { name } = req.params;
  res.json({
    message: `Hallo, ${name}! Willkommen bei SmartLaw!`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

#### Schritt 3: Route in App registrieren

Öffne `src/app.js` und füge folgendes hinzu:

```javascript
// Irgendwo nach den anderen Routes:
const helloRoutes = require('./routes/hello');
app.use('/api/v1/hello', helloRoutes);
```

#### Schritt 4: Testen!

```bash
# Backend sollte noch laufen (wird hot-reloaded)
# Falls nicht, starte es neu:
npm run dev

# Teste die neue Route
curl http://localhost:3001/api/v1/hello/world
# Response: { "message": "Hello World", ... }

curl http://localhost:3001/api/v1/hello/Anna
# Response: { "message": "Hallo, Anna! Willkommen bei SmartLaw!", ... }
```

✅ **Glückwunsch!** Du hast deinen ersten Endpoint erstellt!

---

### Second Task: Unit Test schreiben

Jetzt schreiben wir einen Test für unseren Endpoint.

#### Öffne `src/routes/__tests__/hello.test.js`:

```javascript
// src/routes/__tests__/hello.test.js
const request = require('supertest');
const express = require('express');
const helloRoutes = require('../hello');

describe('Hello Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/api/v1/hello', helloRoutes);
  });

  describe('GET /api/v1/hello/world', () => {
    it('should return hello world message', async () => {
      const res = await request(app)
        .get('/api/v1/hello/world')
        .expect(200);

      expect(res.body.message).toBe('Hello World');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.version).toBe('1.2.4');
    });
  });

  describe('GET /api/v1/hello/:name', () => {
    it('should return personalized greeting', async () => {
      const res = await request(app)
        .get('/api/v1/hello/Anna')
        .expect(200);

      expect(res.body.message).toContain('Hallo, Anna');
      expect(res.body.message).toContain('SmartLaw');
    });

    it('should handle special characters', async () => {
      const res = await request(app)
        .get('/api/v1/hello/Test%20User')
        .expect(200);

      expect(res.body.message).toContain('Test User');
    });
  });
});
```

#### Test ausführen

```bash
# Führe alle Tests aus
npm test

# Oder nur unseren Hello Test
npm test -- hello.test.js

# Mit Coverage Report
npm test -- --coverage
```

✅ **Fantastisch!** Du hast deinen ersten Unit Test geschrieben!

---

## 🏗️ Understanding the Architecture

### High-Level Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│            (React Frontend - Port 3000)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API Server                         │
│      (Node.js/Express - Port 3001)                      │
│  ┌──────────────────────────────────────────────┐      │
│  │ Controllers → Business Logic                 │      │
│  │ Routes → Define API Endpoints                │      │
│  │ Middleware → Request Processing              │      │
│  │ Models → Database Interaction                │      │
│  └──────────────────────────────────────────────┘      │
└────┬─────────────────────────────┬─────────────────────┘
     │                             │
     ↓ SQL                         ↓ Commands
┌─────────────────┐       ┌──────────────────┐
│  PostgreSQL     │       │  Redis Cache     │
│  (Database)     │       │  (Session Store) │
└─────────────────┘       └──────────────────┘
```

### Dateistruktur erklärt

```
services/backend/
├── src/
│   ├── app.js                    # Express App Setup
│   ├── server.js                 # Server Entry Point
│   ├── config/                   # Configuration Files
│   │   ├── database.js           # PostgreSQL Connection
│   │   ├── redis.js              # Redis Connection
│   │   └── kms.js                # Encryption Config
│   │
│   ├── routes/                   # API Route Definitions
│   │   ├── auth.js               # /api/v1/auth/*
│   │   ├── users.js              # /api/v1/users/*
│   │   ├── chat.js               # /api/v1/chat/*
│   │   ├── cases.js              # /api/v1/cases/*
│   │   └── hello.js              # /api/v1/hello/* (unser neuer!)
│   │
│   ├── controllers/              # Business Logic
│   │   ├── authController.js     # Authentication Logic
│   │   ├── userController.js     # User Management
│   │   ├── chatController.js     # Chat Message Handling
│   │   └── caseController.js     # Case Management
│   │
│   ├── models/                   # Database Models
│   │   ├── User.js               # User Schema
│   │   ├── Case.js               # Case Schema
│   │   └── Message.js            # Chat Message Schema
│   │
│   ├── middleware/               # Custom Middleware
│   │   ├── auth.js               # JWT Verification
│   │   ├── errorHandler.js       # Error Handling
│   │   └── logger.js             # Request Logging
│   │
│   └── utils/                    # Utility Functions
│       ├── validators.js         # Input Validation
│       ├── helpers.js            # Helper Functions
│       └── errors.js             # Error Classes
│
├── tests/                        # Test Files
│   ├── unit/                     # Unit Tests
│   ├── integration/              # Integration Tests
│   └── fixtures/                 # Test Data
│
└── package.json                  # Dependencies
```

### Request Flow erklärt

```
1. Client sendet HTTP Request an /api/v1/users
        ↓
2. Express Router matched die Route → /routes/users.js
        ↓
3. Middleware wird ausgeführt:
   - Logger middleware logs request
   - Auth middleware überprüft JWT Token
        ↓
4. Controller wird aufgerufen (z.B. userController.getUser)
        ↓
5. Controller interagiert mit Model (Database Query)
        ↓
6. Model sendet Query an PostgreSQL
        ↓
7. PostgreSQL antwortet mit Daten
        ↓
8. Controller formattiert Response
        ↓
9. Express sendet JSON Response zum Client
        ↓
10. Client empfängt Daten und rendert
```

---

## 📚 Common Tasks

### Task 1: Einen neuen API-Endpoint erstellen

**Szenario:** Wir wollen einen Endpoint zum Zählen der Mietrechts-Cases erstellen.

**Schritte:**

1. **Route definieren** (`src/routes/cases.js`):
```javascript
router.get('/count', async (req, res) => {
  try {
    const count = await Case.countDocuments();
    res.json({ count, message: 'Total cases' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Test schreiben** (`src/routes/__tests__/cases.test.js`):
```javascript
it('should return case count', async () => {
  const res = await request(app)
    .get('/api/v1/cases/count')
    .expect(200);
  
  expect(res.body.count).toBeGreaterThanOrEqual(0);
});
```

3. **Testen**:
```bash
curl http://localhost:3001/api/v1/cases/count
npm test -- cases.test.js
```

### Task 2: Database Migration erstellen

**Szenario:** Neue Spalte `priority` zum Case hinzufügen.

```bash
# Migration erstellen
npm run db:create-migration add_priority_to_cases

# Öffne die Migration und schreibe SQL:
# migrations/2025-12-07-add-priority-to-cases.sql
ALTER TABLE cases ADD COLUMN priority VARCHAR(10) DEFAULT 'normal';

# Führe Migration aus
npm run db:migrate

# Verifiziere
psql -U smartlaw -d smartlaw_dev -c "\d cases"
```

### Task 3: Environment Variable hinzufügen

**Szenario:** Neue Feature mit API Key braucht eine Variable.

1. **In `.env` hinzufügen:**
```bash
NEW_FEATURE_API_KEY=test-key-123
NEW_FEATURE_ENABLED=true
```

2. **In Code verwenden:**
```javascript
const apiKey = process.env.NEW_FEATURE_API_KEY;
const isEnabled = process.env.NEW_FEATURE_ENABLED === 'true';
```

3. **In Tests mocken:**
```javascript
beforeEach(() => {
  process.env.NEW_FEATURE_API_KEY = 'test-key';
});
```

---

## 🧪 Testing Your Code

### Unit Tests schreiben

```javascript
// Beispiel: Controller Test
describe('UserController', () => {
  describe('getUser', () => {
    it('should return user by ID', async () => {
      const userId = '123';
      const mockUser = { id: '123', name: 'John', email: 'john@test.com' };
      
      // Mock the database
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      const result = await userController.getUser(userId);
      
      expect(result).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });
});
```

### Integration Tests schreiben

```javascript
// Beispiel: API Endpoint Test
describe('POST /api/v1/users', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'securepass123'
      })
      .expect(201);
    
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('john@test.com');
  });
});
```

### Test-Befehle

```bash
# Alle Tests ausführen
npm test

# Mit Watch Mode (tests auf Datei-Änderung)
npm test -- --watch

# Coverage Report
npm test -- --coverage

# Nur spezifische Test-Datei
npm test -- users.test.js

# Debug Mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🌳 Git Workflow

### Dein erstes Feature entwickeln

```bash
# 1. Update local repository
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-new-feature
# Branch names: feature/*, fix/*, docs/*, refactor/*

# 3. Make changes and commit
git add .
git commit -m "feat(hello): Add hello world endpoint"
# Commit formats: feat, fix, docs, style, refactor, test, chore

# 4. Push to GitHub
git push origin feature/my-new-feature

# 5. Create Pull Request on GitHub
# Öffne https://github.com/smartlaw/mietrecht/pulls
# Klick "New Pull Request"
# Select: base=main, compare=feature/my-new-feature
```

### Commit Message Konvention

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Format code
refactor: Restructure code
test: Add tests
chore: Dependency updates, build tasks

Beispiele:
- feat(auth): Implement JWT refresh token rotation
- fix(api): Handle null pointer in user endpoint
- docs: Update API documentation
- test(hello): Add unit tests for hello endpoint
```

### Pull Request Checklist

- [ ] Code folgt Projekt-Style Guide
- [ ] Alle Tests passen (`npm test`)
- [ ] Neue Tests geschrieben für neue Features
- [ ] Documentation aktualisiert
- [ ] Commit Messages sind aussagekräftig
- [ ] Nur relevant Änderungen (kein accidentales Formatting)

---

## 🆘 Getting Help

### 1. Dokumentation lesen

- **README.md** — Projekt-Übersicht
- **DEPLOYMENT_GUIDE.md** — Setup-Anleitung
- **API_DOCUMENTATION.md** — Backend API Docs
- **NJW_INTEGRATION_SUMMARY.md** — NJW-Integration
- **FEATURES_SUMMARY.md** — Feature-Liste

### 2. Code-Beispiele finden

```bash
# Suche nach ähnlichem Code
grep -r "jwt" src/          # Suche JWT-Beispiele
grep -r "findById" src/     # Suche DB-Queries

# Mit VS Code
Cmd+Shift+F (macOS) oder Ctrl+Shift+F (Windows/Linux)
```

### 3. Fehler debuggen

```bash
# Backend Logs anzeigen
docker-compose logs -f backend

# Node.js Debugger
node --inspect-brk src/server.js
# Öffne chrome://inspect in Chrome

# Database Logs
docker-compose logs postgres

# API testen mit curl oder Postman
curl http://localhost:3001/api/v1/users
```

### 4. Fragen stellen

- **Team Slack:** #development Kanal
- **Email:** dev-team@smartlaw.de
- **GitHub Issues:** https://github.com/smartlaw/mietrecht/issues
- **GitHub Discussions:** https://github.com/smartlaw/mietrecht/discussions

### 5. Useful Resources

- **Express.js Guide:** https://expressjs.com
- **Jest Testing:** https://jestjs.io
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **REST API Design:** https://restfulapi.net

---

## ✅ Next Steps

Glückwunsch, du bist jetzt ein SmartLaw Developer! 🎉

**Empfohlene nächste Schritte:**

1. **Erkunde die Codebase**
   - Schaue dir bestehende Endpoints an
   - Verstehe die Struktur
   - Lies Comments im Code

2. **Arbeite an einfachen Issues**
   - Suche nach `good-first-issue` Label
   - Starte mit Bugs statt Features
   - Frage um Hilfe wenn nötig

3. **Lerne die Tools**
   - PostgreSQL / SQL Queries
   - Git Workflows
   - Testing Best Practices
   - API Design

4. **Beitrag zum Projekt**
   - Schreibe Tests für neue Features
   - Aktualisiere Dokumentation
   - Reviewe andere Pull Requests
   - Teile Wissen mit Team

---

**Happy Coding! 🚀**

*Fragen? Frag im #development Slack Channel oder schreib an dev-team@smartlaw.de*

---

**Zuletzt aktualisiert:** 7. Dezember 2025  
**Dokumentversion:** 1.2.4  
**Status:** ✅ Production Ready
