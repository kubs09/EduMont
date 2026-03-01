import {
  Presentation,
  CreatePresentationData,
  UpdatePresentationData,
  PresentationStatus,
} from '@frontend/types/presentation';
import {
  CategoryPresentation,
  CreateCategoryPresentationData,
  UpdateCategoryPresentationData,
} from '@frontend/types/presentation-category';
import api from '../apiConfig';

const buildPresentationUrl = (
  baseUrl: string,
  filters?: { status?: PresentationStatus }
): string => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  const queryString = params.toString();
  return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
};

export const getAllPresentations = async (filters?: {
  status?: PresentationStatus;
}): Promise<Presentation[]> => {
  const url = buildPresentationUrl('/api/presentations', filters);
  const response = await api.get(url);
  return response.data;
};

export const getChildPresentations = async (
  childId: number,
  filters?: { status?: PresentationStatus }
): Promise<Presentation[]> => {
  const url = buildPresentationUrl(`/api/presentations/child/${childId}`, filters);

  const response = await api.get(url);
  return response.data;
};

export const getClassPresentations = async (
  classId: number,
  filters?: { status?: PresentationStatus }
): Promise<Presentation[]> => {
  const url = buildPresentationUrl(`/api/presentations/class/${classId}`, filters);

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
  newStatus: PresentationStatus,
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

export const getAllCategoryPresentations = async (): Promise<CategoryPresentation[]> => {
  const response = await api.get('/api/presentations/categories');
  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await api.get('/api/presentations/categories/list/categories');
  return response.data;
};

export const getPresentationsByCategory = async (
  category: string
): Promise<CategoryPresentation[]> => {
  const response = await api.get(
    `/api/presentations/categories/category/${encodeURIComponent(category)}`
  );
  return response.data;
};

export const createCategoryPresentation = async (
  data: CreateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const response = await api.post('/api/presentations/categories', data);
  return response.data;
};

export const updateCategoryPresentation = async (
  data: UpdateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const { id, ...updateData } = data;
  const response = await api.put(`/api/presentations/categories/${id}`, updateData);
  return response.data;
};

export const deleteCategoryPresentation = async (id: number): Promise<void> => {
  await api.delete(`/api/presentations/categories/${id}`);
};
