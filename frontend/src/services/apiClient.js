import axios from 'axios';

const DEFAULT_BACKEND_URL = 'http://ptarta-backend-hpscnq-93202e-76-13-212-186.traefik.me';
const RAW_API_URL = process.env.REACT_APP_API_URL || DEFAULT_BACKEND_URL;
const API_BASE_URL = RAW_API_URL.endsWith('/api')
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/$/, '')}/api`;
const API_KEY = process.env.REACT_APP_API_KEY || 'sk-dev-12345678901234567890';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  if (token) {
    // Use Token authentication (for registered users)
    config.headers.Authorization = `Token ${token}`;
    console.log('[API] Token added to request');
  }

  // Only set Content-Type to JSON if data is not FormData
  if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    console.error('[API Error]', error.message);
    if (error.response) {
      console.error('[API Error Response]', error.response.status, error.response.data);
    }
    // Redirect to login on unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;