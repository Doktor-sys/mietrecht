import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat API functions
export const chatAPI = {
  // Start a new conversation
  startConversation: async (initialMessage: string) => {
    try {
      const response = await apiClient.post('/chat/conversations', {
        message: initialMessage,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  },

  // Send a message in an existing conversation
  sendMessage: async (conversationId: string, message: string) => {
    try {
      const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get conversation history
  getConversationHistory: async (conversationId: string) => {
    try {
      const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  },

  // Get all conversations for user
  getUserConversations: async () => {
    try {
      const response = await apiClient.get('/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      throw error;
    }
  },

  // Delete a conversation
  deleteConversation: async (conversationId: string) => {
    try {
      const response = await apiClient.delete(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },
};

// Document API functions
export const documentAPI = {
  // Upload a document
  upload: async (file: File, documentType: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Analyze a document
  analyze: async (documentId: string) => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/analyze`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  },

  // Get document details
  getDocument: async (documentId: string) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  // Get user documents
  getUserDocuments: async () => {
    try {
      const response = await apiClient.get('/documents');
      return response.data;
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (documentId: string) => {
    try {
      const response = await apiClient.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },
};

// Legal Research API functions
export const legalResearchAPI = {
  // Search legal database
  search: async (query: string, filters?: any) => {
    try {
      const response = await apiClient.post('/legal-research/search', {
        query,
        filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching legal database:', error);
      throw error;
    }
  },

  // Get legal document details
  getDocument: async (documentId: string) => {
    try {
      const response = await apiClient.get(`/legal-research/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching legal document:', error);
      throw error;
    }
  },

  // Get case law predictions
  getPredictions: async (caseDetails: any) => {
    try {
      const response = await apiClient.post('/legal-research/predictions', {
        caseDetails,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  },
};

// Lawyer API functions
export const lawyerAPI = {
  // Search for lawyers
  search: async (criteria: any) => {
    try {
      const response = await apiClient.post('/lawyers/search', criteria);
      return response.data;
    } catch (error) {
      console.error('Error searching lawyers:', error);
      throw error;
    }
  },

  // Get lawyer details
  getLawyer: async (lawyerId: string) => {
    try {
      const response = await apiClient.get(`/lawyers/${lawyerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lawyer details:', error);
      throw error;
    }
  },

  // Book appointment with lawyer
  bookAppointment: async (lawyerId: string, appointmentData: any) => {
    try {
      const response = await apiClient.post(`/lawyers/${lawyerId}/appointments`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  },

  // Submit review for lawyer
  submitReview: async (lawyerId: string, reviewData: any) => {
    try {
      const response = await apiClient.post(`/lawyers/${lawyerId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },
};

// Notification API functions
export const notificationAPI = {
  // Register push notification token
  registerPushToken: async (token: string, platform: string) => {
    try {
      const response = await apiClient.post('/notifications/register', {
        token,
        platform,
      });
      return response.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Get user notifications
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
};

// Export the base apiClient for custom requests
export default apiClient;