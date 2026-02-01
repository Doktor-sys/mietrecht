"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const document_1 = __importDefault(require("./routes/document"));
const chat_1 = __importDefault(require("./routes/chat"));
const lawyer_1 = __importDefault(require("./routes/lawyer"));
const risk_assessment_1 = __importDefault(require("./routes/risk-assessment"));
const strategy_recommendations_1 = __importDefault(require("./routes/strategy-recommendations"));
const monitoringRoutes_1 = __importDefault(require("./routes/monitoringRoutes"));
const mobileNotifications_1 = __importDefault(require("./routes/mobileNotifications"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const rateLimiter_1 = require("./middleware/rateLimiter");
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Cross-origin resource sharing
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Apply rate limiting to all requests
app.use((0, rateLimiter_1.rateLimiter)(rateLimiter_1.RATE_LIMIT_CONFIGS.API_DEFAULT));
// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/documents', auth_2.authenticate, document_1.default);
app.use('/api/chat', auth_2.authenticate, chat_1.default);
app.use('/api/lawyers', auth_2.authenticate, lawyer_1.default);
app.use('/api/risk-assessment', auth_2.authenticate, risk_assessment_1.default);
app.use('/api/strategy-recommendations', auth_2.authenticate, strategy_recommendations_1.default);
app.use('/api/monitoring', monitoringRoutes_1.default);
app.use('/api/mobile', mobileNotifications_1.default);
app.use('/api/dashboard', dashboard_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
