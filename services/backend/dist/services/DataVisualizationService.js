"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataVisualizationService = void 0;
const logger_1 = require("../utils/logger");
class DataVisualizationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generates a time series chart for legal trends
     */
    async generateLegalTrendChart(trends, config) {
        try {
            // Prepare time series data for trend analysis
            const labels = trends.trends.map(trend => trend.title.substring(0, 20) + (trend.title.length > 20 ? '...' : ''));
            const relevanceScores = trends.trends.map(trend => trend.relevanceScore);
            const confidenceScores = trends.trends.map(trend => trend.confidence * 100);
            const data = {
                labels,
                datasets: [
                    {
                        label: 'Relevance Score',
                        data: relevanceScores,
                        borderColor: '#4e79a7',
                        backgroundColor: 'rgba(78, 121, 167, 0.2)',
                        fill: false
                    },
                    {
                        label: 'Confidence Score',
                        data: confidenceScores,
                        borderColor: '#f28e2b',
                        backgroundColor: 'rgba(242, 142, 43, 0.2)',
                        fill: false
                    }
                ]
            };
            return {
                id: `viz_${Date.now()}_trends`,
                type: 'trendLine',
                title: 'Legal Trend Analysis',
                data,
                config,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating legal trend chart:', error);
            throw new Error('Failed to generate legal trend chart');
        }
    }
    /**
     * Generates a pie chart for usage metrics
     */
    async generateUsagePieChart(analytics, config) {
        try {
            // Prepare pie chart data for usage metrics
            const labels = [
                'Document Analyses',
                'Chat Interactions',
                'Template Generations',
                'Bulk Jobs'
            ];
            const data = [
                analytics.metrics.documentAnalyses,
                analytics.metrics.chatInteractions,
                analytics.metrics.templateGenerations,
                analytics.metrics.bulkJobs
            ];
            const backgroundColors = [
                '#4e79a7',
                '#f28e2b',
                '#e15759',
                '#76b7b2'
            ];
            const pieData = {
                labels,
                data,
                backgroundColors
            };
            return {
                id: `viz_${Date.now()}_usage`,
                type: 'usagePie',
                title: 'Service Usage Distribution',
                data: pieData,
                config,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating usage pie chart:', error);
            throw new Error('Failed to generate usage pie chart');
        }
    }
    /**
     * Generates a heatmap for compliance data
     */
    async generateComplianceHeatmap(complianceData, // ComplianceMonitoringReport would be the actual type
    config) {
        try {
            // Prepare heatmap data for compliance metrics
            // This is a simplified example - in reality, this would be more complex
            const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const yLabels = ['Data Protection', 'Access Control', 'Audit Trail', 'Encryption'];
            // Generate sample data matrix
            const data = [];
            for (let i = 0; i < yLabels.length; i++) {
                const row = [];
                for (let j = 0; j < xLabels.length; j++) {
                    // Generate random compliance scores between 70-100
                    row.push(Math.floor(Math.random() * 30) + 70);
                }
                data.push(row);
            }
            const heatmapData = {
                xLabels,
                yLabels,
                data
            };
            return {
                id: `viz_${Date.now()}_compliance`,
                type: 'heatmap',
                title: 'Compliance Score Heatmap',
                data: heatmapData,
                config,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating compliance heatmap:', error);
            throw new Error('Failed to generate compliance heatmap');
        }
    }
    /**
     * Generates a bar chart for performance metrics
     */
    async generatePerformanceBarChart(analytics, config) {
        try {
            // Prepare bar chart data for performance metrics
            const labels = [
                'Avg Response Time (ms)',
                'Error Rate (%)',
                'Success Rate (%)'
            ];
            const data = [
                Math.round(analytics.metrics.responseTimeStats.average),
                Math.round(analytics.metrics.errorRate * 100),
                Math.round((1 - analytics.metrics.errorRate) * 100)
            ];
            const backgroundColors = [
                '#4e79a7',
                '#e15759',
                '#59a14f'
            ];
            const barData = {
                labels,
                data,
                backgroundColors
            };
            return {
                id: `viz_${Date.now()}_performance`,
                type: 'barChart',
                title: 'Performance Metrics',
                data: barData,
                config,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating performance bar chart:', error);
            throw new Error('Failed to generate performance bar chart');
        }
    }
    /**
     * Generates a scatter plot for correlation analysis
     */
    async generateScatterPlot(analytics, config) {
        try {
            // Prepare scatter plot data showing correlation between usage and performance
            const dataPoints = [];
            // Generate data points based on analytics data
            // X-axis: document analyses, Y-axis: average confidence
            dataPoints.push({
                x: analytics.metrics.documentAnalyses,
                y: analytics.metrics.averageConfidence * 100,
                label: 'Document Analysis Confidence'
            });
            // X-axis: chat interactions, Y-axis: satisfaction rate (placeholder)
            dataPoints.push({
                x: analytics.metrics.chatInteractions,
                y: 85, // Placeholder satisfaction rate
                label: 'Chat Satisfaction'
            });
            return {
                id: `viz_${Date.now()}_scatter`,
                type: 'scatterPlot',
                title: 'Usage vs Performance Correlation',
                data: dataPoints,
                config,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating scatter plot:', error);
            throw new Error('Failed to generate scatter plot');
        }
    }
    /**
     * Generates multiple visualizations based on configuration
     */
    async generateDashboardVisualizations(config) {
        try {
            const visualizations = [];
            // In a real implementation, we would fetch actual data based on config
            // For now, we'll return placeholder visualizations
            switch (config.visualizationType) {
                case 'trendLine':
                    // Generate trend line visualization
                    visualizations.push(await this.generateSampleTrendLine(config));
                    break;
                case 'usagePie':
                    // Generate usage pie chart
                    visualizations.push(await this.generateSamplePieChart(config));
                    break;
                case 'heatmap':
                    // Generate heatmap
                    visualizations.push(await this.generateSampleHeatmap(config));
                    break;
                case 'barChart':
                    // Generate bar chart
                    visualizations.push(await this.generateSampleBarChart(config));
                    break;
                case 'scatterPlot':
                    // Generate scatter plot
                    visualizations.push(await this.generateSampleScatterPlot(config));
                    break;
                default:
                    throw new Error(`Unsupported visualization type: ${config.visualizationType}`);
            }
            return visualizations;
        }
        catch (error) {
            logger_1.logger.error('Error generating dashboard visualizations:', error);
            throw new Error('Failed to generate dashboard visualizations');
        }
    }
    /**
     * Private helper methods for sample visualizations
     */
    async generateSampleTrendLine(config) {
        // Sample trend line data
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = [65, 78, 70, 82, 75, 88];
        const timeSeriesData = {
            labels,
            datasets: [{
                    label: 'Legal Trends',
                    data,
                    borderColor: '#4e79a7',
                    backgroundColor: 'rgba(78, 121, 167, 0.2)',
                    fill: false
                }]
        };
        return {
            id: `viz_${Date.now()}_sample_trend`,
            type: 'trendLine',
            title: 'Sample Trend Analysis',
            data: timeSeriesData,
            config,
            generatedAt: new Date()
        };
    }
    async generateSamplePieChart(config) {
        // Sample pie chart data
        const pieData = {
            labels: ['Documents', 'Chats', 'Templates', 'Bulk Jobs'],
            data: [45, 30, 15, 10],
            backgroundColors: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2']
        };
        return {
            id: `viz_${Date.now()}_sample_pie`,
            type: 'usagePie',
            title: 'Sample Usage Distribution',
            data: pieData,
            config,
            generatedAt: new Date()
        };
    }
    async generateSampleHeatmap(config) {
        // Sample heatmap data
        const heatmapData = {
            xLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            yLabels: ['Compliance', 'Security', 'Performance'],
            data: [
                [90, 85, 95, 88, 92],
                [88, 92, 87, 90, 85],
                [95, 90, 93, 91, 89]
            ]
        };
        return {
            id: `viz_${Date.now()}_sample_heatmap`,
            type: 'heatmap',
            title: 'Sample Compliance Heatmap',
            data: heatmapData,
            config,
            generatedAt: new Date()
        };
    }
    async generateSampleBarChart(config) {
        // Sample bar chart data
        const barData = {
            labels: ['Response Time', 'Error Rate', 'Success Rate'],
            data: [1200, 2.5, 97.5],
            backgroundColors: ['#4e79a7', '#e15759', '#59a14f']
        };
        return {
            id: `viz_${Date.now()}_sample_bar`,
            type: 'barChart',
            title: 'Sample Performance Metrics',
            data: barData,
            config,
            generatedAt: new Date()
        };
    }
    async generateSampleScatterPlot(config) {
        // Sample scatter plot data
        const dataPoints = [
            { x: 100, y: 85, label: 'High Volume' },
            { x: 75, y: 90, label: 'Medium Volume' },
            { x: 50, y: 95, label: 'Low Volume' },
            { x: 120, y: 80, label: 'High Volume, Lower Quality' }
        ];
        return {
            id: `viz_${Date.now()}_sample_scatter`,
            type: 'scatterPlot',
            title: 'Sample Correlation Analysis',
            data: dataPoints,
            config,
            generatedAt: new Date()
        };
    }
}
exports.DataVisualizationService = DataVisualizationService;
