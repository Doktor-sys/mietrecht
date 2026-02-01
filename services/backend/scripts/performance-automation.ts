#!/usr/bin/env node

import { LoadTestRunner } from '../src/testing/load-testing/LoadTestRunner';
import { ContinuousPerformanceMonitor } from '../src/monitoring/ContinuousPerformanceMonitor';
import { Profiler } from '../src/profiling/Profiler';
import { logger } from '../src/utils/logger';

async function runPerformanceAutomation() {
  logger.info('Starting performance automation suite');
  
  try {
    // 1. Starte kontinuierliches Monitoring
    const monitor = ContinuousPerformanceMonitor.getInstance();
    monitor.startMonitoring(30000); // Alle 30 Sekunden
    logger.info('Continuous monitoring started');
    
    // 2. Starte Profiling
    const profiler = Profiler.getInstance();
    profiler.startContinuousProfiling(60000); // Jede Minute
    profiler.takeMemorySnapshot('initial');
    logger.info('Continuous profiling started');
    
    // 3. Führe Load Tests aus
    const loadTester = new LoadTestRunner();
    
    // Standard-Load-Test
    logger.info('Running standard load test');
    const loadTestConfig = {
      targetUrl: process.env.TEST_TARGET_URL || 'http://localhost:3000/api/health',
      concurrency: parseInt(process.env.TEST_CONCURRENCY || '10'),
      requestsPerSecond: parseInt(process.env.TEST_RPS || '20'),
      duration: parseInt(process.env.TEST_DURATION || '60'),
      method: 'GET' as const
    };
    
    const loadTestResult = await loadTester.runLoadTest(loadTestConfig);
    logger.info('Load test completed', loadTestResult);
    
    // 4. Führe Stresstest aus (wenn konfiguriert)
    if (process.env.RUN_STRESS_TEST === 'true') {
      logger.info('Running stress test');
      const stressTestResults = await loadTester.runStressTest(
        process.env.TEST_BASE_URL || 'http://localhost:3000',
        parseInt(process.env.TEST_MAX_CONCURRENCY || '100'),
        parseInt(process.env.TEST_STEP_SIZE || '10')
      );
      logger.info('Stress test completed', { testCount: stressTestResults.length });
    }
    
    // 5. Generiere Berichte
    logger.info('Generating performance reports');
    const report = loadTester.generateReport();
    console.log('\n=== Performance Automation Report ===');
    console.log(report);
    
    // 6. Speichere Berichte in Datei
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `performance-report-${Date.now()}.txt`);
    fs.writeFileSync(reportPath, report);
    logger.info(`Report saved to ${reportPath}`);
    
    // 7. Beende Monitoring und Profiling
    monitor.stopMonitoring();
    profiler.stopContinuousProfiling();
    
    logger.info('Performance automation suite completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Performance automation failed', error);
    process.exit(1);
  }
}

// Führe die Automatisierung aus, wenn das Skript direkt aufgerufen wird
if (require.main === module) {
  runPerformanceAutomation();
}

export default runPerformanceAutomation;