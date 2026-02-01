/**
 * AI Service
 * 
 * This service provides a unified interface for all AI functionality in the SmartLaw Mietrecht application.
 * It manages the different AI models and provides methods for training, prediction, and evaluation.
 */

import { DecisionPredictionModel } from '../models/decisionPrediction';
import { RentPricePredictionModel } from '../models/rentPricePrediction';
import { LegalChangePredictionModel } from '../models/legalChangePrediction';
import { LegalPrecedentPredictor } from '../models/legalPrecedentPredictor';
import { ComplianceRiskAssessmentModel } from '../models/complianceRiskAssessment';
import { 
  CaseData, 
  PredictionResult, 
  RentPriceData, 
  RentPricePrediction, 
  LegalChangeData, 
  LegalChangePrediction,
  LegalDocument,
  PrecedentPrediction,
  ComplianceRisk,
  RiskAssessment
} from '../types';

/**
 * AI Service Class
 */
export class AIService {
  private decisionModel: DecisionPredictionModel;
  private rentPriceModel: RentPricePredictionModel;
  private legalChangeModel: LegalChangePredictionModel;
  private precedentPredictor: LegalPrecedentPredictor;
  private complianceRiskModel: ComplianceRiskAssessmentModel;
  private isInitialized: boolean = false;

  constructor() {
    this.decisionModel = new DecisionPredictionModel();
    this.rentPriceModel = new RentPricePredictionModel();
    this.legalChangeModel = new LegalChangePredictionModel();
    this.precedentPredictor = new LegalPrecedentPredictor();
    this.complianceRiskModel = new ComplianceRiskAssessmentModel();
  }

  /**
   * Initialize all AI models
   */
  async initialize(): Promise<void> {
    try {
      this.decisionModel.initializeModel();
      this.rentPriceModel.initializeModel();
      this.legalChangeModel.initializeModel();
      this.precedentPredictor.initializeModel();
      this.complianceRiskModel.initializeModel();
      
      this.isInitialized = true;
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  /**
   * Train the decision prediction model
   */
  async trainDecisionModel(data: CaseData[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.decisionModel.train(data);
      console.log('Decision prediction model trained successfully');
    } catch (error) {
      console.error('Failed to train decision prediction model:', error);
      throw error;
    }
  }

  /**
   * Predict court decision for a case
   */
  async predictDecision(caseData: CaseData): Promise<PredictionResult> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const prediction = await this.decisionModel.predict(caseData);
      return prediction;
    } catch (error) {
      console.error('Failed to predict decision:', error);
      throw error;
    }
  }

  /**
   * Train the rent price prediction model
   */
  async trainRentPriceModel(data: RentPriceData[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.rentPriceModel.train(data);
      console.log('Rent price prediction model trained successfully');
    } catch (error) {
      console.error('Failed to train rent price prediction model:', error);
      throw error;
    }
  }

  /**
   * Predict rent price for a property
   */
  async predictRentPrice(propertyData: RentPriceData): Promise<RentPricePrediction> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const prediction = await this.rentPriceModel.predict(propertyData);
      return prediction;
    } catch (error) {
      console.error('Failed to predict rent price:', error);
      throw error;
    }
  }

  /**
   * Train the legal change prediction model
   */
  async trainLegalChangeModel(data: LegalChangeData[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.legalChangeModel.train(data);
      console.log('Legal change prediction model trained successfully');
    } catch (error) {
      console.error('Failed to train legal change prediction model:', error);
      throw error;
    }
  }

  /**
   * Predict legal change for a law
   */
  async predictLegalChange(lawData: LegalChangeData): Promise<LegalChangePrediction> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const prediction = await this.legalChangeModel.predict(lawData);
      return prediction;
    } catch (error) {
      console.error('Failed to predict legal change:', error);
      throw error;
    }
  }

  /**
   * Train the legal precedent predictor model
   */
  async trainPrecedentPredictor(data: CaseData[], documents: LegalDocument[][]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      // For each case, we need to extract the precedent outcome
      const precedentData = data.map(caseData => ({
        ...caseData,
        precedentOutcome: caseData.decisionOutcome // Use decision outcome as precedent outcome
      }));

      await this.precedentPredictor.train(precedentData, documents);
      console.log('Legal precedent predictor model trained successfully');
    } catch (error) {
      console.error('Failed to train legal precedent predictor model:', error);
      throw error;
    }
  }

  /**
   * Predict legal precedent for a case with supporting documents
   */
  async predictPrecedent(caseData: CaseData, documents: LegalDocument[]): Promise<PrecedentPrediction> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const prediction = await this.precedentPredictor.predict(caseData, documents);
      return prediction;
    } catch (error) {
      console.error('Failed to predict legal precedent:', error);
      throw error;
    }
  }

  /**
   * Train the compliance risk assessment model
   */
  async trainComplianceRiskModel(data: ComplianceRisk[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.complianceRiskModel.train(data);
      console.log('Compliance risk assessment model trained successfully');
    } catch (error) {
      console.error('Failed to train compliance risk assessment model:', error);
      throw error;
    }
  }

  /**
   * Assess compliance risk for a case
   */
  async assessComplianceRisk(riskData: ComplianceRisk): Promise<RiskAssessment> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const assessment = await this.complianceRiskModel.assessRisk(riskData);
      return assessment;
    } catch (error) {
      console.error('Failed to assess compliance risk:', error);
      throw error;
    }
  }

  /**
   * Save all trained models
   */
  async saveModels(basePath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.decisionModel.saveModel(`${basePath}/decision-model`);
      await this.rentPriceModel.saveModel(`${basePath}/rent-price-model`);
      await this.legalChangeModel.saveModel(`${basePath}/legal-change-model`);
      await this.precedentPredictor.saveModel(`${basePath}/precedent-predictor`);
      await this.complianceRiskModel.saveModel(`${basePath}/compliance-risk-model`);
      console.log('All models saved successfully');
    } catch (error) {
      console.error('Failed to save models:', error);
      throw error;
    }
  }

  /**
   * Load all trained models
   */
  async loadModels(basePath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      await this.decisionModel.loadModel(`${basePath}/decision-model`);
      await this.rentPriceModel.loadModel(`${basePath}/rent-price-model`);
      await this.legalChangeModel.loadModel(`${basePath}/legal-change-model`);
      await this.precedentPredictor.loadModel(`${basePath}/precedent-predictor`);
      await this.complianceRiskModel.loadModel(`${basePath}/compliance-risk-model`);
      console.log('All models loaded successfully');
    } catch (error) {
      console.error('Failed to load models:', error);
      throw error;
    }
  }

  /**
   * Evaluate all models
   */
  async evaluateModels(testData: {
    cases: CaseData[];
    rentPrices: RentPriceData[];
    legalChanges: LegalChangeData[];
    precedents: {
      cases: CaseData[];
      documents: LegalDocument[][];
    };
    complianceRisks: ComplianceRisk[];
  }): Promise<{
    decisionModel: { loss: number, accuracy: number };
    rentPriceModel: { loss: number, mae: number, mape: number };
    legalChangeModel: { loss: number, accuracy: number };
    precedentPredictor: { loss: number, accuracy: number };
    complianceRiskModel: { loss: number, accuracy: number };
  }> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized. Please call initialize() first.');
    }

    try {
      const decisionEvaluation = await this.decisionModel.evaluate(testData.cases);
      const rentPriceEvaluation = await this.rentPriceModel.evaluate(testData.rentPrices);
      const legalChangeEvaluation = await this.legalChangeModel.evaluate(testData.legalChanges);
      
      // For precedent predictor, we need to prepare the data
      const precedentCases = testData.precedents.cases.map(caseData => ({
        ...caseData,
        precedentOutcome: caseData.decisionOutcome
      }));
      
      const precedentEvaluation = await this.precedentPredictor.evaluate(precedentCases, testData.precedents.documents);
      const complianceRiskEvaluation = await this.complianceRiskModel.evaluate(testData.complianceRisks);

      return {
        decisionModel: decisionEvaluation,
        rentPriceModel: rentPriceEvaluation,
        legalChangeModel: legalChangeEvaluation,
        precedentPredictor: precedentEvaluation,
        complianceRiskModel: complianceRiskEvaluation
      };
    } catch (error) {
      console.error('Failed to evaluate models:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the status of all models
   */
  getModelStatus(): {
    decisionModelTrained: boolean;
    rentPriceModelTrained: boolean;
    legalChangeModelTrained: boolean;
    precedentPredictorTrained: boolean;
    complianceRiskModelTrained: boolean;
  } {
    return {
      decisionModelTrained: (this.decisionModel as any).isTrained || false,
      rentPriceModelTrained: (this.rentPriceModel as any).isTrained || false,
      legalChangeModelTrained: (this.legalChangeModel as any).isTrained || false,
      precedentPredictorTrained: (this.precedentPredictor as any).isTrained || false,
      complianceRiskModelTrained: (this.complianceRiskModel as any).isTrained || false
    };
  }
}