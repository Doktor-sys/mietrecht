/**
 * AI Service
 *
 * This service provides a unified interface for all AI functionality in the SmartLaw Mietrecht application.
 * It manages the different AI models and provides methods for training, prediction, and evaluation.
 */
import { CaseData, PredictionResult, RentPriceData, RentPricePrediction, LegalChangeData, LegalChangePrediction, LegalDocument, PrecedentPrediction, ComplianceRisk, RiskAssessment } from '../types';
/**
 * AI Service Class
 */
export declare class AIService {
    private decisionModel;
    private rentPriceModel;
    private legalChangeModel;
    private precedentPredictor;
    private complianceRiskModel;
    private isInitialized;
    constructor();
    /**
     * Initialize all AI models
     */
    initialize(): Promise<void>;
    /**
     * Train the decision prediction model
     */
    trainDecisionModel(data: CaseData[]): Promise<void>;
    /**
     * Predict court decision for a case
     */
    predictDecision(caseData: CaseData): Promise<PredictionResult>;
    /**
     * Train the rent price prediction model
     */
    trainRentPriceModel(data: RentPriceData[]): Promise<void>;
    /**
     * Predict rent price for a property
     */
    predictRentPrice(propertyData: RentPriceData): Promise<RentPricePrediction>;
    /**
     * Train the legal change prediction model
     */
    trainLegalChangeModel(data: LegalChangeData[]): Promise<void>;
    /**
     * Predict legal change for a law
     */
    predictLegalChange(lawData: LegalChangeData): Promise<LegalChangePrediction>;
    /**
     * Train the legal precedent predictor model
     */
    trainPrecedentPredictor(data: CaseData[], documents: LegalDocument[][]): Promise<void>;
    /**
     * Predict legal precedent for a case with supporting documents
     */
    predictPrecedent(caseData: CaseData, documents: LegalDocument[]): Promise<PrecedentPrediction>;
    /**
     * Train the compliance risk assessment model
     */
    trainComplianceRiskModel(data: ComplianceRisk[]): Promise<void>;
    /**
     * Assess compliance risk for a case
     */
    assessComplianceRisk(riskData: ComplianceRisk): Promise<RiskAssessment>;
    /**
     * Save all trained models
     */
    saveModels(basePath: string): Promise<void>;
    /**
     * Load all trained models
     */
    loadModels(basePath: string): Promise<void>;
    /**
     * Evaluate all models
     */
    evaluateModels(testData: {
        cases: CaseData[];
        rentPrices: RentPriceData[];
        legalChanges: LegalChangeData[];
        precedents: {
            cases: CaseData[];
            documents: LegalDocument[][];
        };
        complianceRisks: ComplianceRisk[];
    }): Promise<{
        decisionModel: {
            loss: number;
            accuracy: number;
        };
        rentPriceModel: {
            loss: number;
            mae: number;
            mape: number;
        };
        legalChangeModel: {
            loss: number;
            accuracy: number;
        };
        precedentPredictor: {
            loss: number;
            accuracy: number;
        };
        complianceRiskModel: {
            loss: number;
            accuracy: number;
        };
    }>;
    /**
     * Check if the service is initialized
     */
    isServiceInitialized(): boolean;
    /**
     * Get the status of all models
     */
    getModelStatus(): {
        decisionModelTrained: boolean;
        rentPriceModelTrained: boolean;
        legalChangeModelTrained: boolean;
        precedentPredictorTrained: boolean;
        complianceRiskModelTrained: boolean;
    };
}
//# sourceMappingURL=aiService.d.ts.map