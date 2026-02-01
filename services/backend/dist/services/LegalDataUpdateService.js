"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDataUpdateService = void 0;
const logger_1 = require("../utils/logger");
const LegalDataImportService_1 = require("./LegalDataImportService");
class LegalDataUpdateService {
    constructor(prisma) {
        this.prisma = prisma;
        this.updateSources = [
            {
                name: 'BGB Updates',
                url: 'https://www.gesetze-im-internet.de/bgb/',
                type: 'law',
                enabled: true,
                lastSync: null,
                syncInterval: 30 // Alle 30 Tage
            },
            {
                name: 'BGH Entscheidungen',
                url: 'https://www.bundesgerichtshof.de',
                type: 'court_decision',
                enabled: true,
                lastSync: null,
                syncInterval: 7 // Wöchentlich
            }
        ];
        this.importService = new LegalDataImportService_1.LegalDataImportService(prisma);
    }
    /**
     * Prüft auf verfügbare Updates
     */
    async checkForUpdates() {
        try {
            const lastCheck = new Date();
            let availableUpdates = 0;
            // Prüfe jede Update-Quelle
            for (const source of this.updateSources) {
                if (!source.enabled)
                    continue;
                const needsUpdate = this.shouldSync(source);
                if (needsUpdate) {
                    availableUpdates++;
                }
            }
            const nextCheck = new Date();
            nextCheck.setHours(nextCheck.getHours() + 24); // Nächste Prüfung in 24h
            return {
                hasUpdates: availableUpdates > 0,
                availableUpdates,
                lastCheck,
                nextCheck
            };
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Prüfen auf Updates:', error);
            throw error;
        }
    }
    /**
     * Führt automatische Updates durch
     */
    async performAutoUpdate() {
        const result = {
            success: true,
            sourcesUpdated: 0,
            totalImported: 0,
            totalUpdated: 0,
            errors: []
        };
        try {
            logger_1.logger.info('Starte automatisches Update der Rechtsdatenbank');
            for (const source of this.updateSources) {
                if (!source.enabled || !this.shouldSync(source)) {
                    continue;
                }
                try {
                    const updates = await this.fetchUpdatesFromSource(source);
                    if (updates.length > 0) {
                        const importResult = await this.importService.importLegalData(updates, {
                            updateExisting: true,
                            skipDuplicates: false
                        });
                        result.totalImported += importResult.imported;
                        result.totalUpdated += importResult.updated;
                        result.sourcesUpdated++;
                        // Aktualisiere lastSync
                        source.lastSync = new Date();
                        logger_1.logger.info(`${source.name}: ${importResult.imported} importiert, ${importResult.updated} aktualisiert`);
                    }
                }
                catch (error) {
                    const errorMsg = `Fehler bei ${source.name}: ${error}`;
                    result.errors.push(errorMsg);
                    logger_1.logger.error(errorMsg);
                }
            }
            logger_1.loggers.businessEvent('LEGAL_DATA_AUTO_UPDATE', '', {
                sourcesUpdated: result.sourcesUpdated,
                totalImported: result.totalImported,
                totalUpdated: result.totalUpdated,
                errors: result.errors.length
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim automatischen Update:', error);
            result.success = false;
            throw error;
        }
    }
    /**
     * Synchronisiert eine spezifische Quelle
     */
    async syncSource(sourceName) {
        try {
            const source = this.updateSources.find(s => s.name === sourceName);
            if (!source) {
                throw new Error(`Update-Quelle ${sourceName} nicht gefunden`);
            }
            const updates = await this.fetchUpdatesFromSource(source);
            const importResult = await this.importService.importLegalData(updates, {
                updateExisting: true,
                skipDuplicates: false
            });
            source.lastSync = new Date();
            return {
                success: true,
                imported: importResult.imported,
                updated: importResult.updated
            };
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Synchronisieren von ${sourceName}:`, error);
            throw error;
        }
    }
    /**
     * Markiert Rechtsdaten als veraltet
     */
    async markAsOutdated(reference, reason) {
        try {
            await this.prisma.legalKnowledge.update({
                where: { reference },
                data: {
                    tags: {
                        push: `OUTDATED:${reason}`
                    }
                }
            });
            logger_1.loggers.businessEvent('LEGAL_DATA_MARKED_OUTDATED', '', {
                reference,
                reason
            });
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Markieren von ${reference} als veraltet:`, error);
            throw error;
        }
    }
    /**
     * Findet veraltete Rechtsdaten
     */
    async findOutdatedData(olderThanDays = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const outdated = await this.prisma.legalKnowledge.findMany({
                where: {
                    lastUpdated: {
                        lt: cutoffDate
                    }
                },
                orderBy: {
                    lastUpdated: 'asc'
                }
            });
            return outdated;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Suchen veralteter Daten:', error);
            throw error;
        }
    }
    /**
     * Benachrichtigt über wichtige Rechtsänderungen
     */
    async notifyLegalChanges(changes) {
        try {
            // Hier würde eine Benachrichtigungs-Logik implementiert werden
            // z.B. E-Mail an Admins, Push-Notifications, etc.
            for (const change of changes) {
                logger_1.loggers.businessEvent('LEGAL_CHANGE_NOTIFICATION', '', {
                    reference: change.reference,
                    changeType: change.changeType,
                    summary: change.summary
                });
            }
            logger_1.logger.info(`${changes.length} Rechtsänderungen wurden gemeldet`);
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Benachrichtigen über Rechtsänderungen:', error);
        }
    }
    /**
     * Erstellt einen Update-Report
     */
    async generateUpdateReport(startDate, endDate) {
        try {
            // Simulierte Report-Daten (würde echte Tracking-Daten benötigen)
            const stats = await this.importService.getStatistics();
            return {
                period: { start: startDate, end: endDate },
                totalUpdates: stats.recentUpdates,
                newEntries: 0, // Würde Tracking benötigen
                modifiedEntries: stats.recentUpdates,
                deletedEntries: 0,
                byType: stats.byType,
                topChangedReferences: []
            };
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Erstellen des Update-Reports:', error);
            throw error;
        }
    }
    /**
     * Konfiguriert Update-Schedule
     */
    async configureUpdateSchedule(schedule) {
        try {
            // Hier würde die Schedule-Konfiguration gespeichert werden
            // z.B. in einer Config-Tabelle oder Redis
            logger_1.logger.info('Update-Schedule konfiguriert:', schedule);
            logger_1.loggers.businessEvent('UPDATE_SCHEDULE_CONFIGURED', '', {
                enabled: schedule.enabled,
                interval: schedule.interval
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Konfigurieren des Update-Schedules:', error);
            throw error;
        }
    }
    /**
     * Ruft Update-Quellen ab
     */
    getUpdateSources() {
        return this.updateSources;
    }
    /**
     * Aktiviert/Deaktiviert eine Update-Quelle
     */
    toggleUpdateSource(sourceName, enabled) {
        const source = this.updateSources.find(s => s.name === sourceName);
        if (source) {
            source.enabled = enabled;
            logger_1.logger.info(`Update-Quelle ${sourceName} ${enabled ? 'aktiviert' : 'deaktiviert'}`);
        }
    }
    /**
     * Private Hilfsmethoden
     */
    shouldSync(source) {
        if (!source.lastSync) {
            return true; // Noch nie synchronisiert
        }
        const daysSinceLastSync = Math.floor((Date.now() - source.lastSync.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLastSync >= source.syncInterval;
    }
    async fetchUpdatesFromSource(source) {
        // Simulierte Daten - in Realität würde hier ein API-Call oder Web-Scraping stattfinden
        logger_1.logger.info(`Rufe Updates von ${source.name} ab...`);
        // Beispiel-Daten für Demonstration
        const mockUpdates = [];
        if (source.type === 'law') {
            // Simuliere BGB-Updates
            mockUpdates.push({
                type: 'LAW',
                reference: '§ 536 BGB',
                title: 'Minderung der Miete bei Sach- und Rechtsmängeln',
                content: 'Aktualisierter Inhalt...',
                jurisdiction: 'Deutschland',
                effectiveDate: new Date(),
                tags: ['BGB', 'Mietrecht', 'Update']
            });
        }
        if (source.type === 'court_decision') {
            // Simuliere neue Gerichtsentscheidungen
            mockUpdates.push({
                type: 'COURT_DECISION',
                reference: 'BGH VIII ZR 123/23',
                title: 'Neue Entscheidung zu Mietminderung',
                content: 'Zusammenfassung der Entscheidung...',
                jurisdiction: 'Deutschland',
                effectiveDate: new Date(),
                tags: ['BGH', 'Mietminderung', 'Neu']
            });
        }
        logger_1.logger.info(`${mockUpdates.length} Updates von ${source.name} abgerufen`);
        return mockUpdates;
    }
}
exports.LegalDataUpdateService = LegalDataUpdateService;
