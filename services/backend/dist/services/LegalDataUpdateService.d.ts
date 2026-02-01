import { PrismaClient, LegalKnowledge } from '@prisma/client';
export interface UpdateCheck {
    hasUpdates: boolean;
    availableUpdates: number;
    lastCheck: Date;
    nextCheck: Date;
}
export interface UpdateSource {
    name: string;
    url: string;
    type: 'law' | 'court_decision' | 'regulation';
    enabled: boolean;
    lastSync: Date | null;
    syncInterval: number;
}
export interface UpdateSchedule {
    enabled: boolean;
    interval: number;
    lastRun: Date | null;
    nextRun: Date | null;
}
export declare class LegalDataUpdateService {
    private prisma;
    private importService;
    private updateSources;
    constructor(prisma: PrismaClient);
    /**
     * Prüft auf verfügbare Updates
     */
    checkForUpdates(): Promise<UpdateCheck>;
    /**
     * Führt automatische Updates durch
     */
    performAutoUpdate(): Promise<{
        success: boolean;
        sourcesUpdated: number;
        totalImported: number;
        totalUpdated: number;
        errors: string[];
    }>;
    /**
     * Synchronisiert eine spezifische Quelle
     */
    syncSource(sourceName: string): Promise<{
        success: boolean;
        imported: number;
        updated: number;
    }>;
    /**
     * Markiert Rechtsdaten als veraltet
     */
    markAsOutdated(reference: string, reason: string): Promise<void>;
    /**
     * Findet veraltete Rechtsdaten
     */
    findOutdatedData(olderThanDays?: number): Promise<LegalKnowledge[]>;
    /**
     * Benachrichtigt über wichtige Rechtsänderungen
     */
    notifyLegalChanges(changes: Array<{
        reference: string;
        changeType: 'new' | 'updated' | 'repealed';
        summary: string;
    }>): Promise<void>;
    /**
     * Erstellt einen Update-Report
     */
    generateUpdateReport(startDate: Date, endDate: Date): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        totalUpdates: number;
        newEntries: number;
        modifiedEntries: number;
        deletedEntries: number;
        byType: Record<string, number>;
        topChangedReferences: Array<{
            reference: string;
            changes: number;
        }>;
    }>;
    /**
     * Konfiguriert Update-Schedule
     */
    configureUpdateSchedule(schedule: UpdateSchedule): Promise<void>;
    /**
     * Ruft Update-Quellen ab
     */
    getUpdateSources(): UpdateSource[];
    /**
     * Aktiviert/Deaktiviert eine Update-Quelle
     */
    toggleUpdateSource(sourceName: string, enabled: boolean): void;
    /**
     * Private Hilfsmethoden
     */
    private shouldSync;
    private fetchUpdatesFromSource;
}
