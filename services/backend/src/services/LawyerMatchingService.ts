import { PrismaClient, Lawyer } from '@prisma/client';
import { logger, loggers } from '../utils/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface LawyerSearchCriteria {
  location?: string;
  specializations?: string[];
  maxDistance?: number; // in km
  minRating?: number;
  languages?: string[];
  availableFrom?: Date;
  availableTo?: Date;
  maxHourlyRate?: number;
}

export interface LawyerProfile extends Lawyer {
  distance?: number;
  availableSlots?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
  reviewSummary?: {
    averageRating: number;
    totalReviews: number;
    recentReviews: Array<{
      rating: number;
      comment: string;
      createdAt: Date;
    }>;
  };
}

export interface MatchScore {
  lawyerId: string;
  score: number;
  reasons: string[];
}

export class LawyerMatchingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sucht Anwälte basierend auf Kriterien
   */
  async searchLawyers(
    criteria: LawyerSearchCriteria,
    page: number = 1,
    limit: number = 10
  ): Promise<{ lawyers: LawyerProfile[]; total: number; page: number; totalPages: number }> {
    try {
      logger.info('Searching for lawyers', { criteria, page, limit });

      const skip = (page - 1) * limit;

      // Baue Where-Clause
      const where: any = {
        isActive: true,
        verified: true
      };

      if (criteria.specializations && criteria.specializations.length > 0) {
        where.specializations = {
          hasSome: criteria.specializations
        };
      }

      if (criteria.languages && criteria.languages.length > 0) {
        where.languages = {
          hasSome: criteria.languages
        };
      }

      if (criteria.minRating) {
        where.rating = {
          gte: criteria.minRating
        };
      }

      if (criteria.maxHourlyRate) {
        where.hourlyRate = {
          lte: criteria.maxHourlyRate
        };
      }

      // Hole Anwälte
      const [lawyers, total] = await Promise.all([
        this.prisma.lawyer.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { rating: 'desc' },
            { reviewCount: 'desc' }
          ],
          include: {
            availableSlots: {
              where: {
                available: true,
                startTime: {
                  gte: criteria.availableFrom || new Date()
                },
                ...(criteria.availableTo && {
                  endTime: {
                    lte: criteria.availableTo
                  }
                })
              },
              orderBy: {
                startTime: 'asc'
              },
              take: 5
            },
            reviews: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 3
            }
          }
        }),
        this.prisma.lawyer.count({ where })
      ]);

      // Berechne Distanzen wenn Standort angegeben
      const enrichedLawyers = await Promise.all(
        lawyers.map(async (lawyer) => {
          const profile: LawyerProfile = {
            ...lawyer,
            availableSlots: lawyer.availableSlots.map(slot => ({
              id: slot.id,
              startTime: slot.startTime,
              endTime: slot.endTime
            })),
            reviewSummary: {
              averageRating: lawyer.rating,
              totalReviews: lawyer.reviewCount,
              recentReviews: lawyer.reviews.map(review => ({
                rating: review.rating,
                comment: review.comment || '',
                createdAt: review.createdAt
              }))
            }
          };

          if (criteria.location) {
            profile.distance = await this.calculateDistance(
              criteria.location,
              lawyer.location
            );
          }

          return profile;
        })
      );

      // Filtere nach Distanz wenn angegeben
      let filteredLawyers = enrichedLawyers;
      if (criteria.maxDistance) {
        filteredLawyers = enrichedLawyers.filter(
          lawyer => !lawyer.distance || lawyer.distance <= criteria.maxDistance!
        );
      }

      // Sortiere nach Distanz wenn Standort angegeben
      if (criteria.location) {
        filteredLawyers.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      }

      loggers.businessEvent('LAWYERS_SEARCHED', '', {
        criteriaCount: Object.keys(criteria).length,
        resultsCount: filteredLawyers.length
      });

      return {
        lawyers: filteredLawyers,
        total: filteredLawyers.length,
        page,
        totalPages: Math.ceil(filteredLawyers.length / limit)
      };
    } catch (error) {
      logger.error('Error searching lawyers:', error);
      throw error;
    }
  }

  /**
   * Findet die besten Matches für einen Fall
   */
  async findBestMatches(
    caseDescription: string,
    userLocation: string,
    limit: number = 5
  ): Promise<LawyerProfile[]> {
    try {
      logger.info('Finding best lawyer matches', { userLocation, limit });

      // Extrahiere Spezialisierungen aus Fallbeschreibung
      const specializations = this.extractSpecializations(caseDescription);

      // Suche Anwälte
      const { lawyers } = await this.searchLawyers({
        location: userLocation,
        specializations,
        maxDistance: 50, // 50 km Radius
        minRating: 3.5
      }, 1, limit * 2);

      // Berechne Match-Scores
      const scoredLawyers = lawyers.map(lawyer => ({
        lawyer,
        score: this.calculateMatchScore(lawyer, {
          specializations,
          location: userLocation,
          caseDescription
        })
      }));

      // Sortiere nach Score
      scoredLawyers.sort((a, b) => b.score.score - a.score.score);

      // Gib Top-Matches zurück
      return scoredLawyers.slice(0, limit).map(item => item.lawyer);
    } catch (error) {
      logger.error('Error finding best matches:', error);
      throw error;
    }
  }

  /**
   * Berechnet Match-Score für einen Anwalt
   */
  private calculateMatchScore(
    lawyer: LawyerProfile,
    criteria: {
      specializations: string[];
      location: string;
      caseDescription: string;
    }
  ): MatchScore {
    let score = 0;
    const reasons: string[] = [];

    // Spezialisierung (40 Punkte)
    const matchingSpecs = lawyer.specializations.filter(spec =>
      criteria.specializations.includes(spec)
    );
    const specScore = (matchingSpecs.length / Math.max(criteria.specializations.length, 1)) * 40;
    score += specScore;
    if (matchingSpecs.length > 0) {
      reasons.push(`Spezialisierung: ${matchingSpecs.join(', ')}`);
    }

    // Bewertung (30 Punkte)
    const ratingScore = (lawyer.rating / 5) * 30;
    score += ratingScore;
    if (lawyer.rating >= 4.5) {
      reasons.push(`Hervorragende Bewertung: ${lawyer.rating.toFixed(1)}/5`);
    }

    // Verfügbarkeit (15 Punkte)
    if (lawyer.availableSlots && lawyer.availableSlots.length > 0) {
      score += 15;
      reasons.push(`${lawyer.availableSlots.length} verfügbare Termine`);
    }

    // Distanz (15 Punkte)
    if (lawyer.distance !== undefined) {
      const distanceScore = Math.max(0, 15 - (lawyer.distance / 10));
      score += distanceScore;
      if (lawyer.distance < 10) {
        reasons.push(`Sehr nah: ${lawyer.distance.toFixed(1)} km`);
      }
    }

    return {
      lawyerId: lawyer.id,
      score: Math.round(score),
      reasons
    };
  }

  /**
   * Extrahiert Spezialisierungen aus Fallbeschreibung
   */
  private extractSpecializations(description: string): string[] {
    const specializations: string[] = [];
    const lowerDesc = description.toLowerCase();

    const keywords: Record<string, string> = {
      'mietminderung': 'Mietminderung',
      'kündigung': 'Kündigungsschutz',
      'nebenkosten': 'Nebenkostenabrechnung',
      'mieterhöhung': 'Mieterhöhung',
      'schimmel': 'Mängel und Schäden',
      'mangel': 'Mängel und Schäden',
      'modernisierung': 'Modernisierung',
      'kaution': 'Kaution',
      'betriebskosten': 'Nebenkostenabrechnung'
    };

    Object.entries(keywords).forEach(([keyword, specialization]) => {
      if (lowerDesc.includes(keyword) && !specializations.includes(specialization)) {
        specializations.push(specialization);
      }
    });

    // Fallback: Allgemeines Mietrecht
    if (specializations.length === 0) {
      specializations.push('Mietrecht allgemein');
    }

    return specializations;
  }

  /**
   * Berechnet Distanz zwischen zwei Standorten (vereinfacht)
   */
  private async calculateDistance(location1: string, location2: string): Promise<number> {
    // Vereinfachte Implementierung
    // In Produktion würde hier eine Geocoding-API verwendet werden
    
    // Extrahiere PLZ
    const plz1 = this.extractPostalCode(location1);
    const plz2 = this.extractPostalCode(location2);

    if (!plz1 || !plz2) {
      return 999; // Unbekannte Distanz
    }

    // Vereinfachte Distanzberechnung basierend auf PLZ-Differenz
    const diff = Math.abs(parseInt(plz1) - parseInt(plz2));
    
    // Grobe Schätzung: 1 PLZ-Punkt ≈ 2 km
    return diff * 2;
  }

  /**
   * Extrahiert Postleitzahl aus Adresse
   */
  private extractPostalCode(location: string): string | null {
    const match = location.match(/\b(\d{5})\b/);
    return match ? match[1] : null;
  }

  /**
   * Holt Anwaltsprofil mit Details
   */
  async getLawyerProfile(lawyerId: string): Promise<LawyerProfile | null> {
    try {
      const lawyer = await this.prisma.lawyer.findUnique({
        where: { id: lawyerId },
        include: {
          availableSlots: {
            where: {
              available: true,
              startTime: {
                gte: new Date()
              }
            },
            orderBy: {
              startTime: 'asc'
            }
          },
          reviews: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!lawyer) {
        return null;
      }

      return {
        ...lawyer,
        availableSlots: lawyer.availableSlots.map(slot => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime
        })),
        reviewSummary: {
          averageRating: lawyer.rating,
          totalReviews: lawyer.reviewCount,
          recentReviews: lawyer.reviews.map(review => ({
            rating: review.rating,
            comment: review.comment || '',
            createdAt: review.createdAt
          }))
        }
      };
    } catch (error) {
      logger.error('Error getting lawyer profile:', error);
      throw error;
    }
  }

  /**
   * Fügt Bewertung für Anwalt hinzu
   */
  async addReview(
    lawyerId: string,
    userId: string,
    bookingId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // Prüfe ob Buchung existiert und abgeschlossen ist
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'COMPLETED') {
        throw new ValidationError('Can only review completed bookings');
      }

      if (booking.userId !== userId) {
        throw new ValidationError('Can only review your own bookings');
      }

      // Prüfe ob bereits bewertet
      const existingReview = await this.prisma.lawyerReview.findUnique({
        where: { bookingId }
      });

      if (existingReview) {
        throw new ValidationError('Booking already reviewed');
      }

      // Erstelle Review
      await this.prisma.lawyerReview.create({
        data: {
          lawyerId,
          userId,
          bookingId,
          rating,
          comment
        }
      });

      // Aktualisiere Anwalts-Rating
      await this.updateLawyerRating(lawyerId);

      loggers.businessEvent('LAWYER_REVIEWED', userId, {
        lawyerId,
        rating,
        bookingId
      });
    } catch (error) {
      logger.error('Error adding review:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert durchschnittliche Bewertung eines Anwalts
   */
  private async updateLawyerRating(lawyerId: string): Promise<void> {
    try {
      const reviews = await this.prisma.lawyerReview.findMany({
        where: { lawyerId },
        select: { rating: true }
      });

      if (reviews.length === 0) {
        return;
      }

      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await this.prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          rating: averageRating,
          reviewCount: reviews.length
        }
      });
    } catch (error) {
      logger.error('Error updating lawyer rating:', error);
      throw error;
    }
  }

  /**
   * Empfiehlt Anwalt basierend auf Fall-Risiko
   */
  async recommendLawyerForCase(
    caseId: string,
    userId: string
  ): Promise<{ shouldRecommend: boolean; reason: string; lawyers?: LawyerProfile[] }> {
    try {
      // Hole Fall-Details
      const caseData = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      let shouldRecommend = false;
      let reason = '';

      // Prüfe Empfehlungskriterien
      if (caseData.category === 'TERMINATION') {
        shouldRecommend = true;
        reason = 'Kündigungen erfordern professionelle rechtliche Beratung';
      } else if (caseData.priority === 'HIGH') {
        shouldRecommend = true;
        reason = 'Hohe Priorität des Falls';
      }

      // Wenn Empfehlung, finde passende Anwälte
      let lawyers: LawyerProfile[] | undefined;
      if (shouldRecommend) {
        const userLocation = caseData.user.profile?.location || 'Deutschland';
        lawyers = await this.findBestMatches(
          caseData.description || '',
          userLocation,
          3
        );
      }

      return {
        shouldRecommend,
        reason,
        lawyers
      };
    } catch (error) {
      logger.error('Error recommending lawyer:', error);
      throw error;
    }
  }
}
