#!/bin/bash

# SmartLaw Agent Deployment Script
set -e

echo "🚀 Starting SmartLaw Agent Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed."
    exit 1
fi

print_status "Pulling latest changes from Git..."
git pull origin main || {
    print_warning "Git pull failed or no git repository found. Continuing with local files..."
}

print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

print_status "Building new Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_status "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Waiting for services to start..."
sleep 30

print_status "Checking service health..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "✅ Application is healthy!"
else
    print_warning "Health check failed, but continuing..."
fi

print_status "Cleaning up unused Docker resources..."
docker system prune -f

print_status "🎉 Deployment completed successfully!"
print_status "Your application should be available at:"
print_status "  - https://35-195-246-45.nip.io/smartlaw-agent"
print_status "  - https://mietrecht.jurismind.app/smartlaw-agent"

# Show container status
print_status "Container status:"
docker-compose -f docker-compose.prod.yml ps