#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoadTestRunner_1 = require("../LoadTestRunner");
const logger_1 = require("../../../utils/logger");
async function main() {
    const runner = new LoadTestRunner_1.LoadTestRunner();
    // Standard-Lasttest-Konfiguration
    const config = {
        targetUrl: process.env.TEST_TARGET_URL || 'http://localhost:3000/api/health',
        concurrency: parseInt(process.env.TEST_CONCURRENCY || '10'),
        requestsPerSecond: parseInt(process.env.TEST_RPS || '20'),
        duration: parseInt(process.env.TEST_DURATION || '60'), // 60 Sekunden
        method: 'GET'
    };
    logger_1.logger.info('Starting load test with configuration:', config);
    try {
        const result = await runner.runLoadTest(config);
        console.log('\n=== Load Test Results ===');
        console.log(`Total Requests: ${result.totalRequests}`);
        console.log(`Successful Requests: ${result.successfulRequests}`);
        console.log(`Failed Requests: ${result.failedRequests}`);
        console.log(`Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
        console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
        console.log(`Throughput: ${result.throughput.toFixed(2)} requests/second`);
        // Generiere und zeige den Bericht
        const report = runner.generateReport();
        console.log('\n' + report);
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Load test failed:', error);
        process.exit(1);
    }
}
// Führe den Test aus, wenn das Skript direkt aufgerufen wird
if (require.main === module) {
    main();
}
