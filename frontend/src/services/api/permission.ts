import { AxiosError } from 'axios';
import api from '../apiConfig';
import { ApiError } from '@frontend/types/shared';

export interface PermissionRequestData {
  resource_type?: string;
  resource_id?: number;
  reason?: string;
  language: string;
}

export interface PermissionRequestResponse {
  message: string;
  recipients_count: number;
  already_requested: boolean;
}

export interface PermissionCheckResponse {
  already_requested: boolean;
}

export const checkPermissionRequest = async (
  resource_id: number
): Promise<PermissionCheckResponse> => {
  try {
    const response = await api.get<PermissionCheckResponse>(
      `/api/permissions/check?resource_id=${resource_id}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to check permission request',
        error.response?.status
      );
    }
    throw error;
  }
};

export const requestPermission = async (
  data: PermissionRequestData
): Promise<PermissionRequestResponse> => {
  try {
    const response = await api.post<PermissionRequestResponse>('/api/permissions/request', data);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to send permission request',
        error.response?.status
      );
    }
    throw error;
  }
};

export const acceptPermissionRequest = async (class_id: number): Promise<void> => {
  try {
    await api.post('/api/permissions/accept', { class_id });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to accept permission request',
        error.response?.status
      );
    }
    throw error;
  }
};

export const denyPermissionRequest = async (class_id: number): Promise<void> => {
  try {
    await api.post('/api/permissions/deny', { class_id });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to deny permission request',
        error.response?.status
      );
    }
    throw error;
  }
};
