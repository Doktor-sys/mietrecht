import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { LegalDataImportService, ImportOptions } from '../services/LegalDataImportService'
import { LegalDataUpdateService } from '../services/LegalDataUpdateService'
import { ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import multer from 'multer'
import path from 'path'

// Multer-Konfiguration für File-Upload
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/legal-data/')
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'legal-import-' + uniqueSuffix + path.extname(file.originalname))
  }
})

export const upload = multer({
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/json') {
      cb(null, true)
    } else {
      cb(new Error('Nur JSON-Dateien sind erlaubt'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

export class LegalDataImportController {
  private importService: LegalDataImportService
  private updateService: LegalDataUpdateService

  constructor(prisma: PrismaClient) {
    this.importService = new LegalDataImportService(prisma)
    this.updateService = new LegalDataUpdateService(prisma)
  }

  /**
   * POST /api/legal-data/import
   * Importiert Rechtsdaten aus JSON-Body
   */
  async importData(req: Request, res: Response): Promise<void> {
    try {
      const { data, options } = req.body

      if (!data || !Array.isArray(data)) {
        throw new ValidationError('Daten müssen ein Array sein')
      }

      const importOptions: ImportOptions = {
        skipDuplicates: options?.skipDuplicates || false,
        updateExisting: options?.updateExisting !== false,
        validateOnly: options?.validateOnly || false,
        batchSize: options?.batchSize || 100
      }

      const result = await this.importService.importLegalData(data, importOptions)

      res.json({
        success: true,
        data: result,
        message: `Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert, ${result.failed} fehlgeschlagen`
      })
    } catch (error) {
      logger.error('Fehler beim Import:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/import/file
   * Importiert Rechtsdaten aus hochgeladener JSON-Datei
   */
  async importFromFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('Keine Datei hochgeladen')
      }

      const options: ImportOptions = {
        skipDuplicates: req.body.skipDuplicates === 'true',
        updateExisting: req.body.updateExisting !== 'false',
        validateOnly: req.body.validateOnly === 'true',
        batchSize: parseInt(req.body.batchSize) || 100
      }

      const result = await this.importService.importFromFile(req.file.path, options)

      res.json({
        success: true,
        data: result,
        message: `Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert`
      })
    } catch (error) {
      logger.error('Fehler beim Datei-Import:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/import/bgb
   * Importiert BGB-Paragraphen
   */
  async importBGB(req: Request, res: Response): Promise<void> {
    try {
      const { paragraphs } = req.body

      if (!paragraphs || !Array.isArray(paragraphs)) {
        throw new ValidationError('BGB-Paragraphen müssen ein Array sein')
      }

      const result = await this.importService.importBGBParagraphs(paragraphs)

      res.json({
        success: true,
        data: result,
        message: `BGB-Import abgeschlossen: ${result.imported} importiert, ${result.updated} aktualisiert`
      })
    } catch (error) {
      logger.error('Fehler beim BGB-Import:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/import/court-decisions
   * Importiert Gerichtsentscheidungen
   */
  async importCourtDecisions(req: Request, res: Response): Promise<void> {
    try {
      const { decisions } = req.body

      if (!decisions || !Array.isArray(decisions)) {
        throw new ValidationError('Gerichtsentscheidungen müssen ein Array sein')
      }

      const result = await this.importService.importCourtDecisions(decisions)

      res.json({
        success: true,
        data: result,
        message: `Gerichtsentscheidungen importiert: ${result.imported} neu, ${result.updated} aktualisiert`
      })
    } catch (error) {
      logger.error('Fehler beim Import von Gerichtsentscheidungen:', error)
      throw error
    }
  }

  /**
   * PUT /api/legal-data/:reference
   * Aktualisiert bestehende Rechtsdaten
   */
  async updateData(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params
      const updates = req.body

      const result = await this.importService.updateLegalData(reference, updates)

      res.json({
        success: true,
        data: result,
        message: `Rechtsdaten ${reference} erfolgreich aktualisiert`
      })
    } catch (error) {
      logger.error('Fehler beim Aktualisieren:', error)
      throw error
    }
  }

  /**
   * DELETE /api/legal-data/outdated
   * Löscht veraltete Rechtsdaten
   */
  async deleteOutdated(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanDays } = req.query
      const days = parseInt(olderThanDays as string) || 365

      const olderThan = new Date()
      olderThan.setDate(olderThan.getDate() - days)

      const count = await this.importService.deleteOutdatedData(olderThan)

      res.json({
        success: true,
        data: { count },
        message: `${count} veraltete Einträge gelöscht`
      })
    } catch (error) {
      logger.error('Fehler beim Löschen veralteter Daten:', error)
      throw error
    }
  }

  /**
   * GET /api/legal-data/duplicates
   * Findet Duplikate
   */
  async findDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const duplicates = await this.importService.findDuplicates()

      res.json({
        success: true,
        data: duplicates,
        message: `${duplicates.length} Duplikate gefunden`
      })
    } catch (error) {
      logger.error('Fehler beim Suchen nach Duplikaten:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/duplicates/cleanup
   * Bereinigt Duplikate
   */
  async cleanupDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.importService.cleanupDuplicates()

      res.json({
        success: true,
        data: { count },
        message: `${count} Duplikate bereinigt`
      })
    } catch (error) {
      logger.error('Fehler beim Bereinigen von Duplikaten:', error)
      throw error
    }
  }

  /**
   * GET /api/legal-data/statistics
   * Ruft Statistiken ab
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.importService.getStatistics()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Fehler beim Abrufen der Statistiken:', error)
      throw error
    }
  }

  /**
   * GET /api/legal-data/updates/check
   * Prüft auf verfügbare Updates
   */
  async checkUpdates(req: Request, res: Response): Promise<void> {
    try {
      const updateCheck = await this.updateService.checkForUpdates()

      res.json({
        success: true,
        data: updateCheck
      })
    } catch (error) {
      logger.error('Fehler beim Prüfen auf Updates:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/updates/auto
   * Führt automatisches Update durch
   */
  async performAutoUpdate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.updateService.performAutoUpdate()

      res.json({
        success: result.success,
        data: result,
        message: `Auto-Update abgeschlossen: ${result.sourcesUpdated} Quellen aktualisiert`
      })
    } catch (error) {
      logger.error('Fehler beim automatischen Update:', error)
      throw error
    }
  }

  /**
   * POST /api/legal-data/updates/sync/:sourceName
   * Synchronisiert eine spezifische Quelle
   */
  async syncSource(req: Request, res: Response): Promise<void> {
    try {
      const { sourceName } = req.params

      const result = await this.updateService.syncSource(sourceName)

      res.json({
        success: result.success,
        data: result,
        message: `${sourceName} erfolgreich synchronisiert`
      })
    } catch (error) {
      logger.error('Fehler beim Synchronisieren:', error)
      throw error
    }
  }

  /**
   * GET /api/legal-data/updates/sources
   * Ruft Update-Quellen ab
   */
  async getUpdateSources(req: Request, res: Response): Promise<void> {
    try {
      const sources = this.updateService.getUpdateSources()

      res.json({
        success: true,
        data: sources
      })
    } catch (error) {
      logger.error('Fehler beim Abrufen der Update-Quellen:', error)
      throw error
    }
  }

  /**
   * PUT /api/legal-data/updates/sources/:sourceName
   * Aktiviert/Deaktiviert eine Update-Quelle
   */
  async toggleUpdateSource(req: Request, res: Response): Promise<void> {
    try {
      const { sourceName } = req.params
      const { enabled } = req.body

      this.updateService.toggleUpdateSource(sourceName, enabled)

      res.json({
        success: true,
        message: `Update-Quelle ${sourceName} ${enabled ? 'aktiviert' : 'deaktiviert'}`
      })
    } catch (error) {
      logger.error('Fehler beim Umschalten der Update-Quelle:', error)
      throw error
    }
  }

  /**
   * GET /api/legal-data/outdated
   * Findet veraltete Rechtsdaten
   */
  async findOutdated(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanDays } = req.query
      const days = parseInt(olderThanDays as string) || 365

      const outdated = await this.updateService.findOutdatedData(days)

      res.json({
        success: true,
        data: outdated,
        message: `${outdated.length} veraltete Einträge gefunden`
      })
    } catch (error) {
      logger.error('Fehler beim Suchen veralteter Daten:', error)
      throw error
    }
  }
}
