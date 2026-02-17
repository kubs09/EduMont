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

export const getClassesByAge = async (age: number): Promise<Class[]> => {
  try {
    const response = await api.get<Class[]>(`/api/classes/by-age/${age}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch classes by age',
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

export interface NextPresentation {
  id: number;
  child_id: number;
  class_id: number;
  name: string;
  category?: string;
  status: string;
  notes?: string;
  class_name: string;
  child_firstname: string;
  child_surname: string;
  created_by_firstname?: string;
  created_by_surname?: string;
  updated_by_firstname?: string;
  updated_by_surname?: string;
}

export interface ClassAttendanceRow {
  id: number;
  firstname: string;
  surname: string;
  attendance_date: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  checked_in_by: number | null;
  checked_out_by: number | null;
  notes: string | null;
}

export const getClassNextPresentations = async (classId: number): Promise<NextPresentation[]> => {
  try {
    const response = await api.get<NextPresentation[]>(
      `/api/classes/${classId}/next-presentations`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch next presentations',
        error.response?.status
      );
    }
    throw error;
  }
};

export const getClassAttendance = async (
  classId: number,
  options?: { date?: string; childId?: number }
): Promise<ClassAttendanceRow[]> => {
  try {
    const params = new URLSearchParams();
    if (options?.date) params.append('date', options.date);
    if (options?.childId) params.append('child_id', options.childId.toString());
    const query = params.toString();
    const response = await api.get<ClassAttendanceRow[]>(
      `/api/classes/${classId}/attendance${query ? `?${query}` : ''}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to fetch attendance',
        error.response?.status
      );
    }
    throw error;
  }
};

export const checkInChild = async (
  classId: number,
  childId: number,
  attendanceDate?: string
): Promise<void> => {
  try {
    await api.post(`/api/classes/${classId}/attendance/check-in`, {
      child_id: childId,
      attendance_date: attendanceDate,
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to check in child',
        error.response?.status
      );
    }
    throw error;
  }
};

export const checkOutChild = async (
  classId: number,
  childId: number,
  attendanceDate?: string
): Promise<void> => {
  try {
    await api.post(`/api/classes/${classId}/attendance/check-out`, {
      child_id: childId,
      attendance_date: attendanceDate,
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error || 'Failed to check out child',
        error.response?.status
      );
    }
    throw error;
  }
};
