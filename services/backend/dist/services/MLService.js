"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLService = void 0;
const LegalDecisionPredictor_1 = require("../ml/LegalDecisionPredictor");
const DecisionCategorizer_1 = require("../ml/DecisionCategorizer");
const PersonalizedRecommender_1 = require("../ml/PersonalizedRecommender");
const logger_1 = require("../utils/logger");
class MLService {
    constructor(prisma) {
        this.isInitialized = false;
        this.prisma = prisma;
        this.decisionPredictor = new LegalDecisionPredictor_1.LegalDecisionPredictor(prisma);
        this.decisionCategorizer = new DecisionCategorizer_1.DecisionCategorizer(prisma);
        this.personalizedRecommender = new PersonalizedRecommender_1.PersonalizedRecommender(prisma);
        this.isInitialized = true;
    }
    /**
     * Initialisiert alle ML-Komponenten
     */
    async initialize() {
        try {
            logger_1.logger.info('Initializing ML service components...');
            // Bei der regelbasierten Implementierung ist keine explizite Initialisierung erforderlich
            this.isInitialized = true;
            logger_1.logger.info('ML service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Error initializing ML service:', error);
            throw new Error('Failed to initialize ML service');
        }
    }
    /**
     * Sagt das Ergebnis eines Falls voraus
     */
    async predictCaseOutcome(caseData) {
        try {
            if (!this.isInitialized) {
                throw new Error('ML service not initialized');
            }
            const prediction = await this.decisionPredictor.predictOutcome(caseData);
            return prediction;
        }
        catch (error) {
            logger_1.logger.error('Error predicting case outcome:', error);
            throw new Error('Failed to predict case outcome');
        }
    }
    /**
     * Kategorisiert ein Dokument
     */
    async categorizeDocument(document) {
        try {
            if (!this.isInitialized) {
                throw new Error('ML service not initialized');
            }
            const categorization = await this.decisionCategorizer.categorizeDocument(document);
            return categorization;
        }
        catch (error) {
            logger_1.logger.error('Error categorizing document:', error);
            throw new Error('Failed to categorize document');
        }
    }
    /**
     * Generiert personalisierte Empfehlungen für einen Anwalt
     */
    async recommendCasesForLawyer(lawyerId, limit = 10) {
        try {
            if (!this.isInitialized) {
                throw new Error('ML service not initialized');
            }
            const recommendations = await this.personalizedRecommender.recommendCases(lawyerId, limit);
            return recommendations;
        }
        catch (error) {
            logger_1.logger.error('Error generating recommendations:', error);
            throw new Error('Failed to generate recommendations');
        }
    }
    /**
     * Aktualisiert das Empfehlungsmodell basierend auf einer Interaktion
     */
    async updateRecommendationModel(interaction) {
        try {
            if (!this.isInitialized) {
                throw new Error('ML service not initialized');
            }
            // Bei der regelbasierten Implementierung ist kein Modell-Update erforderlich
            logger_1.logger.info('Recommendation model update skipped for rule-based implementation');
        }
        catch (error) {
            logger_1.logger.error('Error updating recommendation model:', error);
            throw new Error('Failed to update recommendation model');
        }
    }
    /**
     * Speichert alle Modelle
     */
    async saveModels(basePath) {
        try {
            if (!this.isInitialized) {
                throw new Error('ML service not initialized');
            }
            // Bei der regelbasierten Implementierung ist kein Modell-Speichern erforderlich
            logger_1.logger.info('Model saving skipped for rule-based implementation');
        }
        catch (error) {
            logger_1.logger.error('Error saving models:', error);
            throw new Error('Failed to save models');
        }
    }
    /**
     * Lädt alle Modelle
     */
    async loadModels(basePath) {
        try {
            // Bei der regelbasierten Implementierung ist kein Modell-Laden erforderlich
            this.isInitialized = true;
            logger_1.logger.info('Model loading skipped for rule-based implementation');
        }
        catch (error) {
            logger_1.logger.error('Error loading models:', error);
            throw new Error('Failed to load models');
        }
    }
}
exports.MLService = MLService;
