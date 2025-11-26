import { PrismaClient } from '@prisma/client'
import { MietspiegelService, ApartmentDetails } from '../services/MietspiegelService'

// Mock Redis
jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    getClient: () => ({
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
    }),
  },
}))

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
  loggers: {
    businessEvent: jest.fn(),
  },
}))

describe('MietspiegelService Unit Tests', () => {
  let mietspiegelService: MietspiegelService
  let prismaMock: jest.Mocked<PrismaClient>

  beforeEach(() => {
    // Mock Prisma Client
    prismaMock = {
      mietspiegelData: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        upsert: jest.fn(),
      },
    } as any

    mietspiegelService = new MietspiegelService(prismaMock)
  })

  describe('getMietspiegelData', () => {
    it('sollte Mietspiegel-Daten für eine Stadt abrufen', async () => {
      const mockData = {
        id: '1',
        city: 'Berlin',
        year: 2024,
        averageRent: 12.50,
        rentRanges: [
          {
            minRent: 8.00,
            maxRent: 15.00,
            category: 'standard',
            conditions: ['normal']
          }
        ],
        specialRegulations: ['Mietpreisbremse'],
        lastUpdated: new Date()
      }

      prismaMock.mietspiegelData.findUnique.mockResolvedValue(mockData)

      const result = await mietspiegelService.getMietspiegelData('Berlin', 2024)

      expect(result).toEqual(mockData)
      expect(prismaMock.mietspiegelData.findUnique).toHaveBeenCalledWith({
        where: {
          city_year: {
            city: 'Berlin',
            year: 2024
          }
        }
      })
    })

    it('sollte null zurückgeben, wenn keine Daten gefunden werden', async () => {
      prismaMock.mietspiegelData.findUnique.mockResolvedValue(null)
      prismaMock.mietspiegelData.findFirst.mockResolvedValue(null)

      const result = await mietspiegelService.getMietspiegelData('UnbekannteStadt')

      expect(result).toBeNull()
    })
  })

  describe('calculateRentRange', () => {
    const validApartmentDetails: ApartmentDetails = {
      size: 75,
      rooms: 3,
      constructionYear: 2010,
      condition: 'good',
      location: 'central'
    }

    it('sollte Mietpreis-Range korrekt berechnen', async () => {
      const mockMietspiegelData = {
        id: '1',
        city: 'Berlin',
        year: 2024,
        averageRent: 12.50,
        rentRanges: [
          {
            minRent: 10.00,
            maxRent: 15.00,
            category: 'standard',
            conditions: ['normal']
          }
        ],
        specialRegulations: ['Mietpreisbremse'],
        lastUpdated: new Date()
      }

      prismaMock.mietspiegelData.findUnique.mockResolvedValue(mockMietspiegelData)

      const result = await mietspiegelService.calculateRentRange('Berlin', validApartmentDetails)

      expect(result).toHaveProperty('city', 'Berlin')
      expect(result).toHaveProperty('calculatedRent')
      expect(result.calculatedRent).toHaveProperty('min')
      expect(result.calculatedRent).toHaveProperty('max')
      expect(result.calculatedRent).toHaveProperty('average')
      expect(result.calculatedRent).toHaveProperty('recommended')
      expect(result).toHaveProperty('factors')
      expect(result).toHaveProperty('recommendations')
    })

    it('sollte Fehler werfen bei ungültigen Wohnungsdetails', async () => {
      const invalidDetails: ApartmentDetails = {
        size: -10, // Ungültige Größe
        rooms: 0   // Ungültige Zimmeranzahl
      }

      await expect(
        mietspiegelService.calculateRentRange('Berlin', invalidDetails)
      ).rejects.toThrow('Wohnungsgröße muss größer als 0 sein')
    })

    it('sollte Fehler werfen, wenn keine Mietspiegel-Daten verfügbar sind', async () => {
      prismaMock.mietspiegelData.findUnique.mockResolvedValue(null)
      prismaMock.mietspiegelData.findFirst.mockResolvedValue(null)

      await expect(
        mietspiegelService.calculateRentRange('UnbekannteStadt', validApartmentDetails)
      ).rejects.toThrow('Keine Mietspiegel-Daten für UnbekannteStadt verfügbar')
    })
  })

  describe('getLocalRegulations', () => {
    it('sollte lokale Bestimmungen für Berlin zurückgeben', async () => {
      const result = await mietspiegelService.getLocalRegulations('Berlin')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      const rentBrake = result.find(reg => reg.type === 'rent_brake')
      expect(rentBrake).toBeDefined()
      expect(rentBrake?.title).toContain('Mietpreisbremse')
    })

    it('sollte leeres Array für unbekannte Stadt zurückgeben', async () => {
      const result = await mietspiegelService.getLocalRegulations('UnbekannteStadt')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('compareMietWithMietspiegel', () => {
    const validApartmentDetails: ApartmentDetails = {
      size: 75,
      rooms: 3,
      condition: 'good'
    }

    it('sollte Mietvergleich korrekt durchführen', async () => {
      const mockMietspiegelData = {
        id: '1',
        city: 'Berlin',
        year: 2024,
        averageRent: 12.50,
        rentRanges: [
          {
            minRent: 10.00,
            maxRent: 15.00,
            category: 'standard',
            conditions: ['normal']
          }
        ],
        specialRegulations: [],
        lastUpdated: new Date()
      }

      prismaMock.mietspiegelData.findUnique.mockResolvedValue(mockMietspiegelData)

      const result = await mietspiegelService.compareMietWithMietspiegel(
        'Berlin',
        1000,
        validApartmentDetails
      )

      expect(result).toHaveProperty('comparison')
      expect(['below', 'within', 'above']).toContain(result.comparison)
      expect(result).toHaveProperty('deviation')
      expect(result).toHaveProperty('percentageDeviation')
      expect(result).toHaveProperty('recommendation')
      expect(typeof result.recommendation).toBe('string')
    })
  })

  describe('getAvailableCities', () => {
    it('sollte verfügbare Städte mit Informationen zurückgeben', async () => {
      const mockGroupByResult = [
        {
          city: 'Berlin',
          _count: { year: 2 },
          _max: { year: 2024, lastUpdated: new Date() }
        }
      ]

      const mockCityData = [
        { year: 2023 },
        { year: 2024 }
      ]

      prismaMock.mietspiegelData.groupBy.mockResolvedValue(mockGroupByResult as any)
      prismaMock.mietspiegelData.findMany.mockResolvedValue(mockCityData as any)

      const result = await mietspiegelService.getAvailableCities()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      const berlinCity = result.find(city => city.city === 'Berlin')
      expect(berlinCity).toBeDefined()
      expect(berlinCity).toHaveProperty('availableYears')
      expect(berlinCity).toHaveProperty('currentYear')
      expect(berlinCity).toHaveProperty('dataQuality')
      expect(berlinCity).toHaveProperty('coverage')
    })
  })

  describe('updateMietspiegelData', () => {
    it('sollte Mietspiegel-Daten erfolgreich aktualisieren', async () => {
      const updateData = {
        city: 'TestStadt',
        year: 2024,
        averageRent: 10.00,
        rentRanges: [
          {
            minRent: 8.00,
            maxRent: 12.00,
            category: 'standard',
            conditions: ['normal']
          }
        ],
        specialRegulations: ['Test-Bestimmung'],
        dataSource: 'Test-Quelle',
        lastUpdated: new Date()
      }

      const mockUpdatedData = {
        id: '1',
        ...updateData
      }

      prismaMock.mietspiegelData.upsert.mockResolvedValue(mockUpdatedData as any)

      const result = await mietspiegelService.updateMietspiegelData(updateData)

      expect(result).toEqual(mockUpdatedData)
      expect(prismaMock.mietspiegelData.upsert).toHaveBeenCalledWith({
        where: {
          city_year: {
            city: 'TestStadt',
            year: 2024
          }
        },
        update: expect.objectContaining({
          averageRent: 10.00,
          rentRanges: updateData.rentRanges,
          specialRegulations: updateData.specialRegulations
        }),
        create: expect.objectContaining({
          city: 'TestStadt',
          year: 2024,
          averageRent: 10.00
        })
      })
    })

    it('sollte Validierungsfehler für ungültige Daten werfen', async () => {
      const invalidUpdateData = {
        city: '', // Leere Stadt
        year: 1999, // Ungültiges Jahr
        averageRent: -5, // Negative Miete
        rentRanges: [], // Leeres Array
        specialRegulations: [],
        dataSource: 'Test',
        lastUpdated: new Date()
      }

      await expect(
        mietspiegelService.updateMietspiegelData(invalidUpdateData)
      ).rejects.toThrow('Stadt ist erforderlich')
    })
  })
})