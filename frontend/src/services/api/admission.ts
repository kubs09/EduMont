import api from '../apiConfig';

export interface AdmissionStep {
  step_id: number;
  name: string;
  description: string;
  required_documents: string[];
  order_index: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface AdmissionStatus {
  admission_status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  steps: AdmissionStep[];
}

export interface PendingSubmission {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  step_id: number;
  step_name: string;
  status: string;
  submitted_at: string;
}

export interface AdmissionRequest {
  firstname: string;
  surname: string;
  email: string;
  phone: string;
  child_firstname: string;
  child_surname: string;
  date_of_birth: string;
  message?: string;
}

export interface AdmissionRequestDetails extends Omit<AdmissionRequest, 'message'> {
  id: number;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  message?: string;
  denial_reason?: string;
}

export const admissionService = {
  // Get current admission status and steps
  getStatus: async (): Promise<AdmissionStatus> => {
    const response = await api.get('/api/admission/status');
    return response.data;
  },

  // Submit documents and data for a step
  submitStep: async (stepId: number, formData: FormData): Promise<void> => {
    await api.post(`/api/admission/submit/${stepId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Admin: Get all pending submissions
  getPendingSubmissions: async (): Promise<PendingSubmission[]> => {
    const response = await api.get('/api/admission/pending');
    return response.data;
  },

  // Admin: Review a submission
  reviewSubmission: async (
    userId: number,
    stepId: number,
    data: {
      status: 'approved' | 'rejected';
      adminNotes?: string;
    }
  ): Promise<void> => {
    await api.post(`/api/admission/${userId}/review/${stepId}`, data);
  },

  requestAdmission: async (data: AdmissionRequest): Promise<void> => {
    await api.post('/api/admission/request', data);
  },

  // Admin: Get all admission requests
  getAdmissionRequests: async (): Promise<AdmissionRequestDetails[]> => {
    const response = await api.get('/api/admission/admin/admissions');
    return response.data;
  },

  // Admin: Approve admission and send invitation
  approveAdmission: async (id: number): Promise<void> => {
    await api.post(`/api/admission/admin/admissions/${id}/approve`); // Fixed path
  },

  // Admin: Deny admission with reason
  denyAdmission: async (id: number, reason: string): Promise<void> => {
    await api.post(`/api/admission/admin/admissions/${id}/deny`, { reason }); // Fixed path
  },
};
