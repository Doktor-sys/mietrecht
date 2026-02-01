"use strict";
/**
 * AI Service Main Entry Point
 *
 * This is the main entry point for the AI Service in the SmartLaw Mietrecht application.
 * It initializes the service and starts the HTTP server.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiService_1 = require("./services/aiService");
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3003;
// Middleware
app.use(express_1.default.json());
// Initialize AI service
const aiService = new aiService_1.AIService();
// Initialize the AI service on startup
aiService.initialize().catch(error => {
    console.error('Failed to initialize AI service:', error);
    process.exit(1);
});
// Routes
/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'AI Service'
    });
});
/**
 * Train decision prediction model
 */
app.post('/train/decision', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }
        await aiService.trainDecisionModel(data);
        res.status(200).json({ message: 'Decision model trained successfully' });
    }
    catch (error) {
        console.error('Error training decision model:', error);
        res.status(500).json({ error: 'Failed to train decision model' });
    }
});
/**
 * Predict court decision
 */
app.post('/predict/decision', async (req, res) => {
    try {
        const caseData = req.body;
        if (!caseData) {
            return res.status(400).json({ error: 'No case data provided' });
        }
        const prediction = await aiService.predictDecision(caseData);
        res.status(200).json(prediction);
    }
    catch (error) {
        console.error('Error predicting decision:', error);
        res.status(500).json({ error: 'Failed to predict decision' });
    }
});
/**
 * Train rent price prediction model
 */
app.post('/train/rent-price', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }
        await aiService.trainRentPriceModel(data);
        res.status(200).json({ message: 'Rent price model trained successfully' });
    }
    catch (error) {
        console.error('Error training rent price model:', error);
        res.status(500).json({ error: 'Failed to train rent price model' });
    }
});
/**
 * Predict rent price
 */
app.post('/predict/rent-price', async (req, res) => {
    try {
        const propertyData = req.body;
        if (!propertyData) {
            return res.status(400).json({ error: 'No property data provided' });
        }
        const prediction = await aiService.predictRentPrice(propertyData);
        res.status(200).json(prediction);
    }
    catch (error) {
        console.error('Error predicting rent price:', error);
        res.status(500).json({ error: 'Failed to predict rent price' });
    }
});
/**
 * Train legal change prediction model
 */
app.post('/train/legal-change', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }
        await aiService.trainLegalChangeModel(data);
        res.status(200).json({ message: 'Legal change model trained successfully' });
    }
    catch (error) {
        console.error('Error training legal change model:', error);
        res.status(500).json({ error: 'Failed to train legal change model' });
    }
});
/**
 * Predict legal change
 */
app.post('/predict/legal-change', async (req, res) => {
    try {
        const lawData = req.body;
        if (!lawData) {
            return res.status(400).json({ error: 'No law data provided' });
        }
        const prediction = await aiService.predictLegalChange(lawData);
        res.status(200).json(prediction);
    }
    catch (error) {
        console.error('Error predicting legal change:', error);
        res.status(500).json({ error: 'Failed to predict legal change' });
    }
});
/**
 * Train legal precedent predictor model
 */
app.post('/train/precedent', async (req, res) => {
    try {
        const { cases, documents } = req.body;
        if (!cases || !Array.isArray(cases) || !documents || !Array.isArray(documents)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }
        await aiService.trainPrecedentPredictor(cases, documents);
        res.status(200).json({ message: 'Legal precedent predictor model trained successfully' });
    }
    catch (error) {
        console.error('Error training legal precedent predictor model:', error);
        res.status(500).json({ error: 'Failed to train legal precedent predictor model' });
    }
});
/**
 * Predict legal precedent
 */
app.post('/predict/precedent', async (req, res) => {
    try {
        const { caseData, documents } = req.body;
        if (!caseData || !documents) {
            return res.status(400).json({ error: 'No case data or documents provided' });
        }
        const prediction = await aiService.predictPrecedent(caseData, documents);
        res.status(200).json(prediction);
    }
    catch (error) {
        console.error('Error predicting legal precedent:', error);
        res.status(500).json({ error: 'Failed to predict legal precedent' });
    }
});
/**
 * Train compliance risk assessment model
 */
app.post('/train/compliance-risk', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }
        await aiService.trainComplianceRiskModel(data);
        res.status(200).json({ message: 'Compliance risk assessment model trained successfully' });
    }
    catch (error) {
        console.error('Error training compliance risk assessment model:', error);
        res.status(500).json({ error: 'Failed to train compliance risk assessment model' });
    }
});
/**
 * Assess compliance risk
 */
app.post('/assess/compliance-risk', async (req, res) => {
    try {
        const riskData = req.body;
        if (!riskData) {
            return res.status(400).json({ error: 'No risk data provided' });
        }
        const assessment = await aiService.assessComplianceRisk(riskData);
        res.status(200).json(assessment);
    }
    catch (error) {
        console.error('Error assessing compliance risk:', error);
        res.status(500).json({ error: 'Failed to assess compliance risk' });
    }
});
/**
 * Get model status
 */
app.get('/status', (req, res) => {
    try {
        const status = aiService.getModelStatus();
        res.status(200).json(status);
    }
    catch (error) {
        console.error('Error getting model status:', error);
        res.status(500).json({ error: 'Failed to get model status' });
    }
});
/**
 * Save all models
 */
app.post('/save-models', async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ error: 'No path provided' });
        }
        await aiService.saveModels(path);
        res.status(200).json({ message: 'Models saved successfully' });
    }
    catch (error) {
        console.error('Error saving models:', error);
        res.status(500).json({ error: 'Failed to save models' });
    }
});
/**
 * Load all models
 */
app.post('/load-models', async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ error: 'No path provided' });
        }
        await aiService.loadModels(path);
        res.status(200).json({ message: 'Models loaded successfully' });
    }
    catch (error) {
        console.error('Error loading models:', error);
        res.status(500).json({ error: 'Failed to load models' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`AI Service listening on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down AI Service...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down AI Service...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map