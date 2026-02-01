import { PrismaClient } from '@prisma/client';
import { LegalDecisionPredictor } from '../ml/LegalDecisionPredictor';
import { DecisionCategorizer } from '../ml/DecisionCategorizer';
import { PersonalizedRecommender } from '../ml/PersonalizedRecommender';
import { logger } from '../utils/logger';

export class MLService {
  private prisma: PrismaClient;
  private decisionPredictor: LegalDecisionPredictor;
  private decisionCategorizer: DecisionCategorizer;
  private personalizedRecommender: PersonalizedRecommender;
  private isInitialized: boolean = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.decisionPredictor = new LegalDecisionPredictor(prisma);
    this.decisionCategorizer = new DecisionCategorizer(prisma);
    this.personalizedRecommender = new PersonalizedRecommender(prisma);
    this.isInitialized = true;
  }

  /**
   * Initialisiert alle ML-Komponenten
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing ML service components...');
      
      // Bei der regelbasierten Implementierung ist keine explizite Initialisierung erforderlich
      this.isInitialized = true;
      logger.info('ML service initialized successfully');
    } catch (error) {
      logger.error('Error initializing ML service:', error);
      throw new Error('Failed to initialize ML service');
    }
  }

  /**
   * Sagt das Ergebnis eines Falls voraus
   */
  async predictCaseOutcome(caseData: any): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML service not initialized');
      }
      
      const prediction = await this.decisionPredictor.predictOutcome(caseData);
      return prediction;
    } catch (error) {
      logger.error('Error predicting case outcome:', error);
      throw new Error('Failed to predict case outcome');
    }
  }

  /**
   * Kategorisiert ein Dokument
   */
  async categorizeDocument(document: any): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML service not initialized');
      }
      
      const categorization = await this.decisionCategorizer.categorizeDocument(document);
      return categorization;
    } catch (error) {
      logger.error('Error categorizing document:', error);
      throw new Error('Failed to categorize document');
    }
  }

  /**
   * Generiert personalisierte Empfehlungen für einen Anwalt
   */
  async recommendCasesForLawyer(lawyerId: string, limit: number = 10): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML service not initialized');
      }
      
      const recommendations = await this.personalizedRecommender.recommendCases(lawyerId, limit);
      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Aktualisiert das Empfehlungsmodell basierend auf einer Interaktion
   */
  async updateRecommendationModel(interaction: { lawyerId: string; caseId: string; rating: number }): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML service not initialized');
      }
      
      // Bei der regelbasierten Implementierung ist kein Modell-Update erforderlich
      logger.info('Recommendation model update skipped for rule-based implementation');
    } catch (error) {
      logger.error('Error updating recommendation model:', error);
      throw new Error('Failed to update recommendation model');
    }
  }

  /**
   * Speichert alle Modelle
   */
  async saveModels(basePath: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML service not initialized');
      }
      
      // Bei der regelbasierten Implementierung ist kein Modell-Speichern erforderlich
      logger.info('Model saving skipped for rule-based implementation');
    } catch (error) {
      logger.error('Error saving models:', error);
      throw new Error('Failed to save models');
    }
  }

  /**
   * Lädt alle Modelle
   */
  async loadModels(basePath: string): Promise<void> {
    try {
      // Bei der regelbasierten Implementierung ist kein Modell-Laden erforderlich
      this.isInitialized = true;
      logger.info('Model loading skipped for rule-based implementation');
    } catch (error) {
      logger.error('Error loading models:', error);
      throw new Error('Failed to load models');
    }
  }
}