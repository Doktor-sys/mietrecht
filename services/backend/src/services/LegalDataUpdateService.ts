import { PrismaClient, LegalKnowledge } from '@prisma/client'
import { logger, loggers } from '../utils/logger'
import { LegalDataImportService, LegalDataImport } from './LegalDataImportService'

export interface UpdateCheck {
  hasUpdates: boolean
  availableUpdates: number
  lastCheck: Date
  nextCheck: Date
}

export interface UpdateSource {
  name: string
  url: string
  type: 'law' | 'court_decision' | 'regulation'
  enabled: boolean
  lastSync: Date | null
  syncInterval: number // in Tagen
}

export interface UpdateSchedule {
  enabled: boolean
  interval: number // in Stunden
  lastRun: Date | null
  nextRun: Date | null
}

export class LegalDataUpdateService {
  private importService: LegalDataImportService
  private updateSources: UpdateSource[] = [
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
  ]

  constructor(private prisma: PrismaClient) {
    this.importService = new LegalDataImportService(prisma)
  }

  /**
   * Prüft auf verfügbare Updates
   */
  async checkForUpdates(): Promise<UpdateCheck> {
    try {
      const lastCheck = new Date()
      let availableUpdates = 0

      // Prüfe jede Update-Quelle
      for (const source of this.updateSources) {
        if (!source.enabled) continue

        const needsUpdate = this.shouldSync(source)
        if (needsUpdate) {
          availableUpdates++
        }
      }

      const nextCheck = new Date()
      nextCheck.setHours(nextCheck.getHours() + 24) // Nächste Prüfung in 24h

      return {
        hasUpdates: availableUpdates > 0,
        availableUpdates,
        lastCheck,
        nextCheck
      }
    } catch (error) {
      logger.error('Fehler beim Prüfen auf Updates:', error)
      throw error
    }
  }

  /**
   * Führt automatische Updates durch
   */
  async performAutoUpdate(): Promise<{
    success: boolean
    sourcesUpdated: number
    totalImported: number
    totalUpdated: number
    errors: string[]
  }> {
    const result = {
      success: true,
      sourcesUpdated: 0,
      totalImported: 0,
      totalUpdated: 0,
      errors: [] as string[]
    }

    try {
      logger.info('Starte automatisches Update der Rechtsdatenbank')

      for (const source of this.updateSources) {
        if (!source.enabled || !this.shouldSync(source)) {
          continue
        }

        try {
          const updates = await this.fetchUpdatesFromSource(source)
          
          if (updates.length > 0) {
            const importResult = await this.importService.importLegalData(updates, {
              updateExisting: true,
              skipDuplicates: false
            })

            result.totalImported += importResult.imported
            result.totalUpdated += importResult.updated
            result.sourcesUpdated++

            // Aktualisiere lastSync
            source.lastSync = new Date()

            logger.info(`${source.name}: ${importResult.imported} importiert, ${importResult.updated} aktualisiert`)
          }
        } catch (error) {
          const errorMsg = `Fehler bei ${source.name}: ${error}`
          result.errors.push(errorMsg)
          logger.error(errorMsg)
        }
      }

      loggers.businessEvent('LEGAL_DATA_AUTO_UPDATE', '', {
        sourcesUpdated: result.sourcesUpdated,
        totalImported: result.totalImported,
        totalUpdated: result.totalUpdated,
        errors: result.errors.length
      })

      return result
    } catch (error) {
      logger.error('Fehler beim automatischen Update:', error)
      result.success = false
      throw error
    }
  }

  /**
   * Synchronisiert eine spezifische Quelle
   */
  async syncSource(sourceName: string): Promise<{
    success: boolean
    imported: number
    updated: number
  }> {
    try {
      const source = this.updateSources.find(s => s.name === sourceName)
      
      if (!source) {
        throw new Error(`Update-Quelle ${sourceName} nicht gefunden`)
      }

      const updates = await this.fetchUpdatesFromSource(source)
      
      const importResult = await this.importService.importLegalData(updates, {
        updateExisting: true,
        skipDuplicates: false
      })

      source.lastSync = new Date()

      return {
        success: true,
        imported: importResult.imported,
        updated: importResult.updated
      }
    } catch (error) {
      logger.error(`Fehler beim Synchronisieren von ${sourceName}:`, error)
      throw error
    }
  }

  /**
   * Markiert Rechtsdaten als veraltet
   */
  async markAsOutdated(reference: string, reason: string): Promise<void> {
    try {
      await this.prisma.legalKnowledge.update({
        where: { reference },
        data: {
          tags: {
            push: `OUTDATED:${reason}`
          }
        }
      })

      loggers.businessEvent('LEGAL_DATA_MARKED_OUTDATED', '', {
        reference,
        reason
      })
    } catch (error) {
      logger.error(`Fehler beim Markieren von ${reference} als veraltet:`, error)
      throw error
    }
  }

  /**
   * Findet veraltete Rechtsdaten
   */
  async findOutdatedData(olderThanDays: number = 365): Promise<LegalKnowledge[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const outdated = await this.prisma.legalKnowledge.findMany({
        where: {
          lastUpdated: {
            lt: cutoffDate
          }
        },
        orderBy: {
          lastUpdated: 'asc'
        }
      })

      return outdated
    } catch (error) {
      logger.error('Fehler beim Suchen veralteter Daten:', error)
      throw error
    }
  }

  /**
   * Benachrichtigt über wichtige Rechtsänderungen
   */
  async notifyLegalChanges(changes: Array<{
    reference: string
    changeType: 'new' | 'updated' | 'repealed'
    summary: string
  }>): Promise<void> {
    try {
      // Hier würde eine Benachrichtigungs-Logik implementiert werden
      // z.B. E-Mail an Admins, Push-Notifications, etc.
      
      for (const change of changes) {
        loggers.businessEvent('LEGAL_CHANGE_NOTIFICATION', '', {
          reference: change.reference,
          changeType: change.changeType,
          summary: change.summary
        })
      }

      logger.info(`${changes.length} Rechtsänderungen wurden gemeldet`)
    } catch (error) {
      logger.error('Fehler beim Benachrichtigen über Rechtsänderungen:', error)
    }
  }

  /**
   * Erstellt einen Update-Report
   */
  async generateUpdateReport(startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date }
    totalUpdates: number
    newEntries: number
    modifiedEntries: number
    deletedEntries: number
    byType: Record<string, number>
    topChangedReferences: Array<{ reference: string; changes: number }>
  }> {
    try {
      // Simulierte Report-Daten (würde echte Tracking-Daten benötigen)
      const stats = await this.importService.getStatistics()

      return {
        period: { start: startDate, end: endDate },
        totalUpdates: stats.recentUpdates,
        newEntries: 0, // Würde Tracking benötigen
        modifiedEntries: stats.recentUpdates,
        deletedEntries: 0,
        byType: stats.byType as Record<string, number>,
        topChangedReferences: []
      }
    } catch (error) {
      logger.error('Fehler beim Erstellen des Update-Reports:', error)
      throw error
    }
  }

  /**
   * Konfiguriert Update-Schedule
   */
  async configureUpdateSchedule(schedule: UpdateSchedule): Promise<void> {
    try {
      // Hier würde die Schedule-Konfiguration gespeichert werden
      // z.B. in einer Config-Tabelle oder Redis
      
      logger.info('Update-Schedule konfiguriert:', schedule)
      
      loggers.businessEvent('UPDATE_SCHEDULE_CONFIGURED', '', {
        enabled: schedule.enabled,
        interval: schedule.interval
      })
    } catch (error) {
      logger.error('Fehler beim Konfigurieren des Update-Schedules:', error)
      throw error
    }
  }

  /**
   * Ruft Update-Quellen ab
   */
  getUpdateSources(): UpdateSource[] {
    return this.updateSources
  }

  /**
   * Aktiviert/Deaktiviert eine Update-Quelle
   */
  toggleUpdateSource(sourceName: string, enabled: boolean): void {
    const source = this.updateSources.find(s => s.name === sourceName)
    if (source) {
      source.enabled = enabled
      logger.info(`Update-Quelle ${sourceName} ${enabled ? 'aktiviert' : 'deaktiviert'}`)
    }
  }

  /**
   * Private Hilfsmethoden
   */
  private shouldSync(source: UpdateSource): boolean {
    if (!source.lastSync) {
      return true // Noch nie synchronisiert
    }

    const daysSinceLastSync = Math.floor(
      (Date.now() - source.lastSync.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysSinceLastSync >= source.syncInterval
  }

  private async fetchUpdatesFromSource(source: UpdateSource): Promise<LegalDataImport[]> {
    // Simulierte Daten - in Realität würde hier ein API-Call oder Web-Scraping stattfinden
    logger.info(`Rufe Updates von ${source.name} ab...`)

    // Beispiel-Daten für Demonstration
    const mockUpdates: LegalDataImport[] = []

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
      })
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
      })
    }

    logger.info(`${mockUpdates.length} Updates von ${source.name} abgerufen`)

    return mockUpdates
  }
}
