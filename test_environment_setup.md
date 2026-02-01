# Testumgebung für SmartLaw Mietrecht

## Lokale Testumgebung mit Docker Compose

### Voraussetzungen
- Docker und Docker Compose installiert
- Mindestens 4 GB freier Arbeitsspeicher

### Einrichtung

1. **Docker Compose Testumgebung starten:**
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Datenbankmigration durchführen:**
   ```bash
   docker-compose -f docker-compose.test.yml exec backend npm run db:migrate
   ```

3. **Tests ausführen:**
   ```bash
   docker-compose -f docker-compose.test.yml exec backend npm run test
   ```

### Verfügbare Services
- **PostgreSQL:** localhost:5433
- **Redis:** localhost:6380
- **Backend:** localhost:3002
- **Web App:** localhost:3003

### Herunterfahren
```bash
docker-compose -f docker-compose.test.yml down
```

## Heroku Testumgebung

### Voraussetzungen
- Heroku CLI installiert
- Heroku Account

### Einrichtung

1. **Heroku App erstellen:**
   ```bash
   heroku create smartlaw-test-<dein-name>
   ```

2. **Add-ons provisionieren:**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   heroku addons:create heroku-redis:hobby-dev
   ```

3. **Umgebungsvariablen setzen:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

## Batch Script für einfache Bereitstellung

Ein Batch-Script wurde erstellt, um die Testumgebung schnell einzurichten:
- `setup_test_environment.bat` - Automatisches Setup der lokalen Testumgebung