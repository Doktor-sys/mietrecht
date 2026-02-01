"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const https = __importStar(require("https"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/mobile/register:
 *   post:
 *     summary: Register a mobile device for push notifications
 *     tags: [Mobile]
 *     description: Registers a mobile device to receive push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier
 *               deviceToken:
 *                 type: string
 *                 description: Device token for push notifications
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *                 description: Device platform
 *               lawyerId:
 *                 type: string
 *                 description: Associated lawyer ID (optional)
 *     responses:
 *       200:
 *         description: Device registered successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
    try {
        const { deviceId, deviceToken, platform, lawyerId } = req.body;
        if (!deviceId || !deviceToken || !platform) {
            return res.status(400).json({ error: 'Missing required fields: deviceId, deviceToken, platform' });
        }
        // Forward request to mobile notification service
        const postData = JSON.stringify({
            deviceId,
            deviceToken,
            platform,
            lawyerId
        });
        const options = {
            hostname: process.env.MOBILE_NOTIFICATIONS_SERVICE_HOST || 'localhost',
            port: process.env.MOBILE_NOTIFICATIONS_SERVICE_PORT || 3005,
            path: '/register-device',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const forwardReq = https.request(options, (forwardRes) => {
            let responseData = '';
            forwardRes.on('data', chunk => {
                responseData += chunk;
            });
            forwardRes.on('end', () => {
                const statusCode = forwardRes.statusCode || 500;
                if (statusCode >= 200 && statusCode < 300) {
                    res.status(200).json(JSON.parse(responseData));
                }
                else {
                    res.status(statusCode).json({ error: `Registration failed: ${responseData}` });
                }
            });
        });
        forwardReq.on('error', error => {
            console.error('Error forwarding registration request:', error);
            res.status(500).json({ error: 'Failed to register device' });
        });
        forwardReq.write(postData);
        forwardReq.end();
    }
    catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: 'Failed to register device' });
    }
});
/**
 * @swagger
 * /api/mobile/unregister/{deviceId}:
 *   delete:
 *     summary: Unregister a mobile device from push notifications
 *     tags: [Mobile]
 *     description: Unregisters a mobile device from receiving push notifications
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique device identifier
 *     responses:
 *       200:
 *         description: Device unregistered successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.delete('/unregister/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        if (!deviceId) {
            return res.status(400).json({ error: 'Missing deviceId parameter' });
        }
        // Forward request to mobile notification service
        const options = {
            hostname: process.env.MOBILE_NOTIFICATIONS_SERVICE_HOST || 'localhost',
            port: process.env.MOBILE_NOTIFICATIONS_SERVICE_PORT || 3005,
            path: `/unregister-device/${deviceId}`,
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const forwardReq = https.request(options, (forwardRes) => {
            let responseData = '';
            forwardRes.on('data', chunk => {
                responseData += chunk;
            });
            forwardRes.on('end', () => {
                const statusCode = forwardRes.statusCode || 500;
                if (statusCode >= 200 && statusCode < 300) {
                    res.status(200).json(JSON.parse(responseData));
                }
                else {
                    res.status(statusCode).json({ error: `Unregistration failed: ${responseData}` });
                }
            });
        });
        forwardReq.on('error', error => {
            console.error('Error forwarding unregistration request:', error);
            res.status(500).json({ error: 'Failed to unregister device' });
        });
        forwardReq.end();
    }
    catch (error) {
        console.error('Error unregistering device:', error);
        res.status(500).json({ error: 'Failed to unregister device' });
    }
});
exports.default = router;
