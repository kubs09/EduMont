import axios from 'axios';
import { languageService } from './languageService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Use language service to get language configuration
  const langConfig = languageService.getRequestConfig();
  config.headers = Object.assign(config.headers, langConfig.headers);

  if (['post', 'put'].includes(config.method?.toLowerCase() || '')) {
    config.data = {
      ...config.data,
      ...langConfig.data,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers,
    });
    return Promise.reject(error);
  }
);

export default api;
