"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bghApiClient_1 = require("./clients/bghApiClient");
const landgerichteApiClient_1 = require("./clients/landgerichteApiClient");
const beckOnlineApiClient_1 = require("./clients/beckOnlineApiClient");
const jurisApiClient_1 = require("./clients/jurisApiClient");
const bverfgApiClient_1 = require("./clients/bverfgApiClient");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use(express_1.default.json());
const bghClient = new bghApiClient_1.BGHApiClient();
const landgerichteClient = new landgerichteApiClient_1.LandgerichteApiClient();
const beckOnlineClient = new beckOnlineApiClient_1.BeckOnlineApiClient();
const jurisClient = new jurisApiClient_1.JurisApiClient();
const bverfgClient = new bverfgApiClient_1.BVerfGApiClient();
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Data Sources Service'
    });
});
app.get('/api/bgh/decisions', async (req, res) => {
    try {
        const decisions = await bghClient.getDecisions();
        res.status(200).json(decisions);
    }
    catch (error) {
        console.error('Error fetching BGH decisions:', error);
        res.status(500).json({ error: 'Failed to fetch BGH decisions' });
    }
});
app.get('/api/landgerichte/decisions', async (req, res) => {
    try {
        const decisions = await landgerichteClient.getDecisions();
        res.status(200).json(decisions);
    }
    catch (error) {
        console.error('Error fetching Landgerichte decisions:', error);
        res.status(500).json({ error: 'Failed to fetch Landgerichte decisions' });
    }
});
app.get('/api/beck-online/articles', async (req, res) => {
    try {
        const articles = await beckOnlineClient.getArticles();
        res.status(200).json(articles);
    }
    catch (error) {
        console.error('Error fetching Beck Online articles:', error);
        res.status(500).json({ error: 'Failed to fetch Beck Online articles' });
    }
});
app.get('/api/juris/documents', async (req, res) => {
    try {
        const documents = await jurisClient.getDocuments();
        res.status(200).json(documents);
    }
    catch (error) {
        console.error('Error fetching juris documents:', error);
        res.status(500).json({ error: 'Failed to fetch juris documents' });
    }
});
app.get('/api/bverfg/decisions', async (req, res) => {
    try {
        const decisions = await bverfgClient.getDecisions();
        res.status(200).json(decisions);
    }
    catch (error) {
        console.error('Error fetching BVerfG decisions:', error);
        res.status(500).json({ error: 'Failed to fetch BVerfG decisions' });
    }
});
app.listen(PORT, () => {
    console.log(`Data Sources Service listening on port ${PORT}`);
});
process.on('SIGINT', async () => {
    console.log('Shutting down Data Sources Service...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down Data Sources Service...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map