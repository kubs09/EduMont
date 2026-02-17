import api from '../apiConfig';

export interface CategoryPresentation {
  id: number;
  category: string;
  name: string;
  display_order: number;
  notes?: string;
  created_at: string;
}

export interface CreateCategoryPresentationData {
  category: string;
  name: string;
  display_order: number;
  notes?: string;
}

export interface UpdateCategoryPresentationData {
  id: number;
  category?: string;
  name?: string;
  display_order?: number;
  notes?: string;
}

// Get all category presentations
export const getAllCategoryPresentations = async (): Promise<CategoryPresentation[]> => {
  const response = await api.get('/api/category-presentations');
  return response.data;
};

// Get categories list
export const getCategories = async (): Promise<string[]> => {
  const response = await api.get('/api/category-presentations/list/categories');
  return response.data;
};

// Get presentations by category
export const getPresentationsByCategory = async (
  category: string
): Promise<CategoryPresentation[]> => {
  const response = await api.get(
    `/api/category-presentations/category/${encodeURIComponent(category)}`
  );
  return response.data;
};

// Create a new category presentation
export const createCategoryPresentation = async (
  data: CreateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const response = await api.post('/api/category-presentations', data);
  return response.data;
};

// Update a category presentation
export const updateCategoryPresentation = async (
  data: UpdateCategoryPresentationData
): Promise<CategoryPresentation> => {
  const { id, ...updateData } = data;
  const response = await api.put(`/api/category-presentations/${id}`, updateData);
  return response.data;
};

// Delete a category presentation
export const deleteCategoryPresentation = async (id: number): Promise<void> => {
  await api.delete(`/api/category-presentations/${id}`);
};
