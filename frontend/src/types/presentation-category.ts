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
