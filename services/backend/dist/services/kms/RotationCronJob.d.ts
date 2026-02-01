import { PrismaClient } from '@prisma/client';
import { KeyRotationManager } from './KeyRotationManager';
import { AuditLogger } from './AuditLogger';
/**
 * Rotation Cron Job
 *
 * Automatische Ausführung der Schlüsselrotation nach konfigurierbarem Zeitplan
 */
export declare class RotationCronJob {
    private job;
    private rotationManager;
    private auditLogger;
    private isRunning;
    constructor(rotationManager: KeyRotationManager, auditLogger: AuditLogger);
    /**
     * Startet den Cron-Job
     *
     * @param cronExpression - Cron-Expression (Standard: täglich um 2 Uhr)
     */
    start(cronExpression?: string): void;
    /**
     * Stoppt den Cron-Job
     */
    stop(): void;
    /**
     * Gibt den Status des Cron-Jobs zurück
     */
    getStatus(): {
        isRunning: boolean;
        isExecuting: boolean;
        nextExecution: Date | null;
    };
    /**
     * Führt die Rotation manuell aus (für Testing oder manuelle Trigger)
     */
    executeRotation(): Promise<void>;
    /**
     * Aktualisiert den Cron-Schedule
     */
    updateSchedule(cronExpression: string): void;
}
/**
 * Factory-Funktion zum Erstellen und Starten des Cron-Jobs
 */
export declare function createRotationCronJob(prisma: PrismaClient, cronExpression?: string): RotationCronJob;
