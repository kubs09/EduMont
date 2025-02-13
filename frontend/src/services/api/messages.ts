import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError, User } from '@frontend/types/shared';
import { Message } from '@frontend/types/messages';
import { AdmissionRequiredError } from '../../types/errors';

export const getMessages = async (): Promise<Message[]> => {
  const admissionStatus = localStorage.getItem('admissionStatus');
  const userRole = localStorage.getItem('userRole');

  if (userRole === 'parent' && admissionStatus !== 'completed') {
    throw new AdmissionRequiredError();
  }

  try {
    const response = await api.get<Message[]>('/api/messages');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 403) {
      throw new AdmissionRequiredError();
    }
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch messages',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getMessage = async (id: number): Promise<Message> => {
  try {
    const response = await api.get<Message>(`/api/messages/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch message',
        error.response?.status
      );
    }
    throw error;
  }
};

export const sendMessage = async (messageData: Omit<Message, 'id'>): Promise<Message> => {
  try {
    const admissionStatus = localStorage.getItem('admissionStatus');
    const userRole = localStorage.getItem('userRole');

    if (admissionStatus !== 'completed' && userRole === 'parent') {
      throw new ApiError('Please complete the admission process first', 403);
    }

    const response = await api.post('/api/messages', messageData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to send message',
        error.response?.status
      );
    }
    throw error;
  }
};

export const deleteMessage = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/messages/${id}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to delete message',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getMessageUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>('/api/messages/users');
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch users',
        error.response?.status
      );
    }
    throw new Error('Failed to fetch users');
  }
};
