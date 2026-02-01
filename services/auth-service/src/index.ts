import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;