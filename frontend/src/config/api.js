// API Configuration for Walmart AI Assistant
const API_CONFIG = {
  // Backend URL - can be overridden by environment variable
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
  
  // API Endpoints
  ENDPOINTS: {
    PING: '/ping',
    RESPOND: '/respond',
    UPLOAD_DOC: '/upload-doc',
    GET_OCR: '/get-OCR',
  },
  
  // Request timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 60000,  // 60 seconds for file uploads
  },
  
  // File upload settings
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
  },
  
  // Error messages
  ERROR_MESSAGES: {
    CONNECTION_FAILED: 'Unable to connect to the AI service. Please check your connection.',
    UPLOAD_FAILED: 'Failed to upload file. Please try again.',
    PROCESSING_FAILED: 'Failed to process your request. Please try again.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
  }
};

export default API_CONFIG; 