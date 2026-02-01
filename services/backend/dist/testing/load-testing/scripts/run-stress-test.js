#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoadTestRunner_1 = require("../LoadTestRunner");
const logger_1 = require("../../../utils/logger");
async function main() {
    const runner = new LoadTestRunner_1.LoadTestRunner();
    // Stresstest-Konfiguration
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    const maxConcurrency = parseInt(process.env.TEST_MAX_CONCURRENCY || '100');
    const stepSize = parseInt(process.env.TEST_STEP_SIZE || '10');
    logger_1.logger.info('Starting stress test with configuration:', {
        baseUrl,
        maxConcurrency,
        stepSize
    });
    try {
        const results = await runner.runStressTest(baseUrl, maxConcurrency, stepSize);
        console.log('\n=== Stress Test Results ===');
        results.forEach((result, index) => {
            console.log(`\n--- Test ${index + 1} ---`);
            console.log(`Concurrency: ${result.totalRequests / result.throughput}`);
            console.log(`Total Requests: ${result.totalRequests}`);
            console.log(`Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
            console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
            console.log(`Throughput: ${result.throughput.toFixed(2)} requests/second`);
        });
        // Finde den Punkt, an dem die Performance einbricht
        const breakingPoint = results.findIndex((result, index) => {
            if (index === 0)
                return false;
            const previousResult = results[index - 1];
            return result.errorRate > previousResult.errorRate + 0.1;
        });
        if (breakingPoint !== -1) {
            console.log(`\n=== Performance Breaking Point ===`);
            console.log(`Identified at concurrency level: ${results[breakingPoint].totalRequests / results[breakingPoint].throughput}`);
        }
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Stress test failed:', error);
        process.exit(1);
    }
}
// Führe den Test aus, wenn das Skript direkt aufgerufen wird
if (require.main === module) {
    main();
}
