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

export const requestPasswordReset = async (email: string, language: string): Promise<void> => {
  try {
    await api.post('/api/forgot-password', { email, language });
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Password reset request failed';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const checkResetToken = async (token: string): Promise<boolean> => {
  try {
    // Clean the token - remove any URL parts if present
    const cleanToken = token.includes('=') ? token.split('=').pop() : token;

    if (!cleanToken) {
      console.error('Invalid token format');
      return false;
    }

    const response = await api.get(`/api/check-token/${cleanToken}`);
    return response.data.valid && !response.data.expired;
  } catch (error) {
    console.error('Token check failed:', error);
    return false;
  }
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  // Clean the token first
  const cleanToken = token.includes('=') ? token.split('=').pop() : token;

  if (!cleanToken) {
    throw new ApiError('Reset token is missing', 400);
  }

  console.log('Sending reset request:', {
    tokenLength: cleanToken.length,
    token: cleanToken,
  });

  try {
    // Check token validity first
    const isValid = await checkResetToken(cleanToken);
    if (!isValid) {
      throw new ApiError('Invalid or expired reset token', 400);
    }

    await api.post('/api/reset-password', { token: cleanToken, password });
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error;

      if (status === 400) {
        throw new ApiError('Invalid or expired reset token', status);
      }
      throw new ApiError(message || 'Failed to reset password', status);
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

interface Teacher {
  id: number;
  firstname: string;
  surname: string;
}

interface ClassChild {
  id: number;
  firstname: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Teacher[];
  children: ClassChild[];
}

interface CreateClassData {
  name: string;
  description: string;
  teacherIds: number[];
  childrenIds: number[];
}

interface UpdateClassData extends CreateClassData {
  id: number;
}

export const getClasses = async (): Promise<Class[]> => {
  try {
    const response = await api.get<Class[]>('/api/classes');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to fetch classes';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const createClass = async (classData: CreateClassData): Promise<{ id: number }> => {
  try {
    const response = await api.post<{ id: number }>('/api/classes', classData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to create class';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const updateClass = async (classData: UpdateClassData): Promise<void> => {
  try {
    await api.put(`/api/classes/${classData.id}`, classData);
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to update class';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export const deleteClass = async (classId: number): Promise<void> => {
  try {
    await api.delete(`/api/classes/${classId}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to delete class';
      throw new ApiError(message, status);
    }
    throw error;
  }
};

export default api;
