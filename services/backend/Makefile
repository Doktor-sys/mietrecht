# SmartLaw Backend Makefile
# Vereinfacht Datenbank- und Entwicklungsoperationen

.PHONY: help install dev build test lint clean db-setup db-migrate db-seed db-reset db-studio kms-generate kms-validate

# Default target
help:
	@echo "SmartLaw Backend - Verfügbare Befehle:"
	@echo ""
	@echo "  install     - Installiere Dependencies"
	@echo "  dev         - Starte Development Server"
	@echo "  build       - Baue das Projekt"
	@echo "  test        - Führe Tests aus"
	@echo "  lint        - Führe Linting aus"
	@echo "  clean       - Lösche Build-Artefakte"
	@echo ""
	@echo "  db-setup    - Erstelle und migriere Datenbank"
	@echo "  db-migrate  - Führe Datenbank-Migrationen aus"
	@echo "  db-seed     - Fülle Datenbank mit Testdaten"
	@echo "  db-reset    - Setze Datenbank zurück und fülle mit Testdaten"
	@echo "  db-studio   - Öffne Prisma Studio"
	@echo ""
	@echo "  kms-generate - Generiere KMS Encryption Keys"
	@echo "  kms-validate - Validiere KMS Konfiguration"

# Development
install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

test-watch:
	npm run test:watch

lint:
	npm run lint

clean:
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/

# Database Operations
db-setup:
	@echo "🔧 Erstelle Datenbank und führe Migrationen aus..."
	npx prisma migrate dev --name init
	@echo "✅ Datenbank-Setup abgeschlossen"

db-migrate:
	@echo "🔄 Führe Datenbank-Migrationen aus..."
	npx prisma migrate dev
	@echo "✅ Migrationen abgeschlossen"

db-generate:
	@echo "🔧 Generiere Prisma Client..."
	npx prisma generate
	@echo "✅ Prisma Client generiert"

db-seed:
	@echo "🌱 Fülle Datenbank mit Testdaten..."
	npx ts-node prisma/seed.ts
	@echo "✅ Seeding abgeschlossen"

db-reset:
	@echo "🔄 Setze Datenbank zurück..."
	npx prisma migrate reset --force
	@echo "🌱 Fülle mit Testdaten..."
	npx ts-node prisma/seed.ts
	@echo "✅ Datenbank-Reset abgeschlossen"

db-studio:
	@echo "🎨 Öffne Prisma Studio..."
	npx prisma studio

db-deploy:
	@echo "🚀 Deploye Datenbank-Schema..."
	npx prisma migrate deploy
	@echo "✅ Deployment abgeschlossen"

# Docker Operations
docker-build:
	docker build -t smartlaw-backend .

docker-dev:
	docker-compose -f ../../docker-compose.dev.yml up backend

# Production
start:
	npm start

# Testing
test-unit:
	npm run test -- --testPathPattern="unit"

test-integration:
	npm run test -- --testPathPattern="integration"

test-coverage:
	npm run test -- --coverage

# Linting and Formatting
lint-fix:
	npm run lint -- --fix

format:
	npx prettier --write "src/**/*.{ts,js,json}"

# Health Checks
check-deps:
	npm audit

check-outdated:
	npm outdated

# Environment
env-copy:
	cp .env.example .env
	@echo "📝 .env Datei erstellt. Bitte konfiguriere die Umgebungsvariablen."

# KMS Operations
kms-generate:
	@echo "🔐 Generiere KMS Encryption Keys..."
	node scripts/generate-kms-keys.js
	@echo ""
	@echo "💡 Füge die generierten Keys zu deiner .env Datei hinzu"

kms-validate:
	@echo "🔍 Validiere KMS Konfiguration..."
	node scripts/validate-kms-config.js

# All-in-one Setup für neue Entwickler
setup: install env-copy db-generate db-setup db-seed
	@echo "🎉 Setup abgeschlossen!"
	@echo ""
	@echo "⚠️  WICHTIG: Generiere KMS Keys mit 'make kms-generate'"
	@echo "           und füge sie zu deiner .env Datei hinzu."
	@echo ""
	@echo "Dann kannst du 'make dev' ausführen."