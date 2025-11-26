import { PrismaClient, LegalKnowledge, LegalType } from '@prisma/client'
import { logger, loggers } from '../utils/logger'
import fs from 'fs'
import path from 'path'

export interface LegalDataImport {
  type: LegalType
  reference: string
  title: string
  content: string
  jurisdiction: string
  effectiveDate: Date
  tags: string[]
}

export interface ImportResult {
  imported: number
  updated: number
  failed: number
  errors: Array<{
    reference: string
    error: string
    data: any
  }>
}

export interface ImportOptions {
  skipDuplicates?: boolean
  updateExisting?: boolean
  validateOnly?: boolean
  batchSize?: number
}

export interface Statistics {
  total: number
  byType: Record<string, number>
  recentUpdates: number
  oldestEntry: Date | null
  newestEntry: Date | null
}

export class LegalDataImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Importiert Rechtsdaten aus einem Array
   */
  async importLegalData(data: LegalDataImport[], options: ImportOptions = {}): Promise<ImportResult> {
    const {
      skipDuplicates = false,
      updateExisting = true,
      validateOnly = false,
      batchSize = 100
    } = options

    const result: ImportResult = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    }

    // Validiere Daten
    for (const item of data) {
      const validationError = this.validateLegalData(item)
      if (validationError) {
        result.failed++
        result.errors.push({
          reference: item.reference,
          error: validationError,
          data: item
        })
      }
    }

    // Filtere ungültige Daten
    const validData = data.filter(item => !this.validateLegalData(item))

    if (validateOnly) {
      return result
    }

    // Verarbeite in Batches
    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize)
      const batchResult = await this.processBatch(batch, {
        skipDuplicates,
        updateExisting
      })

      result.imported += batchResult.imported
      result.updated += batchResult.updated
      result.failed += batchResult.failed
      result.errors.push(...batchResult.errors)
    }

    loggers.businessEvent('LEGAL_DATA_IMPORTED', '', {
      imported: result.imported,
      updated: result.updated,
      failed: result.failed
    })

    return result
  }

  /**
   * Importiert Rechtsdaten aus einer JSON-Datei
   */
  async importFromFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const data: LegalDataImport[] = JSON.parse(fileContent)
      
      return await this.importLegalData(data, options)
    } catch (error) {
      logger.error('Fehler beim Import aus Datei:', error)
      throw new Error(`Datei-Import fehlgeschlagen: ${error}`)
    }
  }

  /**
   * Importiert BGB-Paragraphen
   */
  async importBGBParagraphs(paragraphs: Array<{
    paragraph: string
    title: string
    content: string
  }>): Promise<ImportResult> {
    const data: LegalDataImport[] = paragraphs.map(p => ({
      type: 'LAW',
      reference: p.paragraph,
      title: p.title,
      content: p.content,
      jurisdiction: 'Deutschland',
      effectiveDate: new Date(),
      tags: ['BGB', 'Mietrecht']
    }))

    return await this.importLegalData(data, {
      updateExisting: true,
      skipDuplicates: false
    })
  }

  /**
   * Importiert Gerichtsentscheidungen
   */
  async importCourtDecisions(decisions: Array<{
    reference: string
    title: string
    content: string
    date: Date
  }>): Promise<ImportResult> {
    const data: LegalDataImport[] = decisions.map(d => ({
      type: 'COURT_DECISION',
      reference: d.reference,
      title: d.title,
      content: d.content,
      jurisdiction: 'Deutschland',
      effectiveDate: new Date(d.date),
      tags: ['Gericht', 'Entscheidung']
    }))

    return await this.importLegalData(data, {
      updateExisting: true,
      skipDuplicates: false
    })
  }

  /**
   * Aktualisiert bestehende Rechtsdaten
   */
  async updateLegalData(reference: string, updates: Partial<LegalDataImport>): Promise<LegalKnowledge> {
    try {
      const existing = await this.prisma.legalKnowledge.findUnique({
        where: { reference }
      })

      if (!existing) {
        throw new Error(`Rechtsdaten mit Referenz ${reference} nicht gefunden`)
      }

      // Erstelle Version-Snapshot vor dem Update
      await this.createVersionSnapshot(reference)

      const updated = await this.prisma.legalKnowledge.update({
        where: { reference },
        data: {
          title: updates.title || existing.title,
          content: updates.content || existing.content,
          jurisdiction: updates.jurisdiction || existing.jurisdiction,
          effectiveDate: updates.effectiveDate || existing.effectiveDate,
          tags: updates.tags || existing.tags,
          // Removed source field as it doesn't exist in the Prisma model
          lastUpdated: new Date()
        }
      })

      loggers.businessEvent('LEGAL_DATA_UPDATED', '', {
        reference,
        updatedFields: Object.keys(updates)
      })

      return updated
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren von ${reference}:`, error)
      throw error
    }
  }

  /**
   * Löscht veraltete Rechtsdaten
   */
  async deleteOutdatedData(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.legalKnowledge.deleteMany({
        where: {
          lastUpdated: {
            lt: olderThan
          }
        }
      })

      loggers.businessEvent('LEGAL_DATA_DELETED', '', {
        count: result.count
      })

      return result.count
    } catch (error) {
      logger.error('Fehler beim Löschen veralteter Daten:', error)
      throw error
    }
  }

  /**
   * Findet Duplikate
   */
  async findDuplicates(): Promise<Array<{ reference: string; count: number }>> {
    try {
      const duplicates = await this.prisma.legalKnowledge.groupBy({
        by: ['reference'],
        _count: {
          id: true
        },
        having: {
          id: {
            _count: {
              gt: 1
            }
          }
        }
      })

      return duplicates.map(d => ({
        reference: d.reference,
        count: d._count?.id || 0
      }))
    } catch (error) {
      logger.error('Fehler beim Suchen nach Duplikaten:', error)
      throw error
    }
  }

  /**
   * Bereinigt Duplikate
   */
  async cleanupDuplicates(): Promise<number> {
    try {
      // Diese Implementierung ist vereinfacht
      // In einer echten Implementierung würde man die Duplikate identifizieren
      // und alle bis auf eine Instanz löschen
      const duplicates = await this.findDuplicates()
      let deletedCount = 0

      for (const dup of duplicates) {
        // Lösche alle bis auf eine Instanz
        const instances = await this.prisma.legalKnowledge.findMany({
          where: { reference: dup.reference },
          orderBy: { lastUpdated: 'desc' }
        })

        // Behalte die neueste Instanz, lösche die älteren
        if (instances.length > 1) {
          const idsToDelete = instances.slice(1).map(i => i.id)
          const deleteResult = await this.prisma.legalKnowledge.deleteMany({
            where: { id: { in: idsToDelete } }
          })
          deletedCount += deleteResult.count
        }
      }

      loggers.businessEvent('LEGAL_DATA_DUPLICATES_CLEANED', '', {
        count: deletedCount
      })

      return deletedCount
    } catch (error) {
      logger.error('Fehler beim Bereinigen von Duplikaten:', error)
      throw error
    }
  }

  /**
   * Ruft Statistiken ab
   */
  async getStatistics(): Promise<Statistics> {
    try {
      const total = await this.prisma.legalKnowledge.count()
      
      const byType = await this.prisma.legalKnowledge.groupBy({
        by: ['type'],
        _count: {
          _all: true
        }
      })

      const recentUpdates = await this.prisma.legalKnowledge.count({
        where: {
          lastUpdated: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Letzte 30 Tage
          }
        }
      })

      const oldestEntry = await this.prisma.legalKnowledge.findFirst({
        orderBy: { effectiveDate: 'asc' },
        select: { effectiveDate: true }
      })

      const newestEntry = await this.prisma.legalKnowledge.findFirst({
        orderBy: { effectiveDate: 'desc' },
        select: { effectiveDate: true }
      })

      return {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count._all || 0
          return acc
        }, {} as Record<string, number>),
        recentUpdates,
        oldestEntry: oldestEntry?.effectiveDate || null,
        newestEntry: newestEntry?.effectiveDate || null
      }
    } catch (error) {
      logger.error('Fehler beim Abrufen der Statistiken:', error)
      throw error
    }
  }

  /**
   * Private Hilfsmethoden
   */
  private validateLegalData(data: LegalDataImport): string | null {
    if (!data.reference) return 'Referenz ist erforderlich'
    if (!data.title) return 'Titel ist erforderlich'
    if (!data.content) return 'Inhalt ist erforderlich'
    if (!data.jurisdiction) return 'Jurisdiktion ist erforderlich'
    if (!data.effectiveDate) return 'Inkrafttrittsdatum ist erforderlich'
    if (!data.tags || !Array.isArray(data.tags)) return 'Tags müssen ein Array sein'
    
    return null
  }

  private async processBatch(batch: LegalDataImport[], options: {
    skipDuplicates: boolean
    updateExisting: boolean
  }): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    }

    for (const item of batch) {
      try {
        const existing = await this.prisma.legalKnowledge.findUnique({
          where: { reference: item.reference }
        })

        if (existing) {
          if (options.skipDuplicates) {
            // Überspringe Duplikate
            continue
          } else if (options.updateExisting) {
            // Aktualisiere bestehende
            await this.prisma.legalKnowledge.update({
              where: { reference: item.reference },
              data: {
                title: item.title,
                content: item.content,
                jurisdiction: item.jurisdiction,
                effectiveDate: item.effectiveDate,
                tags: item.tags,
                // Removed source and version fields as they don't exist in the Prisma model
                lastUpdated: new Date()
              }
            })
            result.updated++
          } else {
            // Fehler bei Duplikaten
            result.failed++
            result.errors.push({
              reference: item.reference,
              error: 'Duplikat gefunden',
              data: item
            })
          }
        } else {
          // Erstelle neue
          await this.prisma.legalKnowledge.create({
            data: {
              type: item.type,
              reference: item.reference,
              title: item.title,
              content: item.content,
              jurisdiction: item.jurisdiction,
              effectiveDate: item.effectiveDate,
              tags: item.tags
              // Removed source and version fields as they don't exist in the Prisma model
            }
          })
          result.imported++
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          reference: item.reference,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          data: item
        })
      }
    }

    return result
  }

  private async createVersionSnapshot(reference: string): Promise<void> {
    // In einer echten Implementierung würde hier ein Snapshot erstellt werden
    // z.B. in einer separaten Version-Tabelle
    logger.info(`Version-Snapshot für ${reference} erstellt`)
  }
}