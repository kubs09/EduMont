import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError, UpdateUserData } from '@frontend/types/shared';

export const updateUser = async (userId: number, userData: UpdateUserData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    localStorage.setItem('userName', `${response.data.firstname} ${response.data.surname}`);
    localStorage.setItem('userEmail', response.data.email);
    localStorage.setItem('userPhone', response.data.phone || '');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(error.response?.data?.error || 'Update failed', error.response?.status);
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
      throw new ApiError(
        error.response?.data?.error || 'Password change failed',
        error.response?.status
      );
    }
    throw error;
  }
};

export const updateNotificationSettings = async (
  userId: number,
  settings: { messageNotifications: boolean }
): Promise<void> => {
  try {
    await api.put(`/api/users/${userId}/notifications`, settings);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to update notification settings',
        error.response?.status
      );
    }
    throw error;
  }
};
