import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/document';
import chatRoutes from './routes/chat';
import lawyerRoutes from './routes/lawyer';
import riskAssessmentRoutes from './routes/risk-assessment';
import strategyRecommendationRoutes from './routes/strategy-recommendations';
import monitoringRoutes from './routes/monitoringRoutes';
import mobileNotificationRoutes from './routes/mobileNotifications';
import dashboardRoutes from './routes/dashboard';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { rateLimiter, RATE_LIMIT_CONFIGS } from './middleware/rateLimiter';

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting to all requests
app.use(rateLimiter(RATE_LIMIT_CONFIGS.API_DEFAULT));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/lawyers', authenticate, lawyerRoutes);
app.use('/api/risk-assessment', authenticate, riskAssessmentRoutes);
app.use('/api/strategy-recommendations', authenticate, strategyRecommendationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/mobile', mobileNotificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

export default app;