"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// In-memory storage for metrics
const metricsStore = {
    apiCalls: new Map(),
    mlProcessing: new Map(),
    system: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
    },
    lastUpdated: Date.now()
};
// Update system metrics periodically
setInterval(() => {
    metricsStore.system.memory = process.memoryUsage();
    metricsStore.system.uptime = process.uptime();
    metricsStore.lastUpdated = Date.now();
}, 5000);
class MonitoringController {
    /**
     * Record an API call for monitoring
     * @param endpoint - The API endpoint
     * @param duration - Duration of the call in milliseconds
     * @param success - Whether the call was successful
     */
    static recordApiCall(endpoint, duration, success) {
        if (!metricsStore.apiCalls.has(endpoint)) {
            metricsStore.apiCalls.set(endpoint, {
                count: 0,
                totalDuration: 0,
                errors: 0
            });
        }
        const stats = metricsStore.apiCalls.get(endpoint);
        stats.count++;
        stats.totalDuration += duration;
        if (!success) {
            stats.errors++;
        }
    }
    /**
     * Record ML processing for monitoring
     * @param functionName - The ML function name
     * @param duration - Duration of the processing in milliseconds
     * @param success - Whether the processing was successful
     */
    static recordMLProcessing(functionName, duration, success) {
        if (!metricsStore.mlProcessing.has(functionName)) {
            metricsStore.mlProcessing.set(functionName, {
                count: 0,
                totalDuration: 0,
                errors: 0
            });
        }
        const stats = metricsStore.mlProcessing.get(functionName);
        stats.count++;
        stats.totalDuration += duration;
        if (!success) {
            stats.errors++;
        }
    }
    /**
     * Get all monitoring metrics
     */
    static getMetrics() {
        const apiMetrics = {};
        for (const [endpoint, stats] of metricsStore.apiCalls.entries()) {
            apiMetrics[endpoint] = {
                ...stats,
                averageDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
                successRate: stats.count > 0 ? ((stats.count - stats.errors) / stats.count) * 100 : 100
            };
        }
        const mlMetrics = {};
        for (const [functionName, stats] of metricsStore.mlProcessing.entries()) {
            mlMetrics[functionName] = {
                ...stats,
                averageDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
                successRate: stats.count > 0 ? ((stats.count - stats.errors) / stats.count) * 100 : 100
            };
        }
        return {
            apiMetrics,
            mlMetrics,
            system: {
                memory: metricsStore.system.memory,
                uptime: metricsStore.system.uptime
            },
            lastUpdated: metricsStore.lastUpdated
        };
    }
    /**
     * Get monitoring dashboard data
     */
    static async getDashboardData(req, res, next) {
        try {
            const metrics = MonitoringController.getMetrics();
            // Prepare data for visualization
            const apiEndpoints = Object.keys(metrics.apiMetrics);
            const mlFunctions = Object.keys(metrics.mlMetrics);
            // Calculate averages
            const avgApiResponseTime = apiEndpoints.length > 0
                ? apiEndpoints.reduce((sum, endpoint) => sum + metrics.apiMetrics[endpoint].averageDuration, 0) / apiEndpoints.length
                : 0;
            const avgMLProcessingTime = mlFunctions.length > 0
                ? mlFunctions.reduce((sum, func) => sum + metrics.mlMetrics[func].averageDuration, 0) / mlFunctions.length
                : 0;
            const totalApiCalls = apiEndpoints.length > 0
                ? apiEndpoints.reduce((sum, endpoint) => sum + metrics.apiMetrics[endpoint].count, 0)
                : 0;
            const totalMLProcesses = mlFunctions.length > 0
                ? mlFunctions.reduce((sum, func) => sum + metrics.mlMetrics[func].count, 0)
                : 0;
            const apiSuccessRate = totalApiCalls > 0
                ? apiEndpoints.reduce((sum, endpoint) => sum + (metrics.apiMetrics[endpoint].successRate * metrics.apiMetrics[endpoint].count), 0) / totalApiCalls
                : 100;
            const mlSuccessRate = totalMLProcesses > 0
                ? mlFunctions.reduce((sum, func) => sum + (metrics.mlMetrics[func].successRate * metrics.mlMetrics[func].count), 0) / totalMLProcesses
                : 100;
            res.json({
                success: true,
                data: {
                    metrics,
                    summary: {
                        avgApiResponseTime: parseFloat(avgApiResponseTime.toFixed(2)),
                        avgMLProcessingTime: parseFloat(avgMLProcessingTime.toFixed(2)),
                        totalApiCalls,
                        totalMLProcesses,
                        apiSuccessRate: parseFloat(apiSuccessRate.toFixed(2)),
                        mlSuccessRate: parseFloat(mlSuccessRate.toFixed(2))
                    },
                    alerts: MonitoringController.generateAlerts(metrics)
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate alerts based on metrics
     * @param metrics - The current metrics
     */
    static generateAlerts(metrics) {
        const alerts = [];
        // Check for high error rates in API calls
        for (const [endpoint, stats] of Object.entries(metrics.apiMetrics)) {
            if (stats.count > 10 && stats.successRate < 90) {
                alerts.push({
                    type: 'warning',
                    message: `Hohe Fehlerquote bei API-Endpoint ${endpoint}: ${stats.successRate.toFixed(2)}%`,
                    severity: 'medium'
                });
            }
        }
        // Check for high error rates in ML processing
        for (const [functionName, stats] of Object.entries(metrics.mlMetrics)) {
            if (stats.count > 5 && stats.successRate < 95) {
                alerts.push({
                    type: 'warning',
                    message: `Hohe Fehlerquote bei ML-Funktion ${functionName}: ${stats.successRate.toFixed(2)}%`,
                    severity: 'medium'
                });
            }
        }
        // Check for slow API responses
        for (const [endpoint, stats] of Object.entries(metrics.apiMetrics)) {
            if (stats.averageDuration > 5000) { // More than 5 seconds
                alerts.push({
                    type: 'warning',
                    message: `Langsame API-Antwort bei ${endpoint}: ${stats.averageDuration.toFixed(2)}ms`,
                    severity: 'medium'
                });
            }
        }
        // Check for slow ML processing
        for (const [functionName, stats] of Object.entries(metrics.mlMetrics)) {
            if (stats.averageDuration > 30000) { // More than 30 seconds
                alerts.push({
                    type: 'warning',
                    message: `Langsame ML-Verarbeitung bei ${functionName}: ${stats.averageDuration.toFixed(2)}ms`,
                    severity: 'high'
                });
            }
        }
        // Check memory usage
        const memoryUsage = metrics.system.memory.heapUsed / 1024 / 1024; // Convert to MB
        if (memoryUsage > 500) { // More than 500 MB
            alerts.push({
                type: 'warning',
                message: `Hohe Speichernutzung: ${memoryUsage.toFixed(2)} MB`,
                severity: 'high'
            });
        }
        return alerts;
    }
    /**
     * Reset all metrics
     */
    static resetMetrics(req, res, next) {
        try {
            metricsStore.apiCalls.clear();
            metricsStore.mlProcessing.clear();
            res.json({
                success: true,
                message: 'Metriken erfolgreich zurückgesetzt'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = MonitoringController;
