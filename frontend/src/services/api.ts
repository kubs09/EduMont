import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
);

interface LoginResponse {
  token: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  // Log the complete URL being used
  const loginUrl = `${process.env.REACT_APP_API_URL}/auth/signin`;
  console.log('Attempting login with complete URL:', loginUrl);

  try {
    const response = await api.post<LoginResponse>('/auth/signin', {
      email,
      password,
    });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Log the complete request details
      console.log('Request details:', {
        method: error.config?.method,
        fullUrl: (error.config?.baseURL ?? '') + (error.config?.url ?? ''),
        headers: error.config?.headers,
        data: error.config?.data,
      });

      if (error.response?.status === 404) {
        throw new Error('Login service is not available. Please try again later.');
      }
      const message = error.response?.data?.message || 'Authentication failed';
      throw new Error(message);
    }
    throw error;
  }
};

export default api;
