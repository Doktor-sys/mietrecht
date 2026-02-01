import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import offlineManager from './offlineManager';
import offlineStorage from './offlineStorage';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for security enhancements
apiClient.interceptors.request.use(
  async function (config: InternalAxiosRequestConfig) {
    // Add device information for security tracking
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
    };

    // Add security headers
    if (config.headers) {
      config.headers['X-Device-Info'] = JSON.stringify(deviceInfo);
      config.headers['X-Content-Type-Options'] = 'nosniff';
      config.headers['X-Frame-Options'] = 'DENY';
      config.headers['X-XSS-Protection'] = '1; mode=block';

      // Add auth token
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
    }

    return config;
  },
  function (error: any) {
    // @ts-ignore
    return Promise.reject(error);
  }
);

// Response interceptor for security and error handling
apiClient.interceptors.response.use(
  function (response: AxiosResponse) {
    return response;
  },
  function (error: AxiosError) {
    // Handle common security-related errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear tokens and potentially redirect to login
          SecureStore.deleteItemAsync('token');
          console.warn('Unauthorized access - token cleared');
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
  login: function (credentials: any) {
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
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      // platform: Device.platform - this property doesn't exist
      isDevice: Device.isDevice,
      timestamp: new Date().toISOString()
    };

    const loginData = {
      email: credentials.email,
      password: credentials.password,
      deviceInfo: deviceInfo
    };

    return apiClient.post('/auth/login', loginData).then(function (response: any) {
      // Store tokens securely
      if (response.data.token) {
        SecureStore.setItemAsync('token', response.data.token);
      }

      // Store CSRF token if provided
      if (response.data.csrfToken) {
        SecureStore.setItemAsync('csrfToken', response.data.csrfToken);
      }

      return response.data;
    });
  },
  register: function (userData: any) {
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
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      // platform: Device.platform - this property doesn't exist
      isDevice: Device.isDevice,
      timestamp: new Date().toISOString()
    };

    const registerData = {
      email: userData.email,
      password: userData.password,
      userType: userData.userType,
      deviceInfo: deviceInfo
    };

    return apiClient.post('/auth/register', registerData).then(function (response: any) {
      // Store tokens securely
      if (response.data.token) {
        SecureStore.setItemAsync('token', response.data.token);
      }

      // Store CSRF token if provided
      if (response.data.csrfToken) {
        SecureStore.setItemAsync('csrfToken', response.data.csrfToken);
      }

      return response.data;
    });
  },
  logout: function () {
    // Clear local tokens first
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('csrfToken');

    return apiClient.post('/auth/logout').then(function (response: any) {
      return response.data;
    });
  },
};

export const chatAPI = {
  startConversation: function (initialQuery: string) {
    return apiClient.post('/chat/start', { query: initialQuery }).then(function (response: any) {
      return response.data;
    });
  },
  sendMessage: async function (conversationId: string, message: string) {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Store message locally and add to offline queue
        await offlineStorage.storeChatMessages(conversationId, [{
          id: Date.now().toString(),
          text: message,
          sender: 'user',
          timestamp: new Date().toISOString()
        }]);

        // Add to offline queue for later sending
        await offlineManager.queueChatMessage(conversationId, message);

        // Return a simulated response
        return {
          data: {
            id: Date.now().toString(),
            text: "Nachricht gespeichert. Wird gesendet, sobald eine Internetverbindung besteht.",
            sender: 'system',
            timestamp: new Date().toISOString()
          }
        };
      }

      // We're online, send the message normally
      const response = await apiClient.post('/chat/' + conversationId + '/message', { message: message });

      // Store the conversation locally for offline access
      const localMessages = await offlineStorage.getChatMessages(conversationId);
      localMessages.push({
        id: response.data.id,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString()
      });

      // Add response to local storage
      localMessages.push({
        id: response.data.response.id,
        text: response.data.response.text,
        sender: 'ai',
        timestamp: response.data.response.timestamp
      });

      await offlineStorage.storeChatMessages(conversationId, localMessages);

      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  },
};

export const documentAPI = {
  upload: async function (file: any, documentType: string) {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Add to offline queue for later uploading
        await offlineManager.queueDocumentUpload(file, documentType);

        // Return a simulated response
        return {
          data: {
            id: Date.now().toString(),
            status: "queued",
            message: "Dokument gespeichert. Wird hochgeladen, sobald eine Internetverbindung besteht."
          }
        };
      }

      // Validate file (basic validation for mobile)
      if (!file) {
        throw new Error('File is required');
      }

      // @ts-ignore
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      // Add file metadata for security validation
      if (file.name) {
        formData.append('fileName', file.name);
      }
      if (file.size) {
        formData.append('fileSize', file.size.toString());
      }
      if (file.type) {
        formData.append('fileType', file.type);
      }

      const response = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Store document info locally for offline access
      await offlineStorage.storeDocument(response.data.id, response.data);

      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  },
  analyze: function (documentId: string) {
    return apiClient.post('/documents/' + documentId + '/analyze').then(function (response: any) {
      return response.data;
    });
  },
  getAll: async function (): Promise<any> {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Return cached documents if available
        // In a real implementation, you would store documents locally
        return { data: [] };
      }

      const response = await apiClient.get('/documents');

      // Store documents locally for offline access
      for (const doc of response.data) {
        await offlineStorage.storeDocument(doc.id, doc);
      }

      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  },
};

export const lawyerAPI = {
  search: async function (criteria: any) {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Try to get cached search results
        const cachedResults = await offlineStorage.getLawyerSearch(JSON.stringify(criteria));
        if (cachedResults) {
          return { data: cachedResults };
        }

        // No cached results, return empty
        return { data: [] };
      }

      const response = await apiClient.get('/lawyers/search', { params: criteria });

      // Store search results locally for offline access
      await offlineStorage.storeLawyerSearch(JSON.stringify(criteria), response.data);

      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  },
  getById: function (lawyerId: string) {
    return apiClient.get('/lawyers/' + lawyerId).then(function (response: any) {
      return response.data;
    });
  },
  bookConsultation: async function (lawyerId: string, timeSlot: string) {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Add to offline queue for later booking
        await offlineManager.queueLawyerBooking(lawyerId, timeSlot);

        // Return a simulated response
        return {
          data: {
            status: "queued",
            message: "Terminanfrage gespeichert. Wird gebucht, sobald eine Internetverbindung besteht."
          }
        };
      }

      const response = await apiClient.post('/lawyers/' + lawyerId + '/book', { timeSlot: timeSlot });
      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  },
};

export const feedbackAPI = {
  submit: async function (data: { category: string; message: string; userId?: string }) {
    try {
      // Check if we're online
      const isOnline = offlineManager.getIsOnline();

      if (!isOnline) {
        // Add to offline queue
        await offlineManager.queueFeedback(data);

        return {
          data: {
            status: "queued",
            message: "Feedback gespeichert. Wird gesendet, sobald eine Internetverbindung besteht."
          }
        };
      }

      const response = await apiClient.post('/feedback', data);
      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  }
};

export const gdprAPI = {
  deleteAccount: async function (data: { reason: string; deleteDocuments: boolean; deleteMessages: boolean }) {
    try {
      // GDPR deletion is a critical action, usually requires online connectivity
      // but we could queue it if strictly necessary. For now, we enforce online.
      const isOnline = offlineManager.getIsOnline();
      if (!isOnline) {
        throw new Error('Internet connection required for account deletion.');
      }

      const response = await apiClient.post('/gdpr/delete', data);
      return response.data;
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error);
    }
  }
};

// Security utility functions
export const securityUtils = {
  clearAuthTokens: function () {
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('csrfToken');
  },

  getAuthToken: function () {
    return SecureStore.getItemAsync('token');
  },

  setAuthToken: function (token: string) {
    SecureStore.setItemAsync('token', token);
  },

  getCSRFToken: function () {
    return SecureStore.getItemAsync('csrfToken');
  },

  setCSRFToken: function (token: string) {
    SecureStore.setItemAsync('csrfToken', token);
  }
};

export default apiClient;