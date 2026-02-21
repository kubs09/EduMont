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
}

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
