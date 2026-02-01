# Verwende Node.js 18 als Basisimage
FROM node:18-alpine

# Arbeitsverzeichnis setzen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci --only=production

# Anwendungscode kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Anwendung starten
CMD ["npm", "start"]