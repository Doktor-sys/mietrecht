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
    options?: string[];
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
export declare class EgovernmentIntegration {
    private apiClient;
    private baseUrl;
    private accessToken;
    constructor(baseUrl: string, accessToken: string);
    /**
     * Holt alle verfügbaren E-Government-Dienste
     */
    getAvailableServices(): Promise<GovernmentService[]>;
    /**
     * Holt einen bestimmten E-Government-Dienst
     */
    getServiceById(serviceId: string): Promise<GovernmentService>;
    /**
     * Sucht nach E-Government-Diensten
     */
    searchServices(query: string, category?: string): Promise<GovernmentService[]>;
    /**
     * Holt ein Formular für einen bestimmten Dienst
     */
    getFormForService(serviceId: string): Promise<Form>;
    /**
     * Reicht ein Formular ein
     */
    submitForm(serviceId: string, formData: any): Promise<{
        applicationId: string;
    }>;
    /**
     * Holt den Status einer eingereichten Anwendung
     */
    getApplicationStatus(applicationId: string): Promise<ApplicationStatus>;
    /**
     * Holt Bürgerdaten aus dem E-Government-System
     */
    getCitizenData(personalId: string): Promise<CitizenData>;
    /**
     * Aktualisiert Bürgerdaten im E-Government-System
     */
    updateCitizenData(personalId: string, data: Partial<CitizenData>): Promise<CitizenData>;
    /**
     * Holt verfügbare Dokumente für einen Bürger
     */
    getCitizenDocuments(personalId: string): Promise<any[]>;
    /**
     * Lädt ein Dokument hoch
     */
    uploadDocument(personalId: string, document: any): Promise<{
        documentId: string;
    }>;
    /**
     * Holt Benachrichtigungen für einen Bürger
     */
    getCitizenNotifications(personalId: string): Promise<any[]>;
}
export {};
