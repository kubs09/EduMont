import api from '../apiConfig';

export interface AdmissionStep {
  step_id: number;
  name: string;
  description: string;
  required_documents: string[];
  order_index: number;
  status: 'pending' | 'pending_review' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  admin_notes?: string;
  appointment_id?: number;
  preferred_online?: boolean;
  appointment?: {
    date: string;
    online: boolean;
    preferred_online?: boolean;
  };
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
  phone: string | null; // Changed from string to string | null
  child_firstname: string;
  child_surname: string;
  date_of_birth: string;
  message?: string | null; // Added null as possible type
}

export interface AdmissionRequestDetails extends Omit<AdmissionRequest, 'message'> {
  id: number;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  message?: string;
  denial_reason?: string;
}

export interface PendingAdmissionUser {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  created_at: string;
  current_step: {
    step_id: number;
    name: string;
    status: string;
  };
}

export interface Appointment {
  id: number;
  date: string;
  online: boolean;
  available_spots: number;
}

export interface AdmissionTerm {
  id: number;
  name: string;
  start_date: string;
}

export interface InfoMeeting {
  id: number;
  date: string;
  capacity: number;
  online: boolean;
  available_spots: number;
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
  approveAdmission: async (id: number, language: string): Promise<void> => {
    await api.post(`/api/admission/admin/admissions/${id}/approve`, { language });
  },

  // Admin: Deny admission with reason
  denyAdmission: async (id: number, reason: string, language: string): Promise<void> => {
    await api.post(`/api/admission/admin/admissions/${id}/deny`, { reason, language });
  },

  // Admin: Get all users with pending admission progress
  getPendingAdmissionUsers: async (): Promise<PendingAdmissionUser[]> => {
    const response = await api.get('/api/admission/admin/pending-users');
    return response.data;
  },

  // Admin: Get detailed admission progress for a user
  getUserAdmissionProgress: async (userId: number): Promise<AdmissionStatus> => {
    const response = await api.get(`/api/admission/admin/users/${userId}/progress`);
    return response.data;
  },

  // Get available appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get('/api/admission/appointments');
    return response.data;
  },

  // Schedule appointment (simplified)
  scheduleAppointment: async (
    appointmentId: number,
    preferredOnline: boolean
  ): Promise<{ status: string }> => {
    const response = await api.post(`/api/admission/appointments/${appointmentId}`, {
      preferredOnline,
    });
    return response.data;
  },

  getTerms: async (): Promise<InfoMeeting[]> => {
    const response = await api.get('/api/admission/terms');
    return response.data;
  },

  submitTermSelection: async (termId: number): Promise<void> => {
    await api.post('/api/admission/term', { termId });
  },

  initializeAdmission: async (): Promise<void> => {
    await api.post('/api/admission/initialize');
  },

  reviewAppointment: async (
    userId: number,
    data: {
      status: 'approved' | 'rejected';
      adminNotes?: string;
    }
  ): Promise<void> => {
    await api.post(`/api/admission/admin/appointments/${userId}/review`, data);
  },
};
