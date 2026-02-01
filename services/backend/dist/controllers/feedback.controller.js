"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedback = void 0;
const database_1 = require("../config/database");
const submitFeedback = async (req, res) => {
    try {
        const { category, message, rating, userId } = req.body;
        if (!category || !message) {
            return res.status(400).json({ error: 'Category and message are required' });
        }
        const feedback = await database_1.prisma.feedback.create({
            data: {
                category,
                message,
                rating,
                userId: userId || null, // Optional user association
            },
        });
        res.status(201).json(feedback);
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};
exports.submitFeedback = submitFeedback;
