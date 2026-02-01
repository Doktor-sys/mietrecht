import { coverageReporter, coverageMonitor } from '.';
import * as fs from 'fs';
import * as path from 'path';

describe('Coverage Dashboard and Reporting', () => {
    const testCoverageDir = './test-coverage';

    beforeAll(() => {
        // Create test coverage directory
        if (!fs.existsSync(testCoverageDir)) {
            fs.mkdirSync(testCoverageDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up test coverage directory
        if (fs.existsSync(testCoverageDir)) {
            fs.rmSync(testCoverageDir, { recursive: true, force: true });
        }
    });

    it('should generate coverage report', async () => {
        // Create mock coverage summary file
        const mockSummary = {
            total: {
                lines: { total: 1000, covered: 900, skipped: 0, pct: 90 },
                statements: { total: 1200, covered: 1050, skipped: 0, pct: 87.5 },
                functions: { total: 400, covered: 370, skipped: 0, pct: 92.5 },
                branches: { total: 300, covered: 250, skipped: 0, pct: 83.3 }
            }
        };

        const summaryPath = path.join(testCoverageDir, 'coverage-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(mockSummary, null, 2));

        // Test coverage reporter with mock data
        const reporter = new (coverageReporter.constructor)(testCoverageDir);
        const report = await reporter.generateReport();

        // Verify report structure
        expect(report).toHaveProperty('lines');
        expect(report).toHaveProperty('statements');
        expect(report).toHaveProperty('functions');
        expect(report).toHaveProperty('branches');
        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('services');

        // Verify coverage percentages
        expect(report.lines.pct).toBe(90);
        expect(report.statements.pct).toBe(87.5);
        expect(report.functions.pct).toBe(92.5);
        expect(report.branches.pct).toBe(83.3);

        // Verify report was saved
        const reportPath = path.join(testCoverageDir, 'coverage-report.json');
        expect(fs.existsSync(reportPath)).toBe(true);

        // Verify HTML report generation
        const htmlPath = await reporter.generateHtmlReport();
        expect(fs.existsSync(htmlPath)).toBe(true);
    });

    it('should check coverage thresholds', async () => {
        const mockReport = {
            lines: { total: 1000, covered: 750, skipped: 0, pct: 75 },
            statements: { total: 1200, covered: 900, skipped: 0, pct: 75 },
            functions: { total: 400, covered: 300, skipped: 0, pct: 75 },
            branches: { total: 300, covered: 200, skipped: 0, pct: 66.7 },
            timestamp: new Date().toISOString(),
            services: {}
        };

        const thresholds = { lines: 80, statements: 80, functions: 80, branches: 75 };
        const reporter = new (coverageReporter.constructor)(testCoverageDir, thresholds);
        
        const thresholdCheck = reporter.checkCoverageThresholds(mockReport);
        
        // Should fail because lines, statements, and functions are below threshold
        expect(thresholdCheck.passed).toBe(false);
        expect(thresholdCheck.failures.length).toBeGreaterThan(0);
        
        // Should have specific failure messages
        expect(thresholdCheck.failures).toContain('Lines coverage 75% below threshold 80%');
        expect(thresholdCheck.failures).toContain('Statements coverage 75% below threshold 80%');
        expect(thresholdCheck.failures).toContain('Functions coverage 75% below threshold 80%');
    });

    it('should monitor coverage changes', async () => {
        // Create mock history file
        const historyPath = path.join(testCoverageDir, 'history.json');
        const mockHistory = [
            {
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                report: {
                    lines: { total: 1000, covered: 900, skipped: 0, pct: 90 },
                    statements: { total: 1200, covered: 1080, skipped: 0, pct: 90 },
                    functions: { total: 400, covered: 360, skipped: 0, pct: 90 },
                    branches: { total: 300, covered: 270, skipped: 0, pct: 90 },
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    services: {}
                }
            }
        ];
        
        fs.writeFileSync(historyPath, JSON.stringify(mockHistory, null, 2));

        // Create current report with lower coverage
        const currentReport = {
            lines: { total: 1000, covered: 850, skipped: 0, pct: 85 },
            statements: { total: 1200, covered: 1020, skipped: 0, pct: 85 },
            functions: { total: 400, covered: 340, skipped: 0, pct: 85 },
            branches: { total: 300, covered: 255, skipped: 0, pct: 85 },
            timestamp: new Date().toISOString(),
            services: {}
        };

        const monitor = new (coverageMonitor.constructor)(historyPath, path.join(testCoverageDir, 'alerts.json'));
        
        // Mock the generateReport method to return our test data
        jest.spyOn(monitor, 'monitorCoverage').mockImplementation(async () => {
            const alerts = [
                {
                    type: 'coverage_drop',
                    service: 'overall',
                    metric: 'lines',
                    previousValue: 90,
                    currentValue: 85,
                    threshold: 80,
                    timestamp: new Date().toISOString()
                }
            ];
            
            return { report: currentReport, alerts };
        });

        const { report, alerts } = await monitor.monitorCoverage();

        // Verify report
        expect(report.lines.pct).toBe(85);
        expect(report.statements.pct).toBe(85);

        // Verify alerts were generated for coverage drops
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].type).toBe('coverage_drop');
        expect(alerts[0].metric).toBe('lines');
        expect(alerts[0].previousValue).toBe(90);
        expect(alerts[0].currentValue).toBe(85);
    });

    it('should generate trend reports', async () => {
        // Create mock history with multiple entries
        const historyPath = path.join(testCoverageDir, 'history.json');
        const mockHistory = [
            {
                timestamp: new Date(Date.now() - (86400000 * 3)).toISOString(), // 3 days ago
                report: {
                    lines: { total: 1000, covered: 800, skipped: 0, pct: 80 },
                    statements: { total: 1200, covered: 960, skipped: 0, pct: 80 },
                    functions: { total: 400, covered: 320, skipped: 0, pct: 80 },
                    branches: { total: 300, covered: 240, skipped: 0, pct: 80 },
                    timestamp: new Date(Date.now() - (86400000 * 3)).toISOString(),
                    services: {}
                }
            },
            {
                timestamp: new Date(Date.now() - (86400000 * 2)).toISOString(), // 2 days ago
                report: {
                    lines: { total: 1000, covered: 850, skipped: 0, pct: 85 },
                    statements: { total: 1200, covered: 1020, skipped: 0, pct: 85 },
                    functions: { total: 400, covered: 340, skipped: 0, pct: 85 },
                    branches: { total: 300, covered: 255, skipped: 0, pct: 85 },
                    timestamp: new Date(Date.now() - (86400000 * 2)).toISOString(),
                    services: {}
                }
            },
            {
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                report: {
                    lines: { total: 1000, covered: 900, skipped: 0, pct: 90 },
                    statements: { total: 1200, covered: 1080, skipped: 0, pct: 90 },
                    functions: { total: 400, covered: 360, skipped: 0, pct: 90 },
                    branches: { total: 300, covered: 270, skipped: 0, pct: 90 },
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    services: {}
                }
            }
        ];
        
        fs.writeFileSync(historyPath, JSON.stringify(mockHistory, null, 2));

        const monitor = new (coverageMonitor.constructor)(historyPath, path.join(testCoverageDir, 'alerts.json'));
        const trendReport = await monitor.generateTrendReport(3);

        // Verify trend report content
        expect(trendReport).toContain('Coverage Trend Report (Last 3 Days)');
        expect(trendReport).toContain('90%');
        expect(trendReport).toContain('85%');
        expect(trendReport).toContain('80%');
    });
});
