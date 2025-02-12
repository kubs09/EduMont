import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError, UpdateUserData } from '@frontend/types/shared';

export interface User {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  phone?: string;
  admission_status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

export interface InviteUserData {
  email: string;
  role: string;
  language?: string;
  admissionId?: number; // Add this field
}

export const updateUser = async (userId: number, userData: UpdateUserData): Promise<User> => {
  try {
    const response = await api.put<User>(`/api/users/${userId}`, userData);
    localStorage.setItem('userName', `${response.data.firstname} ${response.data.surname}`);
    localStorage.setItem('userEmail', response.data.email);
    localStorage.setItem('userPhone', response.data.phone || '');
    if (response.data.admission_status) {
      localStorage.setItem('admissionStatus', response.data.admission_status);
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(error.response?.data?.error || 'Update failed', error.response?.status);
    }
    throw error;
  }
};

export const inviteUser = async (data: InviteUserData): Promise<void> => {
  try {
    await api.post('/api/users', data);
    // Update admission request status to invited after successful invitation
    if (data.admissionId) {
      await api.post(`/api/admission/admin/admissions/${data.admissionId}/set-invited`);
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to send invitation',
        error.response?.status
      );
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
