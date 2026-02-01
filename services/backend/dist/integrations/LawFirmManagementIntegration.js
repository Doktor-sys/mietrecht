"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawFirmManagementIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class LawFirmManagementIntegration {
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
     * Holt alle Mandanten aus dem Kanzleimanagementsystem
     */
    async getClients() {
        try {
            const response = await this.apiClient.get('/clients');
            return response.data.clients;
        }
        catch (error) {
            logger_1.logger.error('Error fetching clients from law firm management system:', error);
            throw new Error('Failed to fetch clients');
        }
    }
    /**
     * Holt einen bestimmten Mandanten anhand seiner ID
     */
    async getClientById(clientId) {
        try {
            const response = await this.apiClient.get(`/clients/${clientId}`);
            return response.data.client;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching client ${clientId} from law firm management system:`, error);
            throw new Error('Failed to fetch client');
        }
    }
    /**
     * Holt alle Fälle eines Mandanten
     */
    async getCasesForClient(clientId) {
        try {
            const response = await this.apiClient.get(`/clients/${clientId}/cases`);
            return response.data.cases;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching cases for client ${clientId} from law firm management system:`, error);
            throw new Error('Failed to fetch cases');
        }
    }
    /**
     * Holt alle Fälle aus dem Kanzleimanagementsystem
     */
    async getAllCases() {
        try {
            const response = await this.apiClient.get('/cases');
            return response.data.cases;
        }
        catch (error) {
            logger_1.logger.error('Error fetching cases from law firm management system:', error);
            throw new Error('Failed to fetch cases');
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
            logger_1.logger.error(`Error fetching case ${caseId} from law firm management system:`, error);
            throw new Error('Failed to fetch case');
        }
    }
    /**
     * Erstellt einen neuen Fall im Kanzleimanagementsystem
     */
    async createCase(caseData) {
        try {
            const response = await this.apiClient.post('/cases', { case: caseData });
            return response.data.case;
        }
        catch (error) {
            logger_1.logger.error('Error creating case in law firm management system:', error);
            throw new Error('Failed to create case');
        }
    }
    /**
     * Aktualisiert einen bestehenden Fall
     */
    async updateCase(caseId, caseData) {
        try {
            const response = await this.apiClient.patch(`/cases/${caseId}`, { case: caseData });
            return response.data.case;
        }
        catch (error) {
            logger_1.logger.error(`Error updating case ${caseId} in law firm management system:`, error);
            throw new Error('Failed to update case');
        }
    }
    /**
     * Holt die Abrechnungsinformationen für einen Fall
     */
    async getMatterForCase(caseId) {
        try {
            const response = await this.apiClient.get(`/cases/${caseId}/matter`);
            return response.data.matter;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching matter for case ${caseId} from law firm management system:`, error);
            throw new Error('Failed to fetch matter');
        }
    }
    /**
     * Aktualisiert die Abrechnungsinformationen für einen Fall
     */
    async updateMatter(caseId, matterData) {
        try {
            const response = await this.apiClient.patch(`/cases/${caseId}/matter`, { matter: matterData });
            return response.data.matter;
        }
        catch (error) {
            logger_1.logger.error(`Error updating matter for case ${caseId} in law firm management system:`, error);
            throw new Error('Failed to update matter');
        }
    }
    /**
     * Synchronisiert Mandanten zwischen SmartLaw und dem Kanzleimanagementsystem
     */
    async syncClients() {
        try {
            // In einer echten Implementierung würden wir hier die Mandanten synchronisieren
            logger_1.logger.info('Client synchronization with law firm management system initiated');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing clients with law firm management system:', error);
            throw new Error('Failed to synchronize clients');
        }
    }
    /**
     * Synchronisiert Fälle zwischen SmartLaw und dem Kanzleimanagementsystem
     */
    async syncCases() {
        try {
            // In einer echten Implementierung würden wir hier die Fälle synchronisieren
            logger_1.logger.info('Case synchronization with law firm management system initiated');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing cases with law firm management system:', error);
            throw new Error('Failed to synchronize cases');
        }
    }
}
exports.LawFirmManagementIntegration = LawFirmManagementIntegration;
