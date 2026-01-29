import axios from 'axios';

// Determine the base URL with fallback logic
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
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
  timeout: 30000,
  withCredentials: true,
});

const testConnection = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('✅ Server connection successful:', response.data);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Server connection failed:', error.message);
      console.warn('Make sure backend is running on localhost:5000');
      console.warn('Current baseURL:', baseURL);
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

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      if (!window.location.pathname.includes('/unauthorized')) {
        window.location.href = '/unauthorized';
      }
    }

    throw error;
  }
);

export default api;
