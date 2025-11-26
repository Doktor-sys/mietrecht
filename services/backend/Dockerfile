# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy shared modules
COPY shared ./shared

# Copy service package files
COPY services/backend/package*.json ./services/backend/

# Install dependencies
RUN npm ci

# Copy service source code
COPY services/backend ./services/backend

# Generate Prisma Client
WORKDIR /app/services/backend
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Production Stage
FROM node:18-alpine AS production

# Install wget for health check
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy shared modules (needed for runtime if not bundled)
COPY shared ./shared

# Copy service package files
COPY services/backend/package*.json ./services/backend/

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder /app/services/backend/dist ./services/backend/dist
COPY --from=builder /app/services/backend/node_modules/.prisma ./services/backend/node_modules/.prisma
COPY --from=builder /app/services/backend/node_modules/@prisma ./services/backend/node_modules/@prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Change to non-root user
USER nextjs

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start application
WORKDIR /app/services/backend
CMD ["node", "dist/index.js"]
