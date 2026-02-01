/**
 * Type definitions for the AI Service
 */
export interface CaseData {
    id: string;
    caseType: number;
    plaintiffType: number;
    defendantType: number;
    claimAmount: number;
    contractDuration: number;
    previousViolations: number;
    region: number;
    courtType: number;
    decisionOutcome: number;
    decisionDate?: string;
    createdAt: string;
    legalComplexity?: number;
    precedentOutcome?: number;
}
export interface PredictionResult {
    probability: number;
    predictedClass: number;
    confidence: number;
    timestamp: Date;
}
export interface PrecedentPrediction extends PredictionResult {
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    supportingFactors: string[];
}
export interface RentPriceData {
    id: string;
    region: string;
    propertyType: string;
    size: number;
    year: number;
    price: number;
    createdAt: string;
}
export interface RentPricePrediction {
    predictedPrice: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
    timestamp: Date;
}
export interface LegalChangeData {
    id: string;
    lawId: string;
    changeType: 'amendment' | 'repeal' | 'introduction';
    effectiveDate: string;
    description: string;
    impactScore: number;
    createdAt: string;
}
export interface LegalChangePrediction {
    lawId: string;
    predictedChange: 'amendment' | 'repeal' | 'introduction' | 'none';
    probability: number;
    estimatedDate: string;
    impactScore: number;
    timestamp: Date;
}
export interface LegalDocument {
    id: string;
    title: string;
    content?: string;
    date: string;
    source: string;
    type: string;
    citations?: string[];
    createdAt: string;
}
export interface LawyerProfile {
    id: string;
    specialization: string[];
    experience: number;
    successRate: number;
    preferredCaseTypes: string[];
    location: string;
    languages: string[];
    availability: 'fulltime' | 'parttime' | 'flexible';
    createdAt: string;
}
export interface CaseRecommendation {
    caseId: string;
    similarityScore: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}
export interface ComplianceRisk {
    id: string;
    caseType: number;
    regulatoryFramework: number;
    industrySector: number;
    companySize: number;
    previousViolations: number;
    geographicScope: number;
    contractComplexity: number;
    dataSensitivity: number;
    publicInterest: number;
    legalPrecedent: number;
    regulatoryChanges: number;
    stakeholderImpact: number;
    createdAt: string;
}
export interface RiskAssessment {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    probability: number;
    confidence: number;
    timestamp: Date;
    riskFactors: string[];
    recommendations: string[];
}
export interface TrainingData<T> {
    features: number[][];
    labels: number[];
    validationSplit: number;
}
export interface ModelMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    loss: number;
}
export interface ModelVersion {
    version: string;
    trainedAt: Date;
    metrics: ModelMetrics;
    datasetSize: number;
}
//# sourceMappingURL=index.d.ts.map