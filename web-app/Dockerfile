# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy shared modules (if needed by frontend)
COPY shared ./shared

# Copy web-app package files
COPY web-app/package*.json ./web-app/

# Install dependencies (Force Rebuild - TS Downgrade)
RUN npm install --legacy-peer-deps || npm install --force

# Copy web-app source code
COPY web-app ./web-app

# Build React App
WORKDIR /app/web-app
RUN npm run build

# Production Stage
FROM nginx:alpine

# Install curl for health check
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/web-app/build /usr/share/nginx/html

# Set proper ownership for nginx files
RUN chown -R nginx:nginx /usr/share/nginx/html

# Copy custom nginx config if needed (using default for now)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
