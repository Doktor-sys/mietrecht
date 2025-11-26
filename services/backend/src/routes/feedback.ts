import express from 'express';
import { submitFeedback } from '../controllers/feedback.controller';
// import { authenticate } from '../middleware/auth'; // Optional: if we want to enforce auth

const router = express.Router();

// Public endpoint for feedback (can be anonymous)
router.post('/', submitFeedback);

export default router;
