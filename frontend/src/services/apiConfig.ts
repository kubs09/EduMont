import axios, { InternalAxiosRequestConfig } from 'axios';
import { languageService } from './languageService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type');
      return {
        ...config,
        transformRequest: [(data: FormData) => data],
      };
    }

    // Regular request handling
    const langConfig = languageService.getRequestConfig();

    // Use proper header methods
    Object.entries(langConfig.headers).forEach(([key, value]) => {
      config.headers.set(key, value);
    });

    if (['post', 'put'].includes(config.method?.toLowerCase() || '')) {
      config.data = {
        ...config.data,
        ...langConfig.data,
      };
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

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
