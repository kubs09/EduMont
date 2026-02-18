import { Presentation } from '@frontend/types/presentation';
import api from '../apiConfig';

// Presentation APIs module

export interface CreatePresentationData {
  child_id: number;
  class_id: number;
  name: string;
  category?: string;
  display_order?: number;
  status?: 'prerequisites not met' | 'to be presented' | 'presented' | 'practiced' | 'mastered';
  notes?: string;
}

export interface UpdatePresentationData extends CreatePresentationData {
  id: number;
}

export const getAllPresentations = async (filters?: {
  status?: string;
}): Promise<Presentation[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const url = `/api/presentations${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

export const getChildPresentations = async (
  childId: number,
  filters?: { status?: string }
): Promise<Presentation[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const url = `/api/presentations/child/${childId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

export const getClassPresentations = async (
  classId: number,
  filters?: { status?: string }
): Promise<Presentation[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const url = `/api/presentations/class/${classId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

export const createPresentation = async (
  presentationData: CreatePresentationData
): Promise<Presentation> => {
  const response = await api.post('/api/presentations', presentationData);
  return response.data;
};

export const updatePresentation = async (
  presentationData: UpdatePresentationData
): Promise<Presentation> => {
  const { id, ...data } = presentationData;
  const response = await api.put(`/api/presentations/${id}`, data);
  return response.data;
};

export const deletePresentation = async (id: number): Promise<void> => {
  await api.delete(`/api/presentations/${id}`);
};

export const updateChildPresentationStatus = async (
  childId: number,
  presentationId: number,
  newStatus: string,
  notes?: string
): Promise<void> => {
  await api.put(`/api/presentations/children/${childId}/${presentationId}/status`, {
    status: newStatus,
    notes,
  });
};

export const reorderChildPresentations = async (
  childId: number,
  presentationId: number,
  direction: 'up' | 'down'
): Promise<void> => {
  await api.put(`/api/presentations/children/${childId}/${presentationId}/reorder`, {
    direction,
  });
};

// Curriculum

export interface CategoryPresentation {
  id: number;
  category: string;
  name: string;
  age_group: string;
  display_order: number;
  notes?: string;
  created_at: string;
}

export interface CreateCategoryPresentationData {
  category: string;
  name: string;
  age_group: string;
  display_order: number;
  notes?: string;
}

export interface UpdateCategoryPresentationData {
  id: number;
  category?: string;
  name?: string;
  age_group?: string;
  display_order?: number;
  notes?: string;
}

// Get all category presentations
export const getAllCategoryPresentations = async (): Promise<CategoryPresentation[]> => {
  const response = await api.get('/api/presentations/categories');
  return response.data;
};

// Get categories list
export const getCategories = async (): Promise<string[]> => {
  const response = await api.get('/api/presentations/categories/list/categories');
  return response.data;
};

// Get presentations by category
export const getPresentationsByCategory = async (
  category: string
): Promise<CategoryPresentation[]> => {
  const response = await api.get(
    `/api/presentations/categories/category/${encodeURIComponent(category)}`
  );
  return response.data;
};

// Create a new category presentation
export const createCategoryPresentation = async (
  data: CreateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const response = await api.post('/api/presentations/categories', data);
  return response.data;
};

// Update a category presentation
export const updateCategoryPresentation = async (
  data: UpdateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const { id, ...updateData } = data;
  const response = await api.put(`/api/presentations/categories/${id}`, updateData);
  return response.data;
};

// Delete a category presentation
export const deleteCategoryPresentation = async (id: number): Promise<void> => {
  await api.delete(`/api/presentations/categories/${id}`);
};
