import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { authenticate } from './middleware/auth';
import { gatewayConfig } from './config/gateway';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors(gatewayConfig.security.cors)); // Cross-origin resource sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Global rate limiter
const limiter = rateLimit({
  windowMs: gatewayConfig.rateLimiting.windowMs,
  max: gatewayConfig.rateLimiting.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString() 
  });
});

// Authentication middleware for protected routes
app.use('/api', authenticate);

// Service proxies
const {
  auth: authServiceUrl,
  document: documentServiceUrl,
  legalAi: legalAiServiceUrl,
  booking: bookingServiceUrl,
  payment: paymentServiceUrl,
  knowledge: knowledgeServiceUrl,
  communication: communicationServiceUrl,
  analytics: analyticsServiceUrl,
  compliance: complianceServiceUrl,
  b2b: b2bServiceUrl,
  dataSources: dataSourcesServiceUrl
} = gatewayConfig.services;

// Auth service proxy
app.use('/api/auth', createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to auth service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Users service proxy
app.use('/api/users', createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to users service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Documents service proxy
app.use('/api/documents', createProxyMiddleware({
  target: documentServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/documents': '/api/documents'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to documents service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Risk assessment service proxy
app.use('/api/risk-assessment', createProxyMiddleware({
  target: legalAiServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/risk-assessment': '/api/risk-assessment'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to risk assessment service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Strategy recommendations service proxy
app.use('/api/strategy-recommendations', createProxyMiddleware({
  target: legalAiServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/strategy-recommendations': '/api/strategy-recommendations'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to strategy recommendations service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Booking service proxy
app.use('/api/bookings', createProxyMiddleware({
  target: bookingServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/bookings': '/api/bookings'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to booking service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Payment service proxy
app.use('/api/payments', createProxyMiddleware({
  target: paymentServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to payment service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Knowledge service proxy
app.use('/api/knowledge', createProxyMiddleware({
  target: knowledgeServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/knowledge': '/api/knowledge'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to knowledge service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Communication service proxy
app.use('/api/chat', createProxyMiddleware({
  target: communicationServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/chat': '/api/chat'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to communication service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Analytics service proxy
app.use('/api/analytics', createProxyMiddleware({
  target: analyticsServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api/analytics'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to analytics service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Data Sources service proxy
app.use('/api/data-sources', createProxyMiddleware({
  target: dataSourcesServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/data-sources': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.debug('Proxying to data sources service', {
      url: proxyReq.path,
      method: req.method
    });
  }
}));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error in gateway', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

export default app;