import axios from 'axios';
import { supabase } from './supabase'; // Correctly import supabase

// Base URL for the API
// Use VITE_API_BASE_URL, falling back to localhost:8080 for safety during dev if env is missing
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// --- Store for CSRF token value read from response header ---
let csrfTokenValue: string | null = null; // Use internal variable to store token

// Helper functions (internal to this module)
function getCsrfToken(): string | null {
  return csrfTokenValue;
}

function setCsrfToken(token: string | null): void {
  csrfTokenValue = token;
}

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL, // Use the correct variable here
  withCredentials: true, // Send cookies with requests (important for CSRF/session)
});

// --- Axios Request Interceptor ---
apiClient.interceptors.request.use(
  async (config) => {
    // Attach Supabase Auth token if available
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Attach CSRF token for non-GET requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const tokenToSend = getCsrfToken();
      
      if (tokenToSend) {
        config.headers['X-CSRF-Token-Header'] = tokenToSend;
      } else {
        // Keep warning for missing token on state-changing requests
        console.warn(`⚠️ [apiClient] CSRF token needed but not found for ${config.method} ${config.url}`);
      }
    } 

    return config;
  },
  (error) => {
    // Keep request error log
    console.error('❌ [apiClient] Request preparation error:', error);
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor ---
apiClient.interceptors.response.use(
  (response) => {
    // Store CSRF token from response header if present
    const tokenFromHeader = response.headers['x-csrf-token-value'];
    
    if (tokenFromHeader) {
      setCsrfToken(tokenFromHeader);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging based on URL patterns
    const url = error.config?.url || 'unknown URL';
    const status = error.response?.status || 'no status';
    
    console.error(`❌ [apiClient] Error: ${status} for ${url}`);
    
    if (error.code === 'ERR_NETWORK') {
      console.error("❌ [apiClient] Network Error: Server might be down or CORS issue persists.");
    }
    
    // Log response data for debugging if available
    if (error.response?.data) {
      console.error("❌ [apiClient] Response data:", error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 