import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for logging and auth token injection
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to track request duration
    config.metadata = { startTime: new Date() };
    
    // Could add auth token here if needed
    // const token = localStorage.getItem('auth-token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log request duration in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    } else if (error.response.status === 401) {
      // Could handle auth redirect here
      error.message = 'Authentication required.';
    } else if (error.response.status === 403) {
      error.message = 'Access denied.';
    } else if (error.response.status >= 500) {
      error.message = error.response.data?.error || 'Server error. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
