export interface Presentation {
  id: number;
  child_id: number;
  class_id: number;
  name: string;
  category?: string;
  display_order?: number;
  status: 'prerequisites not met' | 'to be presented' | 'presented' | 'practiced' | 'mastered';
  notes?: string;
  created_at: string;
  updated_at: string;
  class_name: string;
  child_firstname: string;
  child_surname: string;
  created_by_firstname?: string;
  created_by_surname?: string;
  updated_by_firstname?: string;
  updated_by_surname?: string;
}

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

export type PresentationViewType = 'day' | 'week' | 'month';
