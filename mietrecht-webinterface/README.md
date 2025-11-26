# Mietrecht Webinterface

A web interface for the Mietrecht Court Decisions Agent that provides lawyers with personalized newsletters containing relevant court decisions.

## Features

- Lawyer profile management
- Personalized preference settings
- Court decision archive
- Advanced search functionality
- RESTful API for integration

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher (optional, for database features)
- npm package manager

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mietrecht-webinterface

# Install dependencies
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3002
NODE_ENV=production

# Database Configuration (optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mietrecht_agent
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=false

# Email Configuration (for newsletter delivery)
EMAIL_SERVICE=your-email-service
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password

# API Keys (for external data sources)
BGH_API_KEY=your-bgh-api-key
LANDGERICHTE_API_KEY=your-landgerichte-api-key
```

## Database Setup

If you want to use the database features:

1. Ensure PostgreSQL is installed and running
2. Create a database and user:
   ```sql
   CREATE DATABASE mietrecht_agent;
   CREATE USER mietrecht_user WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE mietrecht_agent TO mietrecht_user;
   ```
3. Initialize the database:
   ```bash
   npm run init-db
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The application will be available at http://localhost:3002

## API Documentation

The API documentation is available in the [docs/api.md](docs/api.md) file.

## Deployment

### Heroku

1. Install the Heroku CLI
2. Log in to Heroku: `heroku login`
3. Create a Heroku app: `heroku create`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DB_HOST=your-db-host
   # Set other required environment variables
   ```
5. Deploy: `git push heroku main`

### Docker

1. Build the Docker image:
   ```bash
   docker build -t mietrecht-webinterface .
   ```
2. Run the container:
   ```bash
   docker run -p 3002:3002 -e NODE_ENV=production mietrecht-webinterface
   ```

### Traditional Server

1. Upload application files to your server
2. Install Node.js dependencies: `npm install`
3. Configure environment variables
4. Start the application: `npm start`

## Testing

### API Tests

```bash
npm run test-api
```

## Support

For support, please contact the development team.

## License

MIT