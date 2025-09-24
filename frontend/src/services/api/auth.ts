import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError, LoginResponse } from '@frontend/types/shared';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Making login request to:', '/api/login');
    const response = await api.post<LoginResponse>('/api/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: response.data.id,
        email: response.data.email,
        firstname: response.data.firstname,
        surname: response.data.surname,
        role: response.data.role,
      })
    );
    localStorage.setItem('userPhone', response.data.phone || '');
    localStorage.setItem(
      'userSettings',
      JSON.stringify({
        messageNotifications: response.data.messageNotifications,
      })
    );
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      error,
      isAxiosError: error instanceof AxiosError,
      response: error instanceof AxiosError ? error.response : null,
      config: error instanceof AxiosError ? error.config : null,
    });
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
