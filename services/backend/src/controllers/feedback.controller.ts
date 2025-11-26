import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const { category, message, rating, userId } = req.body;

        if (!category || !message) {
            return res.status(400).json({ error: 'Category and message are required' });
        }

        const feedback = await prisma.feedback.create({
            data: {
                category,
                message,
                rating,
                userId: userId || null, // Optional user association
            },
        });

        res.status(201).json(feedback);
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};
