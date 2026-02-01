"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EgovernmentIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class EgovernmentIntegration {
    constructor(baseUrl, accessToken) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Holt alle verfügbaren E-Government-Dienste
     */
    async getAvailableServices() {
        try {
            const response = await this.apiClient.get('/services');
            return response.data.services;
        }
        catch (error) {
            logger_1.logger.error('Error fetching government services:', error);
            throw new Error('Failed to fetch government services');
        }
    }
    /**
     * Holt einen bestimmten E-Government-Dienst
     */
    async getServiceById(serviceId) {
        try {
            const response = await this.apiClient.get(`/services/${serviceId}`);
            return response.data.service;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching government service ${serviceId}:`, error);
            throw new Error('Failed to fetch government service');
        }
    }
    /**
     * Sucht nach E-Government-Diensten
     */
    async searchServices(query, category) {
        try {
            const params = { q: query };
            if (category)
                params.category = category;
            const response = await this.apiClient.get('/services/search', { params });
            return response.data.services;
        }
        catch (error) {
            logger_1.logger.error('Error searching government services:', error);
            throw new Error('Failed to search government services');
        }
    }
    /**
     * Holt ein Formular für einen bestimmten Dienst
     */
    async getFormForService(serviceId) {
        try {
            const response = await this.apiClient.get(`/services/${serviceId}/form`);
            return response.data.form;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching form for service ${serviceId}:`, error);
            throw new Error('Failed to fetch form');
        }
    }
    /**
     * Reicht ein Formular ein
     */
    async submitForm(serviceId, formData) {
        try {
            const response = await this.apiClient.post(`/services/${serviceId}/submit`, { data: formData });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error submitting form for service ${serviceId}:`, error);
            throw new Error('Failed to submit form');
        }
    }
    /**
     * Holt den Status einer eingereichten Anwendung
     */
    async getApplicationStatus(applicationId) {
        try {
            const response = await this.apiClient.get(`/applications/${applicationId}/status`);
            return response.data.status;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching status for application ${applicationId}:`, error);
            throw new Error('Failed to fetch application status');
        }
    }
    /**
     * Holt Bürgerdaten aus dem E-Government-System
     */
    async getCitizenData(personalId) {
        try {
            const response = await this.apiClient.get(`/citizens/${personalId}`);
            return response.data.citizen;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching citizen data for ${personalId}:`, error);
            throw new Error('Failed to fetch citizen data');
        }
    }
    /**
     * Aktualisiert Bürgerdaten im E-Government-System
     */
    async updateCitizenData(personalId, data) {
        try {
            const response = await this.apiClient.patch(`/citizens/${personalId}`, { data });
            return response.data.citizen;
        }
        catch (error) {
            logger_1.logger.error(`Error updating citizen data for ${personalId}:`, error);
            throw new Error('Failed to update citizen data');
        }
    }
    /**
     * Holt verfügbare Dokumente für einen Bürger
     */
    async getCitizenDocuments(personalId) {
        try {
            const response = await this.apiClient.get(`/citizens/${personalId}/documents`);
            return response.data.documents;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching documents for citizen ${personalId}:`, error);
            throw new Error('Failed to fetch citizen documents');
        }
    }
    /**
     * Lädt ein Dokument hoch
     */
    async uploadDocument(personalId, document) {
        try {
            const response = await this.apiClient.post(`/citizens/${personalId}/documents`, { document });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error uploading document for citizen ${personalId}:`, error);
            throw new Error('Failed to upload document');
        }
    }
    /**
     * Holt Benachrichtigungen für einen Bürger
     */
    async getCitizenNotifications(personalId) {
        try {
            const response = await this.apiClient.get(`/citizens/${personalId}/notifications`);
            return response.data.notifications;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching notifications for citizen ${personalId}:`, error);
            throw new Error('Failed to fetch citizen notifications');
        }
    }
}
exports.EgovernmentIntegration = EgovernmentIntegration;
