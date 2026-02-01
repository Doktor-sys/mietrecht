"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class PdfGenerator {
    static async generateReport(report) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `SmartLaw Report - ${report.organizationId}`,
                        Author: 'SmartLaw Mietrecht KI-Assistent',
                        Subject: 'Comprehensive Business Report',
                        Keywords: 'report, analytics, business, smartlaw'
                    }
                });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                // Add cover page
                this.generateCoverPage(doc, report);
                doc.addPage();
                this.generateHeader(doc, report);
                this.generateSummarySection(doc, report);
                this.generatePerformanceSection(doc, report);
                this.generateUsageSection(doc, report);
                // Add more detailed content
                this.generateDetailedContent(doc, report);
                this.generateFooter(doc);
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static generateCoverPage(doc, report) {
        // Center content on the page
        const pageCenter = doc.page.width / 2;
        const pageMiddle = doc.page.height / 2;
        // Add logo or company name
        doc
            .fillColor(this.COLORS.PRIMARY)
            .fontSize(48)
            .text('SmartLaw', pageCenter, pageMiddle - 100, { align: 'center' })
            .fontSize(24)
            .text('Mietrecht KI-Assistent', pageCenter, pageMiddle - 50, { align: 'center' });
        // Report title
        doc
            .fontSize(36)
            .text('Comprehensive Report', pageCenter, pageMiddle + 20, { align: 'center' });
        // Organization info
        doc
            .fontSize(16)
            .fillColor(this.COLORS.TEXT)
            .text(`Organization: ${report.organizationId}`, pageCenter, pageMiddle + 80, { align: 'center' })
            .text(`Period: ${report.period.duration}`, pageCenter, pageMiddle + 110, { align: 'center' })
            .text(`Generated: ${report.generatedAt.toLocaleDateString()}`, pageCenter, pageMiddle + 140, { align: 'center' });
        // Add decorative elements
        doc
            .strokeColor(this.COLORS.SECONDARY)
            .lineWidth(2)
            .moveTo(pageCenter - 100, pageMiddle + 180)
            .lineTo(pageCenter + 100, pageMiddle + 180)
            .stroke();
    }
    static generateHeader(doc, report) {
        doc
            .fillColor(this.COLORS.PRIMARY)
            .fontSize(24)
            .text('SmartLaw', { align: 'left' })
            .fontSize(10)
            .text('Mietrecht KI-Assistent', { align: 'left' });
        doc.moveDown();
        doc
            .fillColor(this.COLORS.TEXT)
            .fontSize(20)
            .text('Comprehensive Report', { align: 'center' });
        doc.moveDown();
        const rightX = 400;
        const topY = 50;
        doc
            .fontSize(10)
            .fillColor(this.COLORS.LIGHT_TEXT)
            .text(`Generated: ${report.generatedAt.toLocaleDateString()}`, rightX, topY, { align: 'right' })
            .text(`Org ID: ${report.organizationId}`, rightX, topY + 15, { align: 'right' })
            .text(`Period: ${report.period.duration}`, rightX, topY + 30, { align: 'right' });
        this.drawHorizontalLine(doc, doc.y + 10);
        doc.moveDown(2);
    }
    static generateSummarySection(doc, report) {
        this.drawSectionHeader(doc, 'Executive Summary');
        const summaryData = [
            ['Metric', 'Value'],
            ['Total API Calls', report.summary.totalApiCalls.toString()],
            ['Total Documents', report.summary.totalDocuments.toString()],
            ['Total Chat Interactions', report.summary.totalChatInteractions.toString()],
            ['Success Rate', `${report.summary.successRate}%`],
            ['Total Cost', `€${report.summary.costSummary.totalCost.toFixed(2)}`],
        ];
        this.drawTable(doc, summaryData, [200, 100]);
        doc.moveDown(2);
        // Add a simple bar chart for usage distribution
        this.drawUsageChart(doc, report);
        doc.moveDown(2);
    }
    static drawUsageChart(doc, report) {
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Service Usage Distribution', { underline: true });
        doc.moveDown(1);
        const services = report.usage.byService;
        const maxCount = Math.max(...services.map(s => s.count), 1);
        const chartWidth = 300;
        const chartHeight = 20;
        const barHeight = 15;
        const spacing = 5;
        services.forEach((service, index) => {
            const barWidth = (service.count / maxCount) * chartWidth;
            const yPosition = doc.y + (index * (barHeight + spacing));
            // Draw bar
            doc
                .fillColor(this.COLORS.SECONDARY)
                .rect(100, yPosition, barWidth, barHeight)
                .fill();
            // Draw label
            doc
                .fillColor(this.COLORS.TEXT)
                .fontSize(10)
                .text(`${service.service}: ${service.count} (${service.percentage}%)`, 100 + chartWidth + 10, yPosition + 3);
        });
        doc.y += services.length * (barHeight + spacing) + 10;
    }
    static generatePerformanceSection(doc, report) {
        this.drawSectionHeader(doc, 'Performance Metrics');
        const perfData = [
            ['Metric', 'Value'],
            ['Uptime', `${report.performance.reliability.uptime}%`],
            ['Avg Response Time', `${report.summary.averageResponseTime} ms`],
            ['Error Rate', `${report.performance.reliability.errorRate}%`],
            ['Resource Utilization', `${report.performance.efficiency.resourceUtilization}%`],
        ];
        this.drawTable(doc, perfData, [200, 100]);
        doc.moveDown(2);
    }
    static generateUsageSection(doc, report) {
        this.drawSectionHeader(doc, 'Usage Breakdown');
        doc.fontSize(12).fillColor(this.COLORS.TEXT).text('By Service', { underline: true });
        doc.moveDown(0.5);
        const serviceData = [['Service', 'Count', 'Percentage']];
        report.usage.byService.forEach((s) => {
            serviceData.push([s.service, s.count.toString(), `${s.percentage}%`]);
        });
        this.drawTable(doc, serviceData, [200, 100, 100]);
        doc.moveDown(2);
    }
    static generateComplianceSection(doc, report) {
        this.drawSectionHeader(doc, 'Compliance Status');
        // Data Retention
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Data Retention', { underline: true });
        doc.moveDown(0.5);
        const retentionData = [
            ['Metric', 'Value'],
            ['Documents Stored', report.compliance.dataRetention.documentsStored.toString()],
            ['Retention Policy', report.compliance.dataRetention.retentionPolicy],
            ['Oldest Document', report.compliance.dataRetention.oldestDocument.toLocaleDateString()]
        ];
        this.drawTable(doc, retentionData, [150, 200]);
        doc.moveDown(1);
        // Privacy
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Privacy', { underline: true });
        doc.moveDown(0.5);
        const privacyData = [
            ['Metric', 'Value'],
            ['Data Processing Consent', report.compliance.privacy.dataProcessingConsent ? 'Yes' : 'No'],
            ['Data Export Requests', report.compliance.privacy.dataExportRequests.toString()],
            ['Data Deletion Requests', report.compliance.privacy.dataDeletionRequests.toString()]
        ];
        this.drawTable(doc, privacyData, [200, 150]);
        doc.moveDown(1);
        // Security
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Security', { underline: true });
        doc.moveDown(0.5);
        const securityData = [
            ['Metric', 'Value'],
            ['Encryption Status', report.compliance.security.encryptionStatus],
            ['Access Logs', report.compliance.security.accessLogs.toString()],
            ['Security Incidents', report.compliance.security.securityIncidents.toString()]
        ];
        this.drawTable(doc, securityData, [150, 200]);
        doc.moveDown(2);
    }
    static generateRecommendationsSection(doc, report) {
        if (report.recommendations.length === 0)
            return;
        this.drawSectionHeader(doc, 'Recommendations');
        report.recommendations.forEach((rec) => {
            doc
                .fontSize(12)
                .fillColor(this.COLORS.PRIMARY)
                .text(`[${rec.priority.toUpperCase()}] ${rec.title}`);
            doc
                .fontSize(10)
                .fillColor(this.COLORS.TEXT)
                .text(rec.description)
                .fillColor(this.COLORS.SECONDARY)
                .text(`Impact: ${rec.estimatedImpact}`);
            doc.moveDown(1);
        });
    }
    static generateDetailedContent(doc, report) {
        // Add compliance section
        this.drawSectionHeader(doc, 'Compliance Status');
        // Data Retention
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Data Retention', { underline: true });
        doc.moveDown(0.5);
        const retentionData = [
            ['Metric', 'Value'],
            ['Documents Stored', report.compliance.dataRetention.documentsStored.toString()],
            ['Retention Policy', report.compliance.dataRetention.retentionPolicy],
            ['Oldest Document', report.compliance.dataRetention.oldestDocument.toLocaleDateString()]
        ];
        this.drawTable(doc, retentionData, [150, 200]);
        doc.moveDown(1);
        // Privacy
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Privacy', { underline: true });
        doc.moveDown(0.5);
        const privacyData = [
            ['Metric', 'Value'],
            ['Data Processing Consent', report.compliance.privacy.dataProcessingConsent ? 'Yes' : 'No'],
            ['Data Export Requests', report.compliance.privacy.dataExportRequests.toString()],
            ['Data Deletion Requests', report.compliance.privacy.dataDeletionRequests.toString()]
        ];
        this.drawTable(doc, privacyData, [200, 150]);
        doc.moveDown(1);
        // Security
        doc
            .fontSize(12)
            .fillColor(this.COLORS.TEXT)
            .text('Security', { underline: true });
        doc.moveDown(0.5);
        const securityData = [
            ['Metric', 'Value'],
            ['Encryption Status', report.compliance.security.encryptionStatus],
            ['Access Logs', report.compliance.security.accessLogs.toString()],
            ['Security Incidents', report.compliance.security.securityIncidents.toString()]
        ];
        this.drawTable(doc, securityData, [150, 200]);
        doc.moveDown(2);
        // Add recommendations if any
        if (report.recommendations.length > 0) {
            this.drawSectionHeader(doc, 'Recommendations');
            report.recommendations.forEach((rec) => {
                doc
                    .fontSize(12)
                    .fillColor(this.COLORS.PRIMARY)
                    .text(`[${rec.priority.toUpperCase()}] ${rec.title}`);
                doc
                    .fontSize(10)
                    .fillColor(this.COLORS.TEXT)
                    .text(rec.description)
                    .fillColor(this.COLORS.SECONDARY)
                    .text(`Impact: ${rec.estimatedImpact}`);
                doc.moveDown(1);
            });
        }
        // Add alerts if any
        if (report.alerts.length > 0) {
            this.drawSectionHeader(doc, 'System Alerts');
            report.alerts.forEach((alert) => {
                // Set color based on alert type
                let alertColor = this.COLORS.TEXT;
                if (alert.type === 'warning') {
                    alertColor = this.COLORS.WARNING;
                }
                else if (alert.type === 'error') {
                    alertColor = this.COLORS.ERROR;
                }
                else {
                    alertColor = this.COLORS.SUCCESS;
                }
                doc
                    .fontSize(12)
                    .fillColor(alertColor)
                    .text(`[${alert.type.toUpperCase()}] ${alert.message}`);
                doc
                    .fontSize(10)
                    .fillColor(this.COLORS.LIGHT_TEXT)
                    .text(`Timestamp: ${alert.timestamp.toLocaleString()}`);
                doc.moveDown(1);
            });
        }
    }
    static generateFooter(doc) {
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc
                .fontSize(8)
                .fillColor(this.COLORS.LIGHT_TEXT)
                .text(`Page ${i + 1} of ${range.count} - Confidential - SmartLaw Mietrecht`, 50, doc.page.height - 50, { align: 'center' });
        }
    }
    // --- Helper Methods ---
    static drawSectionHeader(doc, title) {
        doc
            .fontSize(16)
            .fillColor(this.COLORS.PRIMARY)
            .text(title);
        this.drawHorizontalLine(doc, doc.y + 5);
        doc.moveDown(1);
    }
    static drawHorizontalLine(doc, y) {
        doc
            .strokeColor(this.COLORS.BORDER)
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
    static drawTable(doc, data, colWidths) {
        const startX = 50;
        let currentY = doc.y;
        const rowHeight = 20;
        data.forEach((row, rowIndex) => {
            let currentX = startX;
            // Draw background for header
            if (rowIndex === 0) {
                doc
                    .rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                    .fill(this.COLORS.SECONDARY);
                doc.fillColor('#FFFFFF'); // White text for header
            }
            else {
                doc.fillColor(this.COLORS.TEXT);
                // Draw border line below row
                doc
                    .moveTo(startX, currentY + rowHeight)
                    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), currentY + rowHeight)
                    .strokeColor(this.COLORS.BORDER)
                    .stroke();
            }
            row.forEach((cell, colIndex) => {
                doc
                    .fontSize(10)
                    .text(cell, currentX + 5, currentY + 5, {
                    width: colWidths[colIndex] - 10,
                    align: 'left',
                });
                currentX += colWidths[colIndex];
            });
            currentY += rowHeight;
        });
        doc.y = currentY; // Update cursor position
    }
}
exports.PdfGenerator = PdfGenerator;
PdfGenerator.COLORS = {
    PRIMARY: '#1a237e', // Dark Blue
    SECONDARY: '#536dfe', // Light Blue
    TEXT: '#212121', // Dark Grey
    LIGHT_TEXT: '#757575', // Light Grey
    BORDER: '#e0e0e0', // Light Grey for borders
    SUCCESS: '#4caf50', // Green
    WARNING: '#ff9800', // Orange
    ERROR: '#f44336', // Red
};
