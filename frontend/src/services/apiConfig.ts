import axios from 'axios';

// Determine the base URL with fallback logic
const getBaseURL = () => {
  // 1. Check if we have an explicit API URL set (from environment variables)
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // 2. Check if we're in production (Vercel or similar)
  if (process.env.NODE_ENV === 'production') {
    // In a monorepo deployment (like Vercel), the frontend and API are on the same domain
    // API calls already include /api/ prefix (e.g., /api/login)
    // So we use empty baseURL to make them relative to current domain
    console.log('📦 Production mode: Using relative URLs with /api prefix');
    return '';
  }

  // 3. Development mode: use local backend servers
  const devUrls = [
    'http://localhost:5000',
    'http://localhost:3001',
    'http://127.0.0.1:5000',
    'http://10.0.1.37:5000',
  ];

  console.log('🔧 Development mode: Using', devUrls[0]);
  return devUrls[0];
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for serverless cold starts
  withCredentials: true,
});

const testConnection = async () => {
  try {
    const response = await api.get('/api/debug');
    console.log('✅ Server connection successful:', response.data);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Server connection failed:', error.message);
      console.warn('Make sure backend is running on localhost:5000');
    }
    return false;
  }
};

if (process.env.NODE_ENV === 'development') {
  testConnection();
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      baseURL: error.config?.baseURL,
    });

    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('🚨 Backend server is not running!');
      console.log('💡 Make sure to start the backend server:');
      console.log('cd backend && npm start');
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw error;
  }
);

export default api;
