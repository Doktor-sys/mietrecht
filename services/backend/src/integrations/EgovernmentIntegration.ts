import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface GovernmentService {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  requiresAuthentication: boolean;
}

interface Form {
  id: string;
  serviceName: string;
  title: string;
  fields: FormField[];
  submitUrl: string;
}

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';
  required: boolean;
  label: string;
  options?: string[]; // Für Select, Checkbox, Radio
}

interface ApplicationStatus {
  applicationId: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'additional_info_required';
  lastUpdated: Date;
  notes?: string;
}

interface CitizenData {
  personalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  address: Address;
  contact: ContactInfo;
}

interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface ContactInfo {
  email: string;
  phone: string;
}

export class EgovernmentIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    
    this.apiClient = axios.create({
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
  async getAvailableServices(): Promise<GovernmentService[]> {
    try {
      const response = await this.apiClient.get('/services');
      return response.data.services;
    } catch (error) {
      logger.error('Error fetching government services:', error);
      throw new Error('Failed to fetch government services');
    }
  }

  /**
   * Holt einen bestimmten E-Government-Dienst
   */
  async getServiceById(serviceId: string): Promise<GovernmentService> {
    try {
      const response = await this.apiClient.get(`/services/${serviceId}`);
      return response.data.service;
    } catch (error) {
      logger.error(`Error fetching government service ${serviceId}:`, error);
      throw new Error('Failed to fetch government service');
    }
  }

  /**
   * Sucht nach E-Government-Diensten
   */
  async searchServices(query: string, category?: string): Promise<GovernmentService[]> {
    try {
      const params: any = { q: query };
      if (category) params.category = category;
      
      const response = await this.apiClient.get('/services/search', { params });
      return response.data.services;
    } catch (error) {
      logger.error('Error searching government services:', error);
      throw new Error('Failed to search government services');
    }
  }

  /**
   * Holt ein Formular für einen bestimmten Dienst
   */
  async getFormForService(serviceId: string): Promise<Form> {
    try {
      const response = await this.apiClient.get(`/services/${serviceId}/form`);
      return response.data.form;
    } catch (error) {
      logger.error(`Error fetching form for service ${serviceId}:`, error);
      throw new Error('Failed to fetch form');
    }
  }

  /**
   * Reicht ein Formular ein
   */
  async submitForm(serviceId: string, formData: any): Promise<{ applicationId: string }> {
    try {
      const response = await this.apiClient.post(`/services/${serviceId}/submit`, { data: formData });
      return response.data;
    } catch (error) {
      logger.error(`Error submitting form for service ${serviceId}:`, error);
      throw new Error('Failed to submit form');
    }
  }

  /**
   * Holt den Status einer eingereichten Anwendung
   */
  async getApplicationStatus(applicationId: string): Promise<ApplicationStatus> {
    try {
      const response = await this.apiClient.get(`/applications/${applicationId}/status`);
      return response.data.status;
    } catch (error) {
      logger.error(`Error fetching status for application ${applicationId}:`, error);
      throw new Error('Failed to fetch application status');
    }
  }

  /**
   * Holt Bürgerdaten aus dem E-Government-System
   */
  async getCitizenData(personalId: string): Promise<CitizenData> {
    try {
      const response = await this.apiClient.get(`/citizens/${personalId}`);
      return response.data.citizen;
    } catch (error) {
      logger.error(`Error fetching citizen data for ${personalId}:`, error);
      throw new Error('Failed to fetch citizen data');
    }
  }

  /**
   * Aktualisiert Bürgerdaten im E-Government-System
   */
  async updateCitizenData(personalId: string, data: Partial<CitizenData>): Promise<CitizenData> {
    try {
      const response = await this.apiClient.patch(`/citizens/${personalId}`, { data });
      return response.data.citizen;
    } catch (error) {
      logger.error(`Error updating citizen data for ${personalId}:`, error);
      throw new Error('Failed to update citizen data');
    }
  }

  /**
   * Holt verfügbare Dokumente für einen Bürger
   */
  async getCitizenDocuments(personalId: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/citizens/${personalId}/documents`);
      return response.data.documents;
    } catch (error) {
      logger.error(`Error fetching documents for citizen ${personalId}:`, error);
      throw new Error('Failed to fetch citizen documents');
    }
  }

  /**
   * Lädt ein Dokument hoch
   */
  async uploadDocument(personalId: string, document: any): Promise<{ documentId: string }> {
    try {
      const response = await this.apiClient.post(`/citizens/${personalId}/documents`, { document });
      return response.data;
    } catch (error) {
      logger.error(`Error uploading document for citizen ${personalId}:`, error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Holt Benachrichtigungen für einen Bürger
   */
  async getCitizenNotifications(personalId: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/citizens/${personalId}/notifications`);
      return response.data.notifications;
    } catch (error) {
      logger.error(`Error fetching notifications for citizen ${personalId}:`, error);
      throw new Error('Failed to fetch citizen notifications');
    }
  }
}