import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError } from '@frontend/types/shared';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstname: string;
    surname: string;
    role: 'admin' | 'teacher' | 'parent';
    admission_status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  };
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data.user.id.toString());
    localStorage.setItem('userRole', response.data.user.role);
    localStorage.setItem(
      'userName',
      `${response.data.user.firstname} ${response.data.user.surname}`
    );
    if (response.data.user.admission_status) {
      localStorage.setItem('admissionStatus', response.data.user.admission_status);
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Authentication failed',
        error.response?.status
      );
    }
    throw error;
  }
};

export const requestPasswordReset = async (email: string, language: string): Promise<void> => {
  try {
    const response = await api.post('/api/forgot-password', {
      email: email.toLowerCase(),
      language,
    });

    if (!response.data.success) {
      throw new Error('Failed to send reset email');
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timed out', 408);
      }
      throw new ApiError(
        error.response?.data?.error || 'Failed to send reset email',
        error.response?.status
      );
    }
    throw new ApiError('Failed to send reset email', 500);
  }
};

export const checkResetToken = async (token: string): Promise<boolean> => {
  try {
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
  const cleanToken = token.includes('=') ? token.split('=').pop() : token;
  if (!cleanToken) {
    throw new ApiError('Reset token is missing', 400);
  }

  try {
    const isValid = await checkResetToken(cleanToken);
    if (!isValid) {
      throw new ApiError('Invalid or expired reset token', 400);
    }
    await api.post('/api/reset-password', { token: cleanToken, password });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to reset password',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getCurrentUser = async (): Promise<AuthResponse['user']> => {
  try {
    const response = await api.get<AuthResponse['user']>('/api/auth/me');
    if (response.data.admission_status) {
      localStorage.setItem('admissionStatus', response.data.admission_status);
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch current user',
        error.response?.status
      );
    }
    throw error;
  }
};
