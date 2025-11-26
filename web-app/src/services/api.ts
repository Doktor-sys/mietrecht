import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for security enhancements
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF protection header
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add security headers
    config.headers['X-Content-Type-Options'] = 'nosniff';
    config.headers['X-Frame-Options'] = 'DENY';
    config.headers['X-XSS-Protection'] = '1; mode=block';
    
    // Add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for security and error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common security-related errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('csrfToken');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - show access denied message
          console.warn('Access denied - insufficient permissions');
          break;
        case 429:
          // Rate limited - show rate limit message
          console.warn('Rate limit exceeded - please try again later');
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    // Add client-side validation
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }
    
    // Add device fingerprint for security tracking
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
    
    const loginData = {
      ...credentials,
      deviceInfo
    };
    
    const response = await apiClient.post('/auth/login', loginData);
    
    // Store CSRF token if provided
    if (response.data.csrfToken) {
      localStorage.setItem('csrfToken', response.data.csrfToken);
    }
    
    return response.data;
  },
  register: async (userData: { email: string; password: string; userType: string }) => {
    // Add client-side validation
    if (!userData.email || !userData.password || !userData.userType) {
      throw new Error('Email, password, and user type are required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Add device fingerprint for security tracking
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
    
    const registerData = {
      ...userData,
      deviceInfo
    };
    
    const response = await apiClient.post('/auth/register', registerData);
    
    // Store CSRF token if provided
    if (response.data.csrfToken) {
      localStorage.setItem('csrfToken', response.data.csrfToken);
    }
    
    return response.data;
  },
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      
      // Clear all authentication tokens
      localStorage.removeItem('token');
      localStorage.removeItem('csrfToken');
      
      return response.data;
    } catch (error) {
      // Even if logout fails, clear local tokens
      localStorage.removeItem('token');
      localStorage.removeItem('csrfToken');
      throw error;
    }
  },
};

export const chatAPI = {
  startConversation: async (initialQuery: string) => {
    const response = await apiClient.post('/chat/start', { query: initialQuery });
    return response.data;
  },
  sendMessage: async (conversationId: string, message: string) => {
    const response = await apiClient.post(`/chat/${conversationId}/message`, { message });
    return response.data;
  },
};

export const documentAPI = {
  upload: async (file: File, documentType: string, onProgress?: (progress: number) => void) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds maximum allowed size of 10MB');
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Only PDF, JPEG, PNG, and TXT files are supported.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Add file metadata for security validation
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size.toString());
    formData.append('fileType', file.type);
    
    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },
  extractText: async (documentId: string) => {
    const response = await apiClient.post(`/documents/${documentId}/extract-text`);
    return response.data;
  },
  analyze: async (documentId: string) => {
    const response = await apiClient.post(`/documents/${documentId}/analyze`);
    return response.data;
  },
  getVersions: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/versions`);
    return response.data;
  },
  uploadVersion: async (documentId: string, file: File, documentType: string, onProgress?: (progress: number) => void) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds maximum allowed size of 10MB');
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Only PDF, JPEG, PNG, and TXT files are supported.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Add file metadata for security validation
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size.toString());
    formData.append('fileType', file.type);
    
    const response = await apiClient.post(`/documents/${documentId}/upload-version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },
  search: async (params: {
    query?: string;
    documentType?: string;
    startDate?: string;
    endDate?: string;
    minRiskLevel?: string;
    maxRiskLevel?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/documents/search', { params });
    return response.data;
  },
  share: async (documentId: string, sharedWithEmail: string, permission?: string, expiresAt?: string) => {
    const response = await apiClient.post(`/documents/${documentId}/share`, {
      sharedWithEmail,
      permission,
      expiresAt
    });
    return response.data;
  },
  getShares: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/shares`);
    return response.data;
  },
  getSharedDocuments: async () => {
    const response = await apiClient.get('/documents/shared');
    return response.data;
  },
  updateShare: async (shareId: string, permission?: string, expiresAt?: string) => {
    const response = await apiClient.put(`/documents/shares/${shareId}`, {
      permission,
      expiresAt
    });
    return response.data;
  },
  removeShare: async (shareId: string) => {
    const response = await apiClient.delete(`/documents/shares/${shareId}`);
    return response.data;
  },
  createAnnotation: async (documentId: string, annotation: {
    text: string;
    type?: string;
    parentId?: string;
    page?: number;
    positionX?: number;
    positionY?: number;
  }) => {
    const response = await apiClient.post(`/documents/${documentId}/annotations`, annotation);
    return response.data;
  },
  getAnnotations: async (documentId: string, includeReplies?: boolean) => {
    const response = await apiClient.get(`/documents/${documentId}/annotations`, {
      params: { includeReplies }
    });
    return response.data;
  },
  updateAnnotation: async (annotationId: string, updates: {
    text?: string;
    resolved?: boolean;
  }) => {
    const response = await apiClient.put(`/documents/annotations/${annotationId}`, updates);
    return response.data;
  },
  deleteAnnotation: async (annotationId: string) => {
    const response = await apiClient.delete(`/documents/annotations/${annotationId}`);
    return response.data;
  },
  resolveAnnotation: async (annotationId: string) => {
    const response = await apiClient.post(`/documents/annotations/${annotationId}/resolve`);
    return response.data;
  },
  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
  getById: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  },
  download: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  delete: async (documentId: string) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },
  // Workflow methods
  transitionStatus: async (documentId: string, action: string, comment?: string) => {
    const response = await apiClient.post(`/documents/${documentId}/status`, { action, comment });
    return response.data;
  },
  getWorkflowHistory: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/workflow-history`);
    return response.data;
  },
  getWorkflowRules: async () => {
    const response = await apiClient.get('/documents/workflow-rules');
    return response.data;
  },
  createWorkflowRule: async (rule: {
    name: string;
    description?: string;
    triggerEvent: string;
    condition?: string;
    action: string;
    actionParams?: any;
  }) => {
    const response = await apiClient.post('/documents/workflow-rules', rule);
    return response.data;
  },
  updateWorkflowRule: async (ruleId: string, updates: Partial<{
    name: string;
    description?: string;
    triggerEvent: string;
    condition?: string;
    action: string;
    actionParams?: any;
    enabled: boolean;
    priority: number;
  }>) => {
    const response = await apiClient.put(`/documents/workflow-rules/${ruleId}`, updates);
    return response.data;
  },
  deleteWorkflowRule: async (ruleId: string) => {
    const response = await apiClient.delete(`/documents/workflow-rules/${ruleId}`);
    return response.data;
  },
};

export const lawyerAPI = {
  search: async (criteria: {
    location?: string;
    specialization?: string;
    maxDistance?: number;
    minRating?: number;
    maxHourlyRate?: number;
    languages?: string[];
  }) => {
    const response = await apiClient.get('/lawyers/search', { params: criteria });
    return response.data;
  },
  getById: async (lawyerId: string) => {
    const response = await apiClient.get(`/lawyers/${lawyerId}`);
    return response.data;
  },
  bookConsultation: async (lawyerId: string, timeSlot: string, details?: { consultationType?: string; notes?: string }) => {
    const response = await apiClient.post(`/lawyers/${lawyerId}/book`, { timeSlot, ...details });
    return response.data;
  },
  getAvailableSlots: async (lawyerId: string, date: string) => {
    const response = await apiClient.get(`/lawyers/${lawyerId}/available-slots`, { params: { date } });
    return response.data;
  },
  submitReview: async (lawyerId: string, review: { rating: number; comment: string }) => {
    const response = await apiClient.post(`/lawyers/${lawyerId}/reviews`, review);
    return response.data;
  },
  getReviews: async (lawyerId: string) => {
    const response = await apiClient.get(`/lawyers/${lawyerId}/reviews`);
    return response.data;
  },
};

// Security utility functions
export const securityUtils = {
  clearAuthTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('csrfToken');
  },
  
  getAuthToken: () => {
    return localStorage.getItem('token');
  },
  
  setAuthToken: (token: string) => {
    localStorage.setItem('token', token);
  },
  
  getCSRFToken: () => {
    return localStorage.getItem('csrfToken');
  },
  
  setCSRFToken: (token: string) => {
    localStorage.setItem('csrfToken', token);
  }
};

export default apiClient;
