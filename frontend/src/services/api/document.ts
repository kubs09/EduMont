import api from '../apiConfig';

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

const buildQueryString = (filters?: DocumentFilters) => {
  const params = new URLSearchParams();
  if (filters?.class_id !== undefined) params.append('class_id', String(filters.class_id));
  if (filters?.child_id !== undefined) params.append('child_id', String(filters.child_id));
  if (filters?.created_by !== undefined) params.append('created_by', String(filters.created_by));
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

// Get all documents (admin/teacher, or filtered for parent)
export const getDocuments = async (filters?: DocumentFilters): Promise<Document[]> => {
  const response = await api.get(`/api/documents${buildQueryString(filters)}`);
  return response.data;
};

// Get documents for a specific child
export const getChildDocuments = async (childId: number): Promise<Document[]> => {
  const response = await api.get(`/api/documents/child/${childId}`);
  return response.data;
};

// Get documents for a specific class
export const getClassDocuments = async (classId: number): Promise<Document[]> => {
  const response = await api.get(`/api/documents/class/${classId}`);
  return response.data;
};

// Get a document by id
export const getDocumentById = async (id: number): Promise<Document> => {
  const response = await api.get(`/api/documents/${id}`);
  return response.data;
};

// Create a new document
export const createDocument = async (documentData: CreateDocumentData): Promise<Document> => {
  const response = await api.post('/api/documents', documentData);
  return response.data;
};

// Update an existing document
export const updateDocument = async (documentData: UpdateDocumentData): Promise<Document> => {
  const { id, ...data } = documentData;
  const response = await api.put(`/api/documents/${id}`, data);
  return response.data;
};

// Delete a document
export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/api/documents/${id}`);
};
