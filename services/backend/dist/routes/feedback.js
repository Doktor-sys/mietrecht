"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feedback_controller_1 = require("../controllers/feedback.controller");
// import { authenticate } from '../middleware/auth'; // Optional: if we want to enforce auth
const router = express_1.default.Router();
// Public endpoint for feedback (can be anonymous)
router.post('/', feedback_controller_1.submitFeedback);
exports.default = router;
