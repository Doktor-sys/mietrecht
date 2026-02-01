# Docker Deployment for Mietrecht Agent

This document explains how to deploy the Mietrecht Agent using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (optional but recommended)

## Building and Running with Docker

### Using Docker Compose (Recommended)

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the application at `http://localhost:3000`

3. To stop the containers:
   ```bash
   docker-compose down
   ```

### Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t mietrecht-agent .
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name mietrecht-agent \
     -p 3000:3000 \
     -v $(pwd)/scripts/database/data:/app/scripts/database/data \
     -e NODE_ENV=production \
     -e PORT=3000 \
     -e JWT_SECRET=mietrecht-agent-secret-key \
     mietrecht-agent
   ```

3. Access the application at `http://localhost:3000`

## Configuration

Environment variables can be set in the `docker-compose.yml` file or passed directly to the `docker run` command:

- `NODE_ENV`: Set to "production" for production deployments
- `PORT`: Port on which the application will run (default: 3000)
- `JWT_SECRET`: Secret key for JWT token generation

## Data Persistence

The database files are stored in a volume mapped to `./scripts/database/data` on the host machine. This ensures that data persists even when containers are recreated.

## Health Checks

The container includes a health check that verifies the application is responding correctly. You can check the container's health status with:

```bash
docker inspect --format='{{json .State.Health}}' mietrecht-agent
```

## Updating the Application

To update the application:

1. Stop the running container:
   ```bash
   docker-compose down
   ```

2. Pull the latest changes or rebuild the image:
   ```bash
   docker-compose build
   ```

3. Start the container again:
   ```bash
   docker-compose up -d
   ```