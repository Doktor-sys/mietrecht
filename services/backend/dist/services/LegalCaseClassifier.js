"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalCaseClassifier = void 0;
const logger_1 = require("../utils/logger");
const NLPService_1 = require("./NLPService");
class LegalCaseClassifier {
    constructor() {
        // Thresholds for escalation
        this.CONFIDENCE_THRESHOLD = 0.7;
        this.HIGH_VALUE_THRESHOLD = 5000;
        this.nlpService = new NLPService_1.NLPService();
    }
    /**
     * Classify a legal case based on user query
     */
    async classifyCase(query) {
        try {
            logger_1.logger.info('Classifying legal case', { queryLength: query.length });
            // Step 1: Recognize intent
            const intent = await this.nlpService.recognizeIntent(query);
            // Step 2: Extract context
            const context = await this.nlpService.extractContext(query, intent);
            // Step 3: Classify the case
            const classification = this.performClassification(intent, context);
            // Step 4: Generate recommendations
            const recommendations = this.generateRecommendations(classification, context);
            logger_1.logger.info('Case classified', {
                category: classification.category,
                confidence: classification.confidence,
                escalationRecommended: classification.escalationRecommended
            });
            return {
                classification,
                intent,
                context,
                recommendations
            };
        }
        catch (error) {
            logger_1.logger.error('Error classifying case', { error });
            throw error;
        }
    }
    /**
     * Perform case classification based on intent and context
     */
    performClassification(intent, context) {
        const category = intent.category;
        const confidence = intent.confidence;
        // Determine risk level
        const riskLevel = this.determineRiskLevel(category, context);
        // Determine if escalation is needed
        const { escalationRecommended, escalationReason } = this.determineEscalation(category, confidence, context, riskLevel);
        // Determine complexity
        const estimatedComplexity = this.determineComplexity(category, context);
        // Determine sub-category
        const subCategory = this.determineSubCategory(category, context);
        return {
            category,
            subCategory,
            confidence,
            riskLevel,
            escalationRecommended,
            escalationReason,
            estimatedComplexity
        };
    }
    /**
     * Determine risk level of the case
     */
    determineRiskLevel(category, context) {
        // High risk categories
        if (category === 'termination') {
            return 'high';
        }
        // Check urgency from context
        if (context.urgency === 'high') {
            return 'high';
        }
        // Check estimated value
        if (context.estimatedValue && context.estimatedValue > this.HIGH_VALUE_THRESHOLD) {
            return 'high';
        }
        // Medium risk categories
        if (['rent_reduction', 'rent_increase', 'deposit'].includes(category)) {
            return 'medium';
        }
        // Default to low risk
        return 'low';
    }
    /**
     * Determine if case should be escalated to a lawyer
     */
    determineEscalation(category, confidence, context, riskLevel) {
        // Always escalate termination cases
        if (category === 'termination') {
            return {
                escalationRecommended: true,
                escalationReason: 'high_stakes_case'
            };
        }
        // Escalate if confidence is too low
        if (confidence < this.CONFIDENCE_THRESHOLD) {
            return {
                escalationRecommended: true,
                escalationReason: 'low_confidence'
            };
        }
        // Escalate high-value cases
        if (context.estimatedValue && context.estimatedValue > this.HIGH_VALUE_THRESHOLD) {
            return {
                escalationRecommended: true,
                escalationReason: 'high_value'
            };
        }
        // Escalate high-risk cases
        if (riskLevel === 'high') {
            return {
                escalationRecommended: true,
                escalationReason: 'high_risk'
            };
        }
        // Escalate if multiple complex legal issues
        if (context.legalIssues.length > 3) {
            return {
                escalationRecommended: true,
                escalationReason: 'complex_legal_situation'
            };
        }
        return {
            escalationRecommended: false
        };
    }
    /**
     * Determine case complexity
     */
    determineComplexity(category, context) {
        // Complex categories
        if (category === 'termination' || category === 'modernization') {
            return 'complex';
        }
        // Check number of legal issues
        if (context.legalIssues.length > 3) {
            return 'complex';
        }
        if (context.legalIssues.length > 1) {
            return 'moderate';
        }
        // Check number of facts
        if (context.facts.length > 5) {
            return 'moderate';
        }
        return 'simple';
    }
    /**
     * Determine sub-category based on context
     */
    determineSubCategory(category, context) {
        const factsText = context.facts.join(' ').toLowerCase();
        const issuesText = context.legalIssues.join(' ').toLowerCase();
        const combinedText = `${factsText} ${issuesText}`;
        switch (category) {
            case 'rent_reduction':
                if (combinedText.includes('heizung'))
                    return 'heating_defect';
                if (combinedText.includes('schimmel'))
                    return 'mold';
                if (combinedText.includes('lärm') || combinedText.includes('geräusch'))
                    return 'noise';
                if (combinedText.includes('wasser'))
                    return 'water_damage';
                return 'general_defect';
            case 'termination':
                if (combinedText.includes('fristlos'))
                    return 'extraordinary_termination';
                if (combinedText.includes('eigenbedarf'))
                    return 'personal_use';
                if (combinedText.includes('zahlungsverzug'))
                    return 'payment_default';
                return 'ordinary_termination';
            case 'utility_costs':
                if (combinedText.includes('nachzahlung'))
                    return 'additional_payment';
                if (combinedText.includes('fehler'))
                    return 'calculation_error';
                return 'general_utility';
            case 'rent_increase':
                if (combinedText.includes('mietspiegel'))
                    return 'rent_index';
                if (combinedText.includes('modernisierung'))
                    return 'modernization_increase';
                return 'general_increase';
            default:
                return undefined;
        }
    }
    /**
     * Generate recommendations based on classification
     */
    generateRecommendations(classification, context) {
        const recommendations = [];
        // Category-specific recommendations
        switch (classification.category) {
            case 'rent_reduction':
                recommendations.push('Dokumentieren Sie den Mangel mit Fotos und Datum');
                recommendations.push('Setzen Sie dem Vermieter eine angemessene Frist zur Beseitigung');
                recommendations.push('Mindern Sie die Miete erst nach Fristsetzung');
                if (classification.subCategory === 'mold') {
                    recommendations.push('Lassen Sie den Schimmel von einem Sachverständigen begutachten');
                }
                break;
            case 'termination':
                recommendations.push('Prüfen Sie die Kündigungsfrist und Form');
                recommendations.push('Lassen Sie die Kündigung rechtlich prüfen');
                recommendations.push('Reagieren Sie innerhalb der gesetzlichen Fristen');
                recommendations.push('Konsultieren Sie einen Fachanwalt für Mietrecht');
                break;
            case 'utility_costs':
                recommendations.push('Prüfen Sie die Abrechnung auf Vollständigkeit');
                recommendations.push('Vergleichen Sie mit Vorjahresabrechnungen');
                recommendations.push('Fordern Sie Belegeinsicht an');
                if (context.legalIssues.some((issue) => issue.toLowerCase().includes('fehler'))) {
                    recommendations.push('Widersprechen Sie der Abrechnung schriftlich innerhalb von 12 Monaten');
                }
                break;
            case 'rent_increase':
                recommendations.push('Prüfen Sie die Begründung der Mieterhöhung');
                recommendations.push('Vergleichen Sie mit dem örtlichen Mietspiegel');
                recommendations.push('Sie haben 2 Monate Zeit für eine Reaktion');
                break;
            case 'deposit':
                recommendations.push('Fordern Sie die Kaution schriftlich zurück');
                recommendations.push('Setzen Sie eine angemessene Frist');
                recommendations.push('Der Vermieter hat 6 Monate Zeit für die Abrechnung');
                break;
            default:
                recommendations.push('Dokumentieren Sie alle relevanten Vorgänge');
                recommendations.push('Kommunizieren Sie schriftlich mit dem Vermieter');
        }
        // Escalation recommendation
        if (classification.escalationRecommended) {
            recommendations.push('⚠️ Wir empfehlen die Konsultation eines Fachanwalts für Mietrecht');
        }
        // Urgency-based recommendations
        if (context.urgency === 'high') {
            recommendations.unshift('🚨 Dringend: Handeln Sie schnell, um Fristen einzuhalten');
        }
        return recommendations;
    }
    /**
     * Get confidence level description
     */
    getConfidenceDescription(confidence) {
        if (confidence >= 0.9)
            return 'Sehr sicher';
        if (confidence >= 0.7)
            return 'Sicher';
        if (confidence >= 0.5)
            return 'Mittel';
        return 'Unsicher';
    }
    /**
     * Get risk level description
     */
    getRiskLevelDescription(riskLevel) {
        switch (riskLevel) {
            case 'low': return 'Geringes Risiko';
            case 'medium': return 'Mittleres Risiko';
            case 'high': return 'Hohes Risiko';
        }
    }
}
exports.LegalCaseClassifier = LegalCaseClassifier;
