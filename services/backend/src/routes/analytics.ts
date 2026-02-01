import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { UserType } from '@prisma/client';
import { logger } from '../utils/logger';
import { CentralizedAnalyticsService } from '../services/CentralizedAnalyticsService';
import { DataVisualizationService } from '../services/DataVisualizationService';
import { AutomatedReportCronJob } from '../services/AutomatedReportCronJob';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const centralizedAnalyticsService = new CentralizedAnalyticsService(prisma);
const dataVisualizationService = new DataVisualizationService(prisma);
const automatedReportCronJob = new AutomatedReportCronJob(prisma);

/**
 * @swagger
 * /api/analytics/consolidated:
 *   get:
 *     summary: Get consolidated analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *       - in: query
 *         name: includeTrends
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeBenchmarking
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeCompliance
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeLegalUpdates
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Consolidated analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/consolidated', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      startDate,
      endDate,
      groupBy,
      includeTrends = true,
      includeBenchmarking = true,
      includeCompliance = true,
      includeLegalUpdates = true
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'organizationId is required'
        }
      });
    }

    const analytics = await centralizedAnalyticsService.generateConsolidatedAnalytics({
      organizationId: organizationId as string,
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
      groupBy: groupBy as 'day' | 'week' | 'month',
      includeTrends: includeTrends === 'true',
      includeBenchmarking: includeBenchmarking === 'true',
      includeCompliance: includeCompliance === 'true',
      includeLegalUpdates: includeLegalUpdates === 'true'
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error fetching consolidated analytics', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Analytics-Daten'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard/widgets:
 *   post:
 *     summary: Get data for custom dashboard widgets
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId:
 *                 type: string
 *               widgets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [metric, chart, table, trend]
 *                     title:
 *                       type: string
 *                     dataSource:
 *                       type: string
 *                     config:
 *                       type: object
 *               filters:
 *                 type: object
 *                 properties:
 *                   dateRange:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                   jurisdictions:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Dashboard widget data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/dashboard/widgets', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { organizationId, widgets, filters } = req.body;

    if (!organizationId || !widgets || !filters) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'organizationId, widgets, and filters are required'
        }
      });
    }

    const widgetData = await centralizedAnalyticsService.getDashboardWidgetData({
      organizationId,
      widgets,
      filters
    });

    res.status(200).json({
      success: true,
      data: widgetData
    });
  } catch (error) {
    logger.error('Error fetching dashboard widget data', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Dashboard-Daten'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/visualizations:
 *   post:
 *     summary: Generate data visualizations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId:
 *                 type: string
 *               visualizationType:
 *                 type: string
 *                 enum: [trendLine, usagePie, heatmap, barChart, scatterPlot]
 *               dataType:
 *                 type: string
 *                 enum: [legalTrends, usageMetrics, performance, compliance]
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date-time
 *                   end:
 *                     type: string
 *                     format: date-time
 *               filters:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generated visualizations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/visualizations', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { organizationId, visualizationType, dataType, dateRange, filters, options } = req.body;

    if (!organizationId || !visualizationType || !dataType || !dateRange) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'organizationId, visualizationType, dataType, and dateRange are required'
        }
      });
    }

    const visualizations = await dataVisualizationService.generateDashboardVisualizations({
      organizationId,
      visualizationType,
      dataType,
      dateRange,
      filters,
      options
    });

    res.status(200).json({
      success: true,
      data: visualizations
    });
  } catch (error) {
    logger.error('Error generating visualizations', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Generieren der Visualisierungen'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports/schedules:
 *   get:
 *     summary: Get all report schedules for an organization
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report schedules
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/reports/schedules', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'organizationId is required'
        }
      });
    }

    const schedules = await (prisma as any).reportSchedule.findMany({
      where: { organizationId: organizationId as string }
    });

    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    logger.error('Error fetching report schedules', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Abrufen der Report-Zeitpläne'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports/schedules:
 *   post:
 *     summary: Create a new report schedule
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId:
 *                 type: string
 *               reportType:
 *                 type: string
 *                 enum: [usage, performance, compliance, comprehensive, custom]
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly]
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               dayOfMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *               time:
 *                 type: string
 *                 format: time
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               format:
 *                 type: string
 *                 enum: [pdf, csv, json]
 *               customConfig:
 *                 type: object
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Created report schedule
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/reports/schedules', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const scheduleData = req.body;

    if (!scheduleData.organizationId || !scheduleData.reportType || !scheduleData.frequency || !scheduleData.time) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'organizationId, reportType, frequency, and time are required'
        }
      });
    }

    const schedule = await automatedReportCronJob.addReportSchedule(scheduleData);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Error creating report schedule', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Erstellen des Report-Zeitplans'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports/schedules/{id}:
 *   put:
 *     summary: Update an existing report schedule
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [usage, performance, compliance, comprehensive, custom]
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly]
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               dayOfMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *               time:
 *                 type: string
 *                 format: time
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               format:
 *                 type: string
 *                 enum: [pdf, csv, json]
 *               customConfig:
 *                 type: object
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated report schedule
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report schedule not found
 */
router.put('/reports/schedules/:id', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const schedule = await automatedReportCronJob.updateReportSchedule(id, updateData);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error(`Error updating report schedule ${req.params.id}`, { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Aktualisieren des Report-Zeitplans'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports/schedules/{id}:
 *   delete:
 *     summary: Delete a report schedule
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report schedule deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report schedule not found
 */
router.delete('/reports/schedules/:id', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await automatedReportCronJob.removeReportSchedule(id);

    res.status(200).json({
      success: true,
      message: 'Report-Zeitplan erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error(`Error deleting report schedule ${req.params.id}`, { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Löschen des Report-Zeitplans'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports/generate/{scheduleId}:
 *   post:
 *     summary: Generate a report immediately
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report generation started
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report schedule not found
 */
router.post('/reports/generate/:scheduleId', authenticate, authorize(UserType.BUSINESS), async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    await automatedReportCronJob.generateReportNow(scheduleId);

    res.status(200).json({
      success: true,
      message: 'Report-Generierung gestartet'
    });
  } catch (error) {
    logger.error(`Error generating report for schedule ${req.params.scheduleId}`, { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Fehler beim Starten der Report-Generierung'
      }
    });
  }
});

export default router;