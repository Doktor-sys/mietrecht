"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profiler = void 0;
const logger_1 = require("../utils/logger");
const PerformanceMonitor_1 = require("../services/PerformanceMonitor");
class Profiler {
    constructor() {
        this.isProfiling = false;
        this.profiles = new Map();
        this.memorySnapshots = [];
        this.profilingInterval = null;
        this.performanceMonitor = PerformanceMonitor_1.PerformanceMonitor.getInstance();
    }
    static getInstance() {
        if (!Profiler.instance) {
            Profiler.instance = new Profiler();
        }
        return Profiler.instance;
    }
    /**
     * Startet das Profiling
     */
    startProfiling(duration = 30000) {
        if (this.isProfiling) {
            logger_1.logger.warn('Profiling is already running');
            return;
        }
        this.isProfiling = true;
        logger_1.logger.info(`Starting profiler for ${duration}ms`);
        // Starte die CPU-Profiling-Sammlung
        if (typeof performance !== 'undefined' && 'mark' in performance) {
            performance.mark('profile-start');
        }
        // Plane das Ende des Profilings
        setTimeout(() => {
            this.stopProfiling();
        }, duration);
    }
    /**
     * Stoppt das Profiling
     */
    stopProfiling() {
        if (!this.isProfiling) {
            logger_1.logger.warn('Profiling is not running');
            return;
        }
        this.isProfiling = false;
        logger_1.logger.info('Stopping profiler');
        // Beende die CPU-Profiling-Sammlung
        if (typeof performance !== 'undefined' && 'mark' in performance) {
            performance.mark('profile-end');
            performance.measure('profile-duration', 'profile-start', 'profile-end');
        }
        // Generiere den Profiling-Bericht
        this.generateReport();
    }
    /**
     * Profiliert eine Funktion
     */
    profileFunction(functionName, fn) {
        const startTime = this.performanceMonitor.startOperation(functionName);
        try {
            const result = fn();
            // Erfasse die Profiling-Informationen
            this.captureProfile(functionName, startTime);
            return result;
        }
        catch (error) {
            // Erfasse die Profiling-Informationen auch bei Fehlern
            this.captureProfile(functionName, startTime, error);
            throw error;
        }
    }
    /**
     * Erfasst Profiling-Informationen
     */
    captureProfile(functionName, startTime, error) {
        const endTime = Date.now();
        const startTimeNum = parseInt(startTime);
        const duration = endTime - startTimeNum;
        const existingProfile = this.profiles.get(functionName);
        if (existingProfile) {
            // Aktualisiere das bestehende Profil
            this.profiles.set(functionName, {
                ...existingProfile,
                callCount: existingProfile.callCount + 1,
                totalTime: existingProfile.totalTime + duration,
                averageTime: (existingProfile.totalTime + duration) / (existingProfile.callCount + 1),
                minTime: Math.min(existingProfile.minTime, duration),
                maxTime: Math.max(existingProfile.maxTime, duration)
            });
        }
        else {
            // Erstelle ein neues Profil
            this.profiles.set(functionName, {
                functionName,
                callCount: 1,
                totalTime: duration,
                averageTime: duration,
                minTime: duration,
                maxTime: duration
            });
        }
        // Erfasse Stack Trace bei Fehlern
        if (error) {
            const stackTrace = error.stack || 'No stack trace available';
            const profile = this.profiles.get(functionName);
            if (profile) {
                this.profiles.set(functionName, {
                    ...profile,
                    stackTrace
                });
            }
        }
    }
    /**
     * Nimmt einen Speicher-Snapshot auf
     */
    takeMemorySnapshot(label) {
        const memoryUsage = process.memoryUsage();
        const snapshot = {
            timestamp: new Date(),
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external || 0,
            arrayBuffers: memoryUsage.arrayBuffers || 0,
            details: memoryUsage
        };
        this.memorySnapshots.push(snapshot);
        logger_1.logger.debug(`Memory snapshot taken${label ? ` (${label})` : ''}`, {
            heapUsed: `${(snapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(snapshot.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            external: `${(snapshot.external / 1024 / 1024).toFixed(2)} MB`
        });
    }
    /**
     * Vergleicht zwei Speicher-Snapshots
     */
    compareMemorySnapshots(snapshot1Index, snapshot2Index) {
        const snapshot1 = this.memorySnapshots[snapshot1Index];
        const snapshot2 = this.memorySnapshots[snapshot2Index];
        if (!snapshot1 || !snapshot2) {
            throw new Error('Invalid snapshot indices');
        }
        const heapUsedDiff = snapshot2.heapUsed - snapshot1.heapUsed;
        const heapTotalDiff = snapshot2.heapTotal - snapshot1.heapTotal;
        const externalDiff = snapshot2.external - snapshot1.external;
        const growthRate = ((snapshot2.heapUsed - snapshot1.heapUsed) / snapshot1.heapUsed) * 100;
        return {
            heapUsedDiff,
            heapTotalDiff,
            externalDiff,
            growthRate
        };
    }
    /**
     * Identifiziert Speicherlecks
     */
    detectMemoryLeaks(threshold = 10) {
        const leaks = [];
        if (this.memorySnapshots.length < 2) {
            return leaks;
        }
        // Vergleiche aufeinanderfolgende Snapshots
        for (let i = 1; i < this.memorySnapshots.length; i++) {
            const comparison = this.compareMemorySnapshots(i - 1, i);
            if (comparison.growthRate > threshold) {
                leaks.push(`Potential memory leak detected between snapshots ${i - 1} and ${i}: ` +
                    `${comparison.growthRate.toFixed(2)}% growth`);
            }
        }
        return leaks;
    }
    /**
     * Generiert einen Profiling-Bericht
     */
    generateReport() {
        const reportLines = [
            '=== Performance Profiling Report ===',
            `Report Generated: ${new Date().toISOString()}`,
            `Total Functions Profiled: ${this.profiles.size}`,
            `Memory Snapshots: ${this.memorySnapshots.length}`,
            ''
        ];
        // Funktionsprofile
        reportLines.push('=== Function Profiles ===');
        const profiles = Array.from(this.profiles.values());
        // Sortiere nach Gesamtzeit (absteigend)
        profiles.sort((a, b) => b.totalTime - a.totalTime);
        profiles.forEach(profile => {
            reportLines.push(`${profile.functionName}:`, `  Calls: ${profile.callCount}`, `  Total Time: ${profile.totalTime.toFixed(2)}ms`, `  Average Time: ${profile.averageTime.toFixed(2)}ms`, `  Min Time: ${profile.minTime.toFixed(2)}ms`, `  Max Time: ${profile.maxTime.toFixed(2)}ms`);
            if (profile.stackTrace) {
                reportLines.push(`  Error Stack: ${profile.stackTrace.substring(0, 100)}...`);
            }
            reportLines.push('');
        });
        // Speicheranalyse
        reportLines.push('=== Memory Analysis ===');
        if (this.memorySnapshots.length > 0) {
            const latestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
            reportLines.push(`Latest Memory Usage:`, `  Heap Used: ${(latestSnapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`, `  Heap Total: ${(latestSnapshot.heapTotal / 1024 / 1024).toFixed(2)} MB`, `  External: ${(latestSnapshot.external / 1024 / 1024).toFixed(2)} MB`);
        }
        // Speicherlecks
        const leaks = this.detectMemoryLeaks();
        if (leaks.length > 0) {
            reportLines.push('', '=== Potential Memory Leaks ===');
            leaks.forEach(leak => reportLines.push(`  ${leak}`));
        }
        const report = reportLines.join('\n');
        logger_1.logger.info(report);
        return report;
    }
    /**
     * Startet kontinuierliches Profiling
     */
    startContinuousProfiling(interval = 60000) {
        if (this.profilingInterval) {
            logger_1.logger.warn('Continuous profiling is already running');
            return;
        }
        logger_1.logger.info(`Starting continuous profiling with ${interval}ms interval`);
        this.profilingInterval = setInterval(() => {
            this.takeMemorySnapshot();
            // Jede 10. Minute einen vollständigen Bericht generieren
            if (Math.floor(Date.now() / interval) % 10 === 0) {
                this.generateReport();
            }
        }, interval);
    }
    /**
     * Stoppt kontinuierliches Profiling
     */
    stopContinuousProfiling() {
        if (this.profilingInterval) {
            clearInterval(this.profilingInterval);
            this.profilingInterval = null;
            logger_1.logger.info('Stopped continuous profiling');
        }
    }
    /**
     * Löscht Profiling-Daten
     */
    clearProfiles() {
        this.profiles.clear();
        this.memorySnapshots = [];
        logger_1.logger.info('Cleared profiling data');
    }
    /**
     * Holt Funktionsprofile
     */
    getProfiles() {
        return Array.from(this.profiles.values());
    }
    /**
     * Holt Speicher-Snapshots
     */
    getMemorySnapshots() {
        return [...this.memorySnapshots];
    }
    /**
     * Exportiert Profiling-Daten
     */
    exportData() {
        return {
            profiles: this.getProfiles(),
            memorySnapshots: this.getMemorySnapshots(),
            timestamp: new Date()
        };
    }
}
exports.Profiler = Profiler;
