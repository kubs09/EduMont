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

export interface PresentationPermissionResponse {
  has_access: boolean;
}

export interface PendingPermissionRequest {
  id: number;
  admin_id: number;
  class_id: number;
  firstname: string;
  surname: string;
  email: string;
}

export interface PendingPermissionsResponse {
  has_pending: boolean;
  requests: PendingPermissionRequest[];
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

export const checkPresentationPermission = async (
  resource_id: number
): Promise<PresentationPermissionResponse> => {
  try {
    const response = await api.get<PresentationPermissionResponse>(
      `/api/permissions/granted?resource_id=${resource_id}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to check presentation permission',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getPendingPermissionRequests = async (
  class_id: number
): Promise<PendingPermissionsResponse> => {
  try {
    const response = await api.get<PendingPermissionsResponse>(
      `/api/permissions/pending?class_id=${class_id}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to get pending permission requests',
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

export const acceptPermissionRequest = async (
  class_id: number,
  language: string
): Promise<void> => {
  try {
    await api.post('/api/permissions/accept', { class_id, language });
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

export const denyPermissionRequest = async (class_id: number, language: string): Promise<void> => {
  try {
    await api.post('/api/permissions/deny', { class_id, language });
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
