import { AxiosError } from 'axios';
import api from '../apiConfig';
import { Child, CreateChildData, UpdateChildData } from '@frontend/types/child';
import { ApiError } from '@frontend/types/shared';

export const getChildren = async (): Promise<Child[]> => {
  try {
    const response = await api.get<Child[]>('/api/children');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch children',
        error.response?.status
      );
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
      const message =
        error.response?.data?.details || error.response?.data?.error || 'Failed to create child';
      throw new ApiError(message, error.response?.status);
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
      throw new ApiError(
        error.response?.data?.error || 'Failed to update child',
        error.response?.status
      );
    }
    throw error;
  }
};

export const deleteChild = async (childId: number): Promise<void> => {
  try {
    await api.delete(`/api/children/${childId}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to delete child',
        error.response?.status
      );
    }
    throw error;
  }
};

export interface CreateChildExcuseData {
  date_from: string;
  date_to: string;
  reason: string;
}

export interface ChildExcuse {
  id: number;
  child_id: number;
  parent_id: number;
  date_from: string;
  date_to: string;
  reason: string;
  created_at: string;
  parent_firstname?: string;
  parent_surname?: string;
}

export const createChildExcuse = async (
  childId: number,
  excuseData: CreateChildExcuseData
): Promise<void> => {
  try {
    await api.post(`/api/children/${childId}/excuses`, excuseData);
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data?.details || error.response?.data?.error || 'Failed to create excuse';
      throw new ApiError(message, error.response?.status);
    }
    throw error;
  }
};

export const getChildExcuses = async (childId: number): Promise<ChildExcuse[]> => {
  try {
    const response = await api.get<ChildExcuse[]>(`/api/children/${childId}/excuses`);
    return response.data || [];
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data?.details || error.response?.data?.error || 'Failed to fetch excuses';
      throw new ApiError(message, error.response?.status);
    }
    throw error;
  }
};

export const deleteChildExcuse = async (childId: number, excuseId: number): Promise<void> => {
  try {
    await api.delete(`/api/children/${childId}/excuses/${excuseId}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data?.details || error.response?.data?.error || 'Failed to cancel excuse';
      throw new ApiError(message, error.response?.status);
    }
    throw error;
  }
};
