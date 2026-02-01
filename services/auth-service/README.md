# Auth Service

Authentication service for SmartLaw Mietrecht application.

## Overview

This service handles user authentication, registration, and session management for the SmartLaw platform.

## Features

- User registration and login
- JWT-based authentication
- Password reset functionality
- Email verification
- Session management
- Role-based access control

## Tech Stack

- Node.js with Express
- TypeScript
- PostgreSQL with Prisma ORM
- JSON Web Tokens (JWT)
- Bcrypt for password hashing
- Docker for containerization

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (when running without Docker)

### Installation

1. Clone the repository
2. Navigate to the auth-service directory
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
   DATABASE_URL=postgresql://user:password@localhost:5432/auth_service
   JWT_SECRET=your-jwt-secret
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   ```

2. Run the service:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences
- `GET /api/users/sessions` - Get active sessions
- `DELETE /api/users/sessions/:sessionId` - Terminate a session

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `REFRESH_TOKEN_SECRET` - Secret for signing refresh tokens
- `NODE_ENV` - Environment (development, production)
- `PORT` - Port to run the service on (default: 3001)

## Testing

Run tests with:
```bash
npm test
```

## Health Check

The service provides a health check endpoint at `/health`.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.