/**
 * Coverage Monitoring and Reporting Index
 * 
 * This module exports all coverage monitoring and reporting utilities.
 */

export { coverageReporter } from './coverage-reporter';
export { coverageMonitor } from './coverage-monitor';

// Export types
export type { CoverageReport, ServiceCoverage, CoverageThresholds } from './coverage-reporter';
export type { CoverageAlert } from './coverage-monitor';