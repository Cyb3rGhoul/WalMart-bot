import axios from 'axios';
import API_CONFIG from '../config/api.js';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// API Service class
class ApiService {
  // Check backend connection
  static async checkConnection() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PING);
      return {
        connected: response.status === 200,
        message: response.data.message
      };
    } catch (error) {
      return {
        connected: false,
        message: API_CONFIG.ERROR_MESSAGES.CONNECTION_FAILED,
        error: error.message
      };
    }
  }

  // Start a new session
  static async startSession() {
    try {
      const response = await apiClient.post('/start_session');
      return {
        success: true,
        session_id: response.data.session_id
      };
    } catch (error) {
      return this.handleApiError(error, 'startSession');
    }
  }

  // Generate AI response
  static async generateResponse(userPrompt, sessionId) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESPOND, {
        user_prompt: userPrompt,
        session_id: sessionId
      });

      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return this.handleApiError(error, 'generateResponse');
    }
  }

  // Upload and process document
  static async uploadAndProcessDocument(file, userMessage = '') {
    try {
      // Step 1: Upload file
      const uploadResult = await this.uploadDocument(file);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Step 2: Extract text from document
      const ocrResult = await this.extractTextFromDocument(uploadResult.documentUrl);
      if (!ocrResult.success) {
        return ocrResult;
      }

      // Step 3: Generate AI response with extracted text
      const combinedMessage = userMessage 
        ? `Document content: ${ocrResult.text}\n\nUser question: ${userMessage}`
        : `Please analyze this document: ${ocrResult.text}`;

      return await this.generateResponse(combinedMessage);
    } catch (error) {
      return this.handleApiError(error, 'uploadAndProcessDocument');
    }
  }

  // Upload document
  static async uploadDocument(file) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.UPLOAD_DOC}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 1) {
        return {
          success: true,
          documentUrl: response.data.document_url[0],
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || API_CONFIG.ERROR_MESSAGES.UPLOAD_FAILED
        };
      }
    } catch (error) {
      return this.handleApiError(error, 'uploadDocument');
    }
  }

  // Extract text from document
  static async extractTextFromDocument(documentUrl) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.GET_OCR, {
        document_urls: documentUrl
      });

      return {
        success: true,
        text: response.data.response
      };
    } catch (error) {
      return this.handleApiError(error, 'extractTextFromDocument');
    }
  }

  // Analyze grocery list from document
  static async analyzeGroceryList(documentUrl) {
    try {
      const response = await apiClient.post('/analyze-grocery-list', {
        document_url: documentUrl
      });
      // Try to parse JSON if Gemini returns a stringified JSON
      let result = response.data.result;
      try {
        if (typeof result === 'string') {
          result = JSON.parse(result);
        }
      } catch {
        // Not JSON, leave as is
      }
      return {
        success: true,
        result
      };
    } catch (error) {
      return this.handleApiError(error, 'analyzeGroceryList');
    }
  }

  // Validate file before upload
  static validateFile(file) {
    // Check file type
    if (!API_CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: `Invalid file type. Allowed types: ${API_CONFIG.UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Check file size
    if (file.size > API_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `File size too large. Maximum size: ${API_CONFIG.UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  // Handle API errors
  static handleApiError(error, operation) {
    console.error(`API Error in ${operation}:`, error);

    let message = API_CONFIG.ERROR_MESSAGES.PROCESSING_FAILED;

    if (error.code === 'ECONNABORTED') {
      message = API_CONFIG.ERROR_MESSAGES.TIMEOUT;
    } else if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 400:
          message = error.response.data?.message || 'Invalid request';
          break;
        case 404:
          message = 'Service not found';
          break;
        case 413:
          message = 'File too large';
          break;
        case 500:
          message = API_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          message = `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      // Network error
      message = API_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
    }

    return {
      success: false,
      message,
      error: error.message
    };
  }
}

export default ApiService; 