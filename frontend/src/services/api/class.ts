import { AxiosError } from 'axios';
import api from '../apiConfig';
import { Class, CreateClassData, UpdateClassData } from '@frontend/types/class';
import { ApiError } from '@frontend/types/shared';

export const getClasses = async (): Promise<Class[]> => {
  try {
    const response = await api.get<Class[]>('/api/classes');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch classes',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getClass = async (id: number): Promise<Class> => {
  try {
    const response = await api.get<Class>(`/api/classes/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch class',
        error.response?.status
      );
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
      throw new ApiError(
        error.response?.data?.error || 'Failed to create class',
        error.response?.status
      );
    }
    throw error;
  }
};

export const updateClass = async (classData: UpdateClassData): Promise<void> => {
  try {
    const data = {
      ...classData,
      min_age: Number(classData.min_age),
      max_age: Number(classData.max_age),
    };
    await api.put(`/api/classes/${data.id}`, data);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to update class',
        error.response?.status
      );
    }
    throw error;
  }
};

export const deleteClass = async (classId: number): Promise<void> => {
  try {
    await api.delete(`/api/classes/${classId}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to delete class',
        error.response?.status
      );
    }
    throw error;
  }
};

export const autoAssignClasses = async (): Promise<void> => {
  try {
    await api.post('/api/classes/auto-assign');
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to auto-assign classes',
        error.response?.status
      );
    }
    throw error;
  }
};

export const confirmClassChild = async (classId: number, childId: number): Promise<Class> => {
  try {
    const response = await api.post(`/api/classes/${classId}/children/${childId}/confirm`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to confirm child',
        error.response?.status
      );
    }
    throw error;
  }
};
