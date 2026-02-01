# API Gateway

API Gateway for SmartLaw Mietrecht microservices.

## Overview

This service acts as a single entry point for all client requests and routes them to the appropriate microservices. It handles authentication, rate limiting, logging, and other cross-cutting concerns.

## Features

- Request routing to microservices
- Authentication and authorization
- Rate limiting
- CORS support
- Request/response logging
- Health checks
- Error handling

## Tech Stack

- Node.js with Express
- TypeScript
- http-proxy-middleware for service routing
- JSON Web Tokens (JWT) for authentication
- Docker for containerization

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### Installation

1. Clone the repository
2. Navigate to the api-gateway directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running with Docker

```bash
docker-compose up --build
```

### Running locally

1. Set up environment variables in a `.env` file:
   ```
   AUTH_SERVICE_URL=http://localhost:3001
   DOCUMENT_SERVICE_URL=http://localhost:3002
   LEGAL_AI_SERVICE_URL=http://localhost:3003
   JWT_SECRET=your-jwt-secret
   ```

2. Run the service:
   ```bash
   npm run dev
   ```

## Configuration

The gateway can be configured through environment variables:

- `AUTH_SERVICE_URL` - URL for the authentication service
- `DOCUMENT_SERVICE_URL` - URL for the document service
- `LEGAL_AI_SERVICE_URL` - URL for the legal AI service
- `JWT_SECRET` - Secret for verifying JWT tokens
- `CORS_ORIGIN` - Allowed CORS origins
- `PORT` - Port to run the gateway on (default: 3000)

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Auth Service Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `POST /api/auth/refresh` - Refresh JWT token

### User Service Routes

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Document Service Routes

- `GET /api/documents` - Get documents
- `POST /api/documents` - Upload a document

### Legal AI Service Routes

- `POST /api/risk-assessment/document/:id` - Assess risk for a document
- `POST /api/strategy-recommendations/document/:id` - Get strategy recommendations

## Service Discovery

The gateway uses static service URLs configured through environment variables. In a production environment, this could be replaced with a service discovery mechanism like Consul or Eureka.

## Rate Limiting

The gateway implements rate limiting to prevent abuse. By default, each IP is limited to 100 requests per 15 minutes.

## Security

- JWT-based authentication for protected routes
- Helmet.js for security headers
- CORS configuration
- Input validation

## Logging

All requests are logged with method, path, IP address, and user agent.

## Health Checks

The gateway provides a health check endpoint at `/health` and monitors the health of downstream services.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.