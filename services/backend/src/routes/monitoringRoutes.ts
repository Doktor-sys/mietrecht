import express from 'express';
import MonitoringController from '../controllers/MonitoringController';

const router = express.Router();

/**
 * @route GET /api/monitoring/dashboard
 * @desc Get monitoring dashboard data
 * @access Public
 */
router.get('/dashboard', MonitoringController.getDashboardData);

/**
 * @route POST /api/monitoring/reset
 * @desc Reset all metrics
 * @access Public
 */
router.post('/reset', MonitoringController.resetMetrics);

export default router;