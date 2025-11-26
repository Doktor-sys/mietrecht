-- Initialisierung der SmartLaw Datenbank
-- Diese Datei wird beim ersten Start des PostgreSQL-Containers ausgeführt

-- Erstelle Datenbank falls sie nicht existiert
SELECT 'CREATE DATABASE smartlaw_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'smartlaw_dev')\gexec

-- Erstelle Test-Datenbank
SELECT 'CREATE DATABASE smartlaw_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'smartlaw_test')\gexec

-- Verbinde zur Hauptdatenbank
\c smartlaw_dev;

-- Aktiviere Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Erstelle Indizes für bessere Performance bei Textsuche
-- Diese werden nach der Prisma-Migration hinzugefügt

-- Verbinde zur Test-Datenbank
\c smartlaw_test;

-- Aktiviere Erweiterungen auch für Test-DB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";