import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
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

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

interface LoginResponse {
  token: string;
  email: string;
  firstname: string;
  surname: string;
  role: string;
  id: number; // Add id to the interface
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/api/login', {
      email,
      password,
    });
    console.log('Login response:', response.data); // Add debug logging
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Authentication failed';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

interface UpdateUserData {
  firstname: string;
  surname: string;
  email: string;
}

export const updateUser = async (userId: number, userData: UpdateUserData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Update failed';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  try {
    const response = await api.put(`/api/users/${userId}/password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Password change failed';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  contact: string;
  notes: string;
  parent_firstname?: string;
  parent_surname?: string;
  parent_email?: string;
}

interface CreateChildData {
  firstname: string;
  surname: string;
  date_of_birth: string;
  parent_id: number;
  contact: string;
  notes?: string;
}

interface UpdateChildData extends CreateChildData {
  id: number;
}

export const getChildren = async (): Promise<Child[]> => {
  try {
    const response = await api.get<Child[]>('/api/children');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to fetch children';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const createChild = async (childData: CreateChildData): Promise<Child> => {
  try {
    const response = await api.post<Child>('/api/children', childData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to create child';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const updateChild = async (childData: UpdateChildData): Promise<Child> => {
  try {
    const response = await api.put<Child>(`/api/children/${childData.id}`, childData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to update child';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export default api;
