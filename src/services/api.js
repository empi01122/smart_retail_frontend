import axios from 'axios';

export const getBaseURL = () => {
  return 'https://smart-retail-backend-sv1w.onrender.com';
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