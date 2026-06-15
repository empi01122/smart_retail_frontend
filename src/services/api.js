import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  try {
    const url = new URL(envUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, '');
  } catch (e) {
    return envUrl;
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically append scoped enterprise ID for Technician impersonation
api.interceptors.request.use((config) => {
  const activeEntId = localStorage.getItem('active_enterprise_id');
  if (activeEntId) {
    config.params = {
      ...config.params,
      enterprise_id: activeEntId
    };
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to set the token globally for all subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;