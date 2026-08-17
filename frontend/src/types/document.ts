export interface Document {
  id: number;
  title: string;
  description?: string | null;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  class_id?: number | null;
  child_id?: number | null;
  created_at: string;
  updated_at: string;
  class_name?: string | null;
  child_firstname?: string | null;
  child_surname?: string | null;
  created_by_firstname?: string | null;
  created_by_surname?: string | null;
  updated_by_firstname?: string | null;
  updated_by_surname?: string | null;
}

export interface CreateDocumentData {
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  class_id?: number;
  child_id?: number;
}

export interface UpdateDocumentData extends CreateDocumentData {
  id: number;
}

export interface DocumentFilters {
  class_id?: number;
  child_id?: number;
  created_by?: number;
}
