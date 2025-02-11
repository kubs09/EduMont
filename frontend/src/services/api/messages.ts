import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError, User } from '@frontend/types/shared';
import { Message } from '@frontend/types/messages';

export const getMessages = async (): Promise<Message[]> => {
  try {
    const response = await api.get<Message[]>('/api/messages');
    return response.data;
  } catch (error) {
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

export const sendMessage = async (data: {
  to_user_ids: number[];
  subject: string;
  content: string;
  language: string;
}): Promise<Message> => {
  try {
    const response = await api.post<Message>('/api/messages', data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
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
