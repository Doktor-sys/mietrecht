#!/usr/bin/env node

/**
 * Performance Monitoring CLI Tool
 * Command-line interface for monitoring and reporting on Mietrecht Agent performance.
 */

// Import required modules
const { PerformanceMonitor } = require('./advancedMonitor.js');
const { PerformanceReportGenerator } = require('./reportGenerator.js');
const { PerformanceAlerting } = require('./alerting.js');

// CLI command processor
async function processCommand(args) {
  const command = args[0];
  
  switch (command) {
    case 'monitor':
      await runMonitor(args.slice(1));
      break;
    case 'report':
      await generateReport(args.slice(1));
      break;
    case 'alert':
      await checkAlerts(args.slice(1));
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Run continuous monitoring
 */
async function runMonitor(args) {
  console.log('Starting performance monitoring...');
  
  // Parse options
  const options = parseOptions(args);
  
  // Create monitor instance
  const monitor = new PerformanceMonitor(options);
  
  // Start monitoring
  await monitor.startMonitoring();
  
  console.log(`Monitoring started with interval ${options.interval}ms`);
  console.log('Press Ctrl+C to stop');
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nStopping monitoring...');
    await monitor.stopMonitoring();
    process.exit(0);
  });
}

/**
 * Generate performance report
 */
async function generateReport(args) {
  console.log('Generating performance report...');
  
  // Parse options
  const options = parseOptions(args);
  
  // Create report generator
  const reportGenerator = new PerformanceReportGenerator();
  
  try {
    // Generate report
    const report = await reportGenerator.generateComprehensiveReport();
    
    // Output format
    if (options.format === 'html') {
      // Generate HTML report
      const html = await reportGenerator.generateHtmlReport(report);
      
      // Save to file
      const filePath = await reportGenerator.saveHtmlReportToFile(html, options.output);
      console.log(`HTML report saved to: ${filePath}`);
    } else {
      // Save JSON report
      const filePath = await reportGenerator.saveReportToFile(report, options.output);
      console.log(`JSON report saved to: ${filePath}`);
      
      // Also display summary to console
      if (!options.quiet) {
        displayReportSummary(report);
      }
    }
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

/**
 * Check for performance alerts
 */
async function checkAlerts(args) {
  console.log('Checking for performance alerts...');
  
  // Parse options
  const options = parseOptions(args);
  
  // Create monitor and alerting instances
  const monitor = new PerformanceMonitor();
  const alerting = new PerformanceAlerting(options.alerting || {});
  
  try {
    // Collect metrics
    const metrics = await monitor.getMetricsCollector().collectAllMetrics();
    
    // Check for alerts
    const alerts = await alerting.checkAndAlert(metrics);
    
    if (alerts.length > 0) {
      console.log(`\n${alerts.length} alert(s) triggered:`);
      alerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
      });
    } else {
      console.log('No performance alerts detected.');
    }
    
    // Show alert history if requested
    if (options.history) {
      const history = alerting.getAlertHistory(options.historyLimit || 10);
      if (history.length > 0) {
        console.log('\nRecent alert history:');
        history.forEach((alert, index) => {
          console.log(`${index + 1}. [${alert.timestamp}] ${alert.type}: ${alert.message}`);
        });
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
    process.exit(1);
  }
}

/**
 * Parse command line options
 * @param {Array} args - Command line arguments
 * @returns {Object} Parsed options
 */
function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--interval':
      case '-i':
        options.interval = parseInt(args[++i]);
        break;
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--quiet':
      case '-q':
        options.quiet = true;
        break;
      case '--history':
        options.history = true;
        break;
      case '--history-limit':
        options.historyLimit = parseInt(args[++i]);
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      default:
        // Ignore unknown options for now
        break;
    }
  }
  
  return options;
}

/**
 * Display report summary to console
 * @param {Object} report - Report data
 */
function displayReportSummary(report) {
  console.log('\n=== PERFORMANCE REPORT SUMMARY ===');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Overall Health: ${report.summary.overallHealth}`);
  
  console.log('\nKey Metrics:');
  if (report.summary.keyMetrics.cacheHitRate !== null) {
    console.log(`  Cache Hit Rate: ${(report.summary.keyMetrics.cacheHitRate * 100).toFixed(2)}%`);
  }
  if (report.summary.keyMetrics.avgDatabaseQueryTime !== null) {
    console.log(`  Avg Database Query Time: ${report.summary.keyMetrics.avgDatabaseQueryTime.toFixed(2)}ms`);
  }
  if (report.summary.keyMetrics.avgApiResponseTime !== null) {
    console.log(`  Avg API Response Time: ${report.summary.keyMetrics.avgApiResponseTime.toFixed(2)}ms`);
  }
  console.log(`  Memory Usage: ${(report.summary.keyMetrics.memoryUsage * 100).toFixed(2)}%`);
  
  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
    
    if (report.recommendations.length > 3) {
      console.log(`  ... and ${report.recommendations.length - 3} more`);
    }
  }
  
  console.log('\nFor detailed report, use --format html option');
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Mietrecht Agent Performance Monitoring Tool
=========================================

Usage: node perfmon.js <command> [options]

Commands:
  monitor    Run continuous performance monitoring
  report     Generate performance report
  alert      Check for performance alerts
  help       Show this help information

Options for monitor:
  -i, --interval <ms>    Monitoring interval in milliseconds (default: 60000)

Options for report:
  -f, --format <format>  Output format: json, html (default: json)
  -o, --output <file>    Output filename
  -q, --quiet            Suppress console output

Options for alert:
  --history              Show alert history
  --history-limit <num>  Number of history entries to show (default: 10)
  -c, --config <file>    Configuration file for alerting thresholds

Examples:
  node perfmon.js report
  node perfmon.js report -f html -o perf-report.html
  node perfmon.js alert --history
  node perfmon.js monitor -i 30000
`);
}

// Run the CLI tool
if (require.main === module) {
  processCommand(process.argv.slice(2)).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = { processCommand };
