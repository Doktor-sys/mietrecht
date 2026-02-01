/**
 * Type definitions for the AI Service
 */

// Case data structure
export interface CaseData {
  id: string;
  caseType: number; // Encoded case type
  plaintiffType: number; // Encoded plaintiff type
  defendantType: number; // Encoded defendant type
  claimAmount: number; // Claim amount in EUR
  contractDuration: number; // Contract duration in months
  previousViolations: number; // Number of previous violations
  region: number; // Encoded region
  courtType: number; // Encoded court type
  decisionOutcome: number; // 0 for plaintiff win, 1 for defendant win
  decisionDate?: string; // ISO date string
  createdAt: string; // ISO date string
  legalComplexity?: number; // 0-1 complexity score
  precedentOutcome?: number; // 0 for plaintiff win, 1 for defendant win
}

// Prediction result structure
export interface PredictionResult {
  probability: number; // Probability of defendant win (0-1)
  predictedClass: number; // Predicted class (0 or 1)
  confidence: number; // Confidence level (0-1)
  timestamp: Date; // Prediction timestamp
}

// Extended precedent prediction result
export interface PrecedentPrediction extends PredictionResult {
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  supportingFactors: string[];
}

// Rent price data structure
export interface RentPriceData {
  id: string;
  region: string;
  propertyType: string;
  size: number; // Size in square meters
  year: number;
  price: number; // Price per square meter
  createdAt: string; // ISO date string
}

// Rent price prediction result
export interface RentPricePrediction {
  predictedPrice: number; // Predicted price per square meter
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  timestamp: Date;
}

// Legal change data structure
export interface LegalChangeData {
  id: string;
  lawId: string;
  changeType: 'amendment' | 'repeal' | 'introduction';
  effectiveDate: string; // ISO date string
  description: string;
  impactScore: number; // 0-10 impact score
  createdAt: string; // ISO date string
}

// Legal change prediction result
export interface LegalChangePrediction {
  lawId: string;
  predictedChange: 'amendment' | 'repeal' | 'introduction' | 'none';
  probability: number; // Probability of change (0-1)
  estimatedDate: string; // ISO date string
  impactScore: number; // 0-10 impact score
  timestamp: Date;
}

// Legal document structure
export interface LegalDocument {
  id: string;
  title: string;
  content?: string;
  date: string; // ISO date string
  source: string;
  type: string;
  citations?: string[];
  createdAt: string; // ISO date string
}

// Lawyer profile data
export interface LawyerProfile {
  id: string;
  specialization: string[];
  experience: number; // Years of experience
  successRate: number; // Overall success rate (0-1)
  preferredCaseTypes: string[];
  location: string;
  languages: string[];
  availability: 'fulltime' | 'parttime' | 'flexible';
  createdAt: string; // ISO date string
}

// Case recommendation
export interface CaseRecommendation {
  caseId: string;
  similarityScore: number; // 0-1 similarity score
  reason: string; // Reason for recommendation
  priority: 'high' | 'medium' | 'low';
}

// Compliance risk data
export interface ComplianceRisk {
  id: string;
  caseType: number; // Encoded case type
  regulatoryFramework: number; // 0-1 score
  industrySector: number; // Encoded industry sector
  companySize: number; // 0-1 score
  previousViolations: number; // Number of previous violations
  geographicScope: number; // 0-1 score
  contractComplexity: number; // 0-1 score
  dataSensitivity: number; // 0-1 score
  publicInterest: number; // 0-1 score
  legalPrecedent: number; // 0-1 score
  regulatoryChanges: number; // 0-1 score
  stakeholderImpact: number; // 0-1 score
  createdAt: string; // ISO date string
}

// Risk assessment result
export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number; // 0-1 probability
  confidence: number; // 0-1 confidence level
  timestamp: Date; // Assessment timestamp
  riskFactors: string[]; // Identified risk factors
  recommendations: string[]; // Recommended actions
}

// Training data interface
export interface TrainingData<T> {
  features: number[][];
  labels: number[];
  validationSplit: number;
}

// Model evaluation metrics
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
}

// Model version information
export interface ModelVersion {
  version: string;
  trainedAt: Date;
  metrics: ModelMetrics;
  datasetSize: number;
}