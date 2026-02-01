# Use Node.js 18 LTS as base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install Python and build tools (required for tfjs-node)
RUN apt-get update && apt-get install -y \
  python3 \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "start"]