interface ProfileResult {
    functionName: string;
    callCount: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    stackTrace?: string;
}
interface MemorySnapshot {
    timestamp: Date;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    details: NodeJS.MemoryUsage;
}
export declare class Profiler {
    private static instance;
    private performanceMonitor;
    private isProfiling;
    private profiles;
    private memorySnapshots;
    private profilingInterval;
    private constructor();
    static getInstance(): Profiler;
    /**
     * Startet das Profiling
     */
    startProfiling(duration?: number): void;
    /**
     * Stoppt das Profiling
     */
    stopProfiling(): void;
    /**
     * Profiliert eine Funktion
     */
    profileFunction<T>(functionName: string, fn: () => T): T;
    /**
     * Erfasst Profiling-Informationen
     */
    private captureProfile;
    /**
     * Nimmt einen Speicher-Snapshot auf
     */
    takeMemorySnapshot(label?: string): void;
    /**
     * Vergleicht zwei Speicher-Snapshots
     */
    compareMemorySnapshots(snapshot1Index: number, snapshot2Index: number): {
        heapUsedDiff: number;
        heapTotalDiff: number;
        externalDiff: number;
        growthRate: number;
    };
    /**
     * Identifiziert Speicherlecks
     */
    detectMemoryLeaks(threshold?: number): string[];
    /**
     * Generiert einen Profiling-Bericht
     */
    generateReport(): string;
    /**
     * Startet kontinuierliches Profiling
     */
    startContinuousProfiling(interval?: number): void;
    /**
     * Stoppt kontinuierliches Profiling
     */
    stopContinuousProfiling(): void;
    /**
     * Löscht Profiling-Daten
     */
    clearProfiles(): void;
    /**
     * Holt Funktionsprofile
     */
    getProfiles(): ProfileResult[];
    /**
     * Holt Speicher-Snapshots
     */
    getMemorySnapshots(): MemorySnapshot[];
    /**
     * Exportiert Profiling-Daten
     */
    exportData(): {
        profiles: ProfileResult[];
        memorySnapshots: MemorySnapshot[];
        timestamp: Date;
    };
}
export {};
