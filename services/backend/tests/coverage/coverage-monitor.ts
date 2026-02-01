/**
 * Coverage Monitor
 * 
 * This module monitors test coverage and provides alerts when coverage drops below thresholds.
 */

import { coverageReporter, CoverageReport, CoverageThresholds } from './coverage-reporter';
import * as fs from 'fs';
import * as path from 'path';

interface CoverageHistory {
    timestamp: string;
    report: CoverageReport;
}

interface CoverageAlert {
    type: 'coverage_drop' | 'threshold_breach';
    service: string;
    metric: string;
    previousValue: number;
    currentValue: number;
    threshold: number;
    timestamp: string;
}

class CoverageMonitor {
    private historyFile: string;
    private alertFile: string;
    private thresholds: CoverageThresholds;
    private history: CoverageHistory[] = [];

    constructor(
        historyFile: string = './coverage/history.json',
        alertFile: string = './coverage/alerts.json',
        thresholds: CoverageThresholds = { lines: 80, statements: 80, functions: 80, branches: 75 }
    ) {
        this.historyFile = historyFile;
        this.alertFile = alertFile;
        this.thresholds = thresholds;
        
        // Load history if it exists
        this.loadHistory();
    }

    /**
     * Monitor coverage and check for issues
     */
    async monitorCoverage(): Promise<{ report: CoverageReport; alerts: CoverageAlert[] }> {
        const report = await coverageReporter.generateReport();
        const alerts: CoverageAlert[] = [];

        // Check overall coverage thresholds
        const thresholdCheck = coverageReporter.checkCoverageThresholds(report);
        if (!thresholdCheck.passed) {
            thresholdCheck.failures.forEach(failure => {
                alerts.push({
                    type: 'threshold_breach',
                    service: 'overall',
                    metric: failure,
                    previousValue: 0,
                    currentValue: 0,
                    threshold: 0,
                    timestamp: new Date().toISOString()
                });
            });
        }

        // Compare with previous coverage if available
        if (this.history.length > 0) {
            const previousReport = this.history[this.history.length - 1].report;
            const coverageDrops = this.detectCoverageDrops(previousReport, report);
            alerts.push(...coverageDrops);
        }

        // Save current report to history
        this.history.push({
            timestamp: new Date().toISOString(),
            report
        });
        this.saveHistory();

        // Save alerts if any
        if (alerts.length > 0) {
            this.saveAlerts(alerts);
        }

        return { report, alerts };
    }

    /**
     * Detect coverage drops compared to previous report
     */
    private detectCoverageDrops(previous: CoverageReport, current: CoverageReport): CoverageAlert[] {
        const alerts: CoverageAlert[] = [];

        // Check overall coverage drops
        if (current.lines.pct < previous.lines.pct) {
            alerts.push({
                type: 'coverage_drop',
                service: 'overall',
                metric: 'lines',
                previousValue: previous.lines.pct,
                currentValue: current.lines.pct,
                threshold: this.thresholds.lines,
                timestamp: new Date().toISOString()
            });
        }

        if (current.statements.pct < previous.statements.pct) {
            alerts.push({
                type: 'coverage_drop',
                service: 'overall',
                metric: 'statements',
                previousValue: previous.statements.pct,
                currentValue: current.statements.pct,
                threshold: this.thresholds.statements,
                timestamp: new Date().toISOString()
            });
        }

        if (current.functions.pct < previous.functions.pct) {
            alerts.push({
                type: 'coverage_drop',
                service: 'overall',
                metric: 'functions',
                previousValue: previous.functions.pct,
                currentValue: current.functions.pct,
                threshold: this.thresholds.functions,
                timestamp: new Date().toISOString()
            });
        }

        if (current.branches.pct < previous.branches.pct) {
            alerts.push({
                type: 'coverage_drop',
                service: 'overall',
                metric: 'branches',
                previousValue: previous.branches.pct,
                currentValue: current.branches.pct,
                threshold: this.thresholds.branches,
                timestamp: new Date().toISOString()
            });
        }

        // Check service-level coverage drops
        Object.keys(current.services).forEach(serviceName => {
            const currentService = current.services[serviceName];
            const previousService = previous.services[serviceName];
            
            if (previousService) {
                if (currentService.lines.pct < previousService.lines.pct) {
                    alerts.push({
                        type: 'coverage_drop',
                        service: serviceName,
                        metric: 'lines',
                        previousValue: previousService.lines.pct,
                        currentValue: currentService.lines.pct,
                        threshold: this.thresholds.lines,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Similar checks for statements, functions, branches...
            }
        });

        return alerts;
    }

    /**
     * Load coverage history from file
     */
    private loadHistory(): void {
        try {
            if (fs.existsSync(this.historyFile)) {
                const historyData = fs.readFileSync(this.historyFile, 'utf-8');
                this.history = JSON.parse(historyData);
            }
        } catch (error) {
            console.warn('Could not load coverage history:', error);
        }
    }

    /**
     * Save coverage history to file
     */
    private saveHistory(): void {
        try {
            // Keep only last 30 days of history
            if (this.history.length > 30) {
                this.history = this.history.slice(-30);
            }
            
            fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.warn('Could not save coverage history:', error);
        }
    }

    /**
     * Save alerts to file
     */
    private saveAlerts(alerts: CoverageAlert[]): void {
        try {
            const alertData = fs.existsSync(this.alertFile) 
                ? JSON.parse(fs.readFileSync(this.alertFile, 'utf-8'))
                : [];
            
            const updatedAlerts = [...alertData, ...alerts];
            
            // Keep only last 100 alerts
            if (updatedAlerts.length > 100) {
                updatedAlerts.splice(0, updatedAlerts.length - 100);
            }
            
            fs.writeFileSync(this.alertFile, JSON.stringify(updatedAlerts, null, 2));
        } catch (error) {
            console.warn('Could not save coverage alerts:', error);
        }
    }

    /**
     * Get coverage trend over time
     */
    getCoverageTrend(days: number = 7): CoverageHistory[] {
        if (this.history.length === 0) {
            return [];
        }
        
        // Get entries from the last N days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.history.filter(entry => 
            new Date(entry.timestamp) >= cutoffDate
        );
    }

    /**
     * Generate coverage trend report
     */
    async generateTrendReport(days: number = 7): Promise<string> {
        const trend = this.getCoverageTrend(days);
        
        if (trend.length === 0) {
            return 'No coverage history available';
        }
        
        let report = `Coverage Trend Report (Last ${days} Days)\n`;
        report += '='.repeat(50) + '\n\n';
        
        trend.forEach(entry => {
            report += `${entry.timestamp}\n`;
            report += `  Lines: ${entry.report.lines.pct}%\n`;
            report += `  Statements: ${entry.report.statements.pct}%\n`;
            report += `  Functions: ${entry.report.functions.pct}%\n`;
            report += `  Branches: ${entry.report.branches.pct}%\n\n`;
        });
        
        return report;
    }
}

// Export singleton instance
export const coverageMonitor = new CoverageMonitor();

// Export types
export type { CoverageAlert };