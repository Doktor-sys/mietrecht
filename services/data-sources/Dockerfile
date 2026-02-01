# Verwende das offizielle Node.js 18 Alpine Image als Basis
FROM node:18-alpine

# Arbeitsverzeichnis im Container erstellen
WORKDIR /usr/src/app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci --only=production

# Anwendungskopieren
COPY . .

# TypeScript kompilieren
RUN npm run build

# Port freigeben
EXPOSE 3002

# Benutzer erstellen, um die Anwendung mit nicht-root-Rechten auszuführen
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Eigentümerschaft des Arbeitsverzeichnisses ändern
USER nextjs

# Anwendung starten
CMD [ "node", "dist/index.js" ]