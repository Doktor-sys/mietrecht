"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MonitoringController_1 = __importDefault(require("../controllers/MonitoringController"));
const router = express_1.default.Router();
/**
 * @route GET /api/monitoring/dashboard
 * @desc Get monitoring dashboard data
 * @access Public
 */
router.get('/dashboard', MonitoringController_1.default.getDashboardData);
/**
 * @route POST /api/monitoring/reset
 * @desc Reset all metrics
 * @access Public
 */
router.post('/reset', MonitoringController_1.default.resetMetrics);
exports.default = router;
