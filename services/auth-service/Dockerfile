# Verwende Node.js 18 als Basisimage
FROM node:18-alpine

# Arbeitsverzeichnis setzen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci --only=production

# Anwendungscode kopieren
COPY . .

# Prisma-Client generieren
RUN npx prisma generate

# Port freigeben
EXPOSE 3001

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Anwendung starten
CMD ["npm", "start"]