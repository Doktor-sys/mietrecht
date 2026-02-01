"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const MobileNotificationService_1 = require("./services/MobileNotificationService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use(express_1.default.json());
const mobileNotificationService = new MobileNotificationService_1.MobileNotificationService();
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Mobile Notifications Service'
    });
});
app.post('/register-device', async (req, res) => {
    try {
        const { deviceId, deviceToken, platform, lawyerId } = req.body;
        if (!deviceId || !deviceToken || !platform) {
            return res.status(400).json({ error: 'Missing required fields: deviceId, deviceToken, platform' });
        }
        await mobileNotificationService.registerDevice(deviceId, deviceToken, platform, lawyerId);
        return res.status(200).json({ message: 'Device registered successfully' });
    }
    catch (error) {
        console.error('Error registering device:', error);
        return res.status(500).json({ error: 'Failed to register device' });
    }
});
app.post('/send-notification', async (req, res) => {
    try {
        const { deviceId, title, body, data } = req.body;
        if (!deviceId || !title || !body) {
            return res.status(400).json({ error: 'Missing required fields: deviceId, title, body' });
        }
        const result = await mobileNotificationService.sendNotification(deviceId, title, body, data);
        if (result.success) {
            return res.status(200).json({ message: 'Notification sent successfully', result });
        }
        else {
            return res.status(500).json({ error: 'Failed to send notification', result });
        }
    }
    catch (error) {
        console.error('Error sending notification:', error);
        return res.status(500).json({ error: 'Failed to send notification' });
    }
});
app.post('/send-bulk-notifications', async (req, res) => {
    try {
        const { deviceIds, title, body, data } = req.body;
        if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid deviceIds array' });
        }
        if (!title || !body) {
            return res.status(400).json({ error: 'Missing required fields: title, body' });
        }
        const results = await mobileNotificationService.sendBulkNotifications(deviceIds, title, body, data);
        return res.status(200).json({ message: 'Bulk notifications sent', results });
    }
    catch (error) {
        console.error('Error sending bulk notifications:', error);
        return res.status(500).json({ error: 'Failed to send bulk notifications' });
    }
});
app.delete('/unregister-device/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        if (!deviceId) {
            return res.status(400).json({ error: 'Missing deviceId parameter' });
        }
        await mobileNotificationService.unregisterDevice(deviceId);
        return res.status(200).json({ message: 'Device unregistered successfully' });
    }
    catch (error) {
        console.error('Error unregistering device:', error);
        return res.status(500).json({ error: 'Failed to unregister device' });
    }
});
app.listen(PORT, () => {
    console.log(`Mobile Notifications Service listening on port ${PORT}`);
});
process.on('SIGINT', async () => {
    console.log('Shutting down Mobile Notifications Service...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down Mobile Notifications Service...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map