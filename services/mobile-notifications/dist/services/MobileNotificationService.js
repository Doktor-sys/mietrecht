"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}
else {
    firebase_admin_1.default.initializeApp();
}
class MobileNotificationService {
    constructor() {
        this.registeredDevices = new Map();
        console.log('Mobile Notification Service initialized');
    }
    async registerDevice(deviceId, deviceToken, platform, lawyerId) {
        const registration = {
            deviceId,
            deviceToken,
            platform,
            lawyerId,
            registeredAt: new Date()
        };
        this.registeredDevices.set(deviceId, registration);
        console.log(`Device registered: ${deviceId} (${platform})`);
    }
    async unregisterDevice(deviceId) {
        if (this.registeredDevices.has(deviceId)) {
            this.registeredDevices.delete(deviceId);
            console.log(`Device unregistered: ${deviceId}`);
        }
    }
    async sendNotification(deviceId, title, body, data) {
        const device = this.registeredDevices.get(deviceId);
        if (!device) {
            return { success: false, error: 'Device not registered' };
        }
        try {
            const message = {
                notification: {
                    title,
                    body
                },
                token: device.deviceToken,
                data: data || {}
            };
            const response = await firebase_admin_1.default.messaging().send(message);
            console.log(`Notification sent successfully to device ${deviceId}: ${response}`);
            return { success: true };
        }
        catch (error) {
            console.error(`Error sending notification to device ${deviceId}:`, error);
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
    async sendBulkNotifications(deviceIds, title, body, data) {
        const results = [];
        const batchSize = 500;
        for (let i = 0; i < deviceIds.length; i += batchSize) {
            const batch = deviceIds.slice(i, i + batchSize);
            const batchPromises = batch.map(deviceId => this.sendNotification(deviceId, title, body, data));
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach((result, index) => {
                results.push({
                    deviceId: batch[index],
                    success: result.success,
                    error: result.error
                });
            });
        }
        return results;
    }
    async sendNotificationToLawyer(lawyerId, title, body, data) {
        const lawyerDevices = Array.from(this.registeredDevices.values())
            .filter(device => device.lawyerId === lawyerId)
            .map(device => device.deviceId);
        return this.sendBulkNotifications(lawyerDevices, title, body, data);
    }
    getRegisteredDevicesCount() {
        return this.registeredDevices.size;
    }
    getLawyerDevices(lawyerId) {
        return Array.from(this.registeredDevices.values())
            .filter(device => device.lawyerId === lawyerId)
            .map(device => device.deviceId);
    }
}
exports.MobileNotificationService = MobileNotificationService;
//# sourceMappingURL=MobileNotificationService.js.map