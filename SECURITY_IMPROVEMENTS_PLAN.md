# Sicherheitsverbesserungen für den Mietrecht-Agenten

## Aktuelle Sicherheitslage

Die Anwendung implementiert bereits grundlegende Sicherheitsmaßnahmen:
- Helmet.js für HTTP-Sicherheitsheader
- Rate Limiting zur Verhinderung von Missbrauch
- Input Validation und Sanitization
- JWT-basierte Authentifizierung mit bcrypt

## Identifizierte Verbesserungsmöglichkeiten

### 1. Verbesserte Input Validation

Die aktuelle Implementierung hat einige Schwächen in der Input Validation:

**Aktuelles Problem:**
- Die Validierung von Anwalt-Daten ist unvollständig
- Fehlende Validierung für numerische Werte
- Unzureichende Überprüfung von Array-Eingaben

### 2. CORS-Konfiguration

Es fehlt eine explizite CORS-Konfiguration zur Kontrolle von Cross-Origin-Anfragen.

### 3. Verbesserte Rate Limiting-Strategie

Das aktuelle Rate Limiting ist zu allgemein und könnte verbessert werden.

### 4. Zusätzliche Sicherheitsheader

Einige empfohlene Sicherheitsheader fehlen in der Helmet-Konfiguration.

## Geplante Verbesserungen

### 1. Erweiterte Input Validation

```javascript
// In securityMiddleware.js
function validateLawyerData(lawyerData) {
  const sanitizedData = {};
  
  // Name validation (required, max 100 characters)
  if (lawyerData.name) {
    if (typeof lawyerData.name !== 'string' || lawyerData.name.length > 100) {
      throw new Error('Name must be a string with maximum 100 characters');
    }
    sanitizedData.name = sanitizeInput(lawyerData.name);
  } else {
    throw new Error('Name is required');
  }
  
  // Email validation (required, valid email format)
  if (lawyerData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof lawyerData.email !== 'string' || !emailRegex.test(lawyerData.email)) {
      throw new Error('Invalid email format');
    }
    sanitizedData.email = lawyerData.email.toLowerCase();
  } else {
    throw new Error('Email is required');
  }
  
  // Law firm validation (optional, max 100 characters)
  if (lawyerData.law_firm) {
    if (typeof lawyerData.law_firm !== 'string' || lawyerData.law_firm.length > 100) {
      throw new Error('Law firm must be a string with maximum 100 characters');
    }
    sanitizedData.law_firm = sanitizeInput(lawyerData.law_firm);
  }
  
  // Practice areas validation (optional array of strings)
  if (lawyerData.practice_areas) {
    if (!Array.isArray(lawyerData.practice_areas)) {
      throw new Error('Practice areas must be an array');
    }
    if (lawyerData.practice_areas.length > 20) {
      throw new Error('Maximum 20 practice areas allowed');
    }
    sanitizedData.practice_areas = lawyerData.practice_areas.map(area => {
      if (typeof area !== 'string' || area.length > 50) {
        throw new Error('Each practice area must be a string with maximum 50 characters');
      }
      return sanitizeInput(area);
    });
  }
  
  // Regions validation (optional array of strings)
  if (lawyerData.regions) {
    if (!Array.isArray(lawyerData.regions)) {
      throw new Error('Regions must be an array');
    }
    if (lawyerData.regions.length > 20) {
      throw new Error('Maximum 20 regions allowed');
    }
    sanitizedData.regions = lawyerData.regions.map(region => {
      if (typeof region !== 'string' || region.length > 50) {
        throw new Error('Each region must be a string with maximum 50 characters');
      }
      return sanitizeInput(region);
    });
  }
  
  return sanitizedData;
}
```

### 2. CORS-Konfiguration hinzufügen

```javascript
// In web_config_server.js
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
```

### 3. Verbesserte Rate Limiting-Strategie

```javascript
// In securityMiddleware.js
function applyRateLimiting(app) {
  // General rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // API rate limiter (stricter)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
      error: 'Too many API requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Authentication rate limiter (most strict)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 attempts per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all requests
  app.use(generalLimiter);
  
  // Apply stricter rate limiting to API endpoints
  app.use('/api/', apiLimiter);
  
  // Apply strictest rate limiting to auth endpoints
  app.use('/api/auth/', authLimiter);
}
```

### 4. Erweiterte Helmet-Konfiguration

```javascript
// In securityMiddleware.js
function applySecurityHeaders(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    // Disable powered by header to prevent leaking information
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // Prevent cross-site scripting attacks
    xssFilter: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Enforce HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // Prevent cross-site scripting
    referrerPolicy: { policy: 'no-referrer' },
    // Prevent DNS prefetching
    dnsPrefetchControl: { allow: false }
  }));
}
```

## Implementierungsplan

### Phase 1: Input Validation verbessern
- Erweiterte Validierung für alle Eingabedaten implementieren
- Tests für die neue Validierung erstellen

### Phase 2: CORS und Rate Limiting hinzufügen
- CORS-Middleware installieren und konfigurieren
- Authentifizierungs-Rate-Limiting hinzufügen

### Phase 3: Helmet-Konfiguration erweitern
- Zusätzliche Sicherheitsheader aktivieren
- Content Security Policy anpassen

### Phase 4: Umfassende Tests
- Sicherheitstests für alle neuen Funktionen erstellen
- Penetrationstests durchführen

## Abhängigkeiten

Neue Pakete, die installiert werden müssen:
```bash
npm install cors
```

## Tests

Für jede Änderung werden entsprechende Tests erstellt:
- Unit-Tests für die erweiterte Input Validation
- Integrationstests für CORS
- Lasttests für das verbesserte Rate Limiting