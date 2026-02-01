"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtDataExchangeIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class CourtDataExchangeIntegration {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Holt alle Gerichte in einer bestimmten Jurisdiktion
     */
    async getCourts(jurisdiction) {
        try {
            const response = await this.apiClient.get('/courts', {
                params: { jurisdiction }
            });
            return response.data.courts;
        }
        catch (error) {
            logger_1.logger.error('Error fetching courts:', error);
            throw new Error('Failed to fetch courts');
        }
    }
    /**
     * Holt einen bestimmten Fall anhand seiner ID
     */
    async getCaseById(caseId) {
        try {
            const response = await this.apiClient.get(`/cases/${caseId}`);
            return response.data.case;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching case ${caseId}:`, error);
            throw new Error('Failed to fetch case');
        }
    }
    /**
     * Sucht nach Fällen basierend auf verschiedenen Kriterien
     */
    async searchCases(criteria) {
        try {
            const params = {};
            if (criteria.caseNumber)
                params.caseNumber = criteria.caseNumber;
            if (criteria.partyName)
                params.partyName = criteria.partyName;
            if (criteria.courtId)
                params.courtId = criteria.courtId;
            if (criteria.dateFrom)
                params.dateFrom = criteria.dateFrom.toISOString();
            if (criteria.dateTo)
                params.dateTo = criteria.dateTo.toISOString();
            const response = await this.apiClient.get('/cases/search', { params });
            return response.data.cases;
        }
        catch (error) {
            logger_1.logger.error('Error searching cases:', error);
            throw new Error('Failed to search cases');
        }
    }
    /**
     * Reicht einen neuen Fall beim Gericht ein
     */
    async fileCase(caseData) {
        try {
            const response = await this.apiClient.post('/cases', { case: caseData });
            return response.data.case;
        }
        catch (error) {
            logger_1.logger.error('Error filing case:', error);
            throw new Error('Failed to file case');
        }
    }
    /**
     * Holt alle Dokumente für einen bestimmten Fall
     */
    async getCaseDocuments(caseId) {
        try {
            const response = await this.apiClient.get(`/cases/${caseId}/documents`);
            return response.data.documents;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching documents for case ${caseId}:`, error);
            throw new Error('Failed to fetch case documents');
        }
    }
    /**
     * Reicht ein Dokument bei einem Fall ein
     */
    async fileDocument(caseId, documentData) {
        try {
            const response = await this.apiClient.post(`/cases/${caseId}/documents`, { document: documentData });
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error filing document for case ${caseId}:`, error);
            throw new Error('Failed to file document');
        }
    }
    /**
     * Holt Informationen über das nächste Verhandlungstermin
     */
    async getNextHearing(caseId) {
        try {
            const response = await this.apiClient.get(`/cases/${caseId}/next-hearing`);
            return response.data.nextHearing ? new Date(response.data.nextHearing) : null;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching next hearing for case ${caseId}:`, error);
            throw new Error('Failed to fetch next hearing');
        }
    }
    /**
     * Holt den Status eines Falls
     */
    async getCaseStatus(caseId) {
        try {
            const response = await this.apiClient.get(`/cases/${caseId}/status`);
            return response.data.status;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching status for case ${caseId}:`, error);
            throw new Error('Failed to fetch case status');
        }
    }
    /**
     * Holt aktuelle Gerichtsentscheidungen
     */
    async getRecentDecisions(limit = 10) {
        try {
            const response = await this.apiClient.get('/decisions/recent', {
                params: { limit }
            });
            return response.data.decisions;
        }
        catch (error) {
            logger_1.logger.error('Error fetching recent decisions:', error);
            throw new Error('Failed to fetch recent decisions');
        }
    }
}
exports.CourtDataExchangeIntegration = CourtDataExchangeIntegration;
