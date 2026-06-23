import axios from 'axios';

export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  
  const isLocalHost = (host) => {
    return host === 'localhost' || 
           host === '127.0.0.1' || 
           host.startsWith('192.168.') || 
           host.startsWith('10.') || 
           host.startsWith('172.');
  };
  
  const currentHost = window.location.hostname;
  const currentIsLocal = isLocalHost(currentHost);

  if (envUrl) {
    try {
      const url = new URL(envUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        if (currentIsLocal) {
          url.hostname = currentHost;
          return url.toString().replace(/\/$/, '');
        } else {
          return 'https://smart-retail-backend-sv1w.onrender.com';
        }
      }
      return envUrl.replace(/\/$/, '');
    } catch (e) {
      return envUrl.replace(/\/$/, '');
    }
  }

  return currentIsLocal 
    ? `http://${currentHost}:8000` 
    : 'https://smart-retail-backend-sv1w.onrender.com';
};


const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenRetriever = null;

export const registerTokenRetriever = (retriever) => {
  tokenRetriever = retriever;
};

// Request interceptor to automatically append scoped enterprise ID and fresh auth token
api.interceptors.request.use(async (config) => {
  const activeEntId = localStorage.getItem('active_enterprise_id');
  if (activeEntId) {
    config.params = {
      ...config.params,
      enterprise_id: activeEntId
    };
  }

  if (tokenRetriever) {
    try {
      const token = await tokenRetriever();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[API Interceptor] Failed to fetch fresh token:', e);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to set the token globally for all subsequent requests (retained for backward compatibility)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;