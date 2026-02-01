"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LegalCaseClassifier_1 = require("../services/LegalCaseClassifier");
describe('LegalCaseClassifier - Simple Tests', () => {
    let classifier;
    beforeEach(() => {
        classifier = new LegalCaseClassifier_1.LegalCaseClassifier();
    });
    describe('getConfidenceDescription', () => {
        it('should return Sehr sicher for high confidence', () => {
            expect(classifier.getConfidenceDescription(0.95)).toBe('Sehr sicher');
        });
        it('should return Sicher for good confidence', () => {
            expect(classifier.getConfidenceDescription(0.8)).toBe('Sicher');
        });
        it('should return Mittel for medium confidence', () => {
            expect(classifier.getConfidenceDescription(0.6)).toBe('Mittel');
        });
        it('should return Unsicher for low confidence', () => {
            expect(classifier.getConfidenceDescription(0.4)).toBe('Unsicher');
        });
    });
    describe('getRiskLevelDescription', () => {
        it('should return Geringes Risiko for low risk', () => {
            expect(classifier.getRiskLevelDescription('low')).toBe('Geringes Risiko');
        });
        it('should return Mittleres Risiko for medium risk', () => {
            expect(classifier.getRiskLevelDescription('medium')).toBe('Mittleres Risiko');
        });
        it('should return Hohes Risiko for high risk', () => {
            expect(classifier.getRiskLevelDescription('high')).toBe('Hohes Risiko');
        });
    });
});
