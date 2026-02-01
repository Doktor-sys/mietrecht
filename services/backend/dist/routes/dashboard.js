"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/dashboard/notifications:
 *   get:
 *     summary: Get real-time notification statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/notifications', auth_1.authenticate, (0, auth_2.authorize)(client_1.UserType.BUSINESS), async (req, res) => {
    try {
        // In a real implementation, this would fetch data from a database or cache
        const stats = {
            totalSent: 1247,
            emailSent: 892,
            smsSent: 45,
            pushSent: 310,
            successRate: 98.2,
            topChannels: [
                { channel: 'email', count: 892 },
                { channel: 'push', count: 310 },
                { channel: 'sms', count: 45 }
            ],
            recentNotifications: [
                {
                    id: 'notif_123',
                    title: 'Neues Mietrechtsurteil',
                    channel: 'email',
                    status: 'delivered',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'notif_124',
                    title: 'Systemwartung',
                    channel: 'push',
                    status: 'sent',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ]
        };
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching notification stats', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Statistiken'
            }
        });
    }
});
/**
 * @swagger
 * /api/dashboard/chat:
 *   get:
 *     summary: Get real-time chat statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/chat', auth_1.authenticate, (0, auth_2.authorize)(client_1.UserType.BUSINESS), async (req, res) => {
    try {
        // In a real implementation, this would fetch data from a database or cache
        const stats = {
            totalMessages: 2847,
            activeConversations: 32,
            avgResponseTime: 120, // in seconds
            satisfactionRate: 87.5, // percentage
            topTopics: [
                { topic: 'Mietminderung', count: 420 },
                { topic: 'Kündigung', count: 380 },
                { topic: 'Nebenkosten', count: 315 }
            ],
            recentChats: [
                {
                    id: 'chat_123',
                    user: 'Max Mustermann',
                    topic: 'Mietminderung',
                    status: 'active',
                    lastMessage: 'Wie hoch darf die Mietminderung sein?',
                    timestamp: new Date().toISOString()
                }
            ]
        };
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching chat stats', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Chat-Statistiken'
            }
        });
    }
});
/**
 * @swagger
 * /api/dashboard/stream:
 *   get:
 *     summary: Stream real-time dashboard updates via Server-Sent Events
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Server-Sent Events stream
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stream', auth_1.authenticate, (0, auth_2.authorize)(client_1.UserType.BUSINESS), (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    // Send initial data
    const initialData = {
        timestamp: new Date().toISOString(),
        message: 'Connected to real-time dashboard stream'
    };
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);
    // Send periodic updates
    const interval = setInterval(() => {
        const updateData = {
            timestamp: new Date().toISOString(),
            notificationStats: {
                totalSent: Math.floor(Math.random() * 1000) + 1000,
                emailSent: Math.floor(Math.random() * 800) + 800,
                pushSent: Math.floor(Math.random() * 300) + 300
            },
            chatStats: {
                activeConversations: Math.floor(Math.random() * 50) + 10,
                totalMessages: Math.floor(Math.random() * 3000) + 2000
            }
        };
        res.write(`data: ${JSON.stringify(updateData)}\n\n`);
    }, 5000); // Send updates every 5 seconds
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});
exports.default = router;
