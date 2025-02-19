import api from '../apiConfig';
import {
  AdmissionStatus,
  PendingSubmission,
  AdmissionRequest,
  AdmissionRequestDetails,
  PendingAdmissionUser,
  Appointment,
  InfoMeeting,
  AdminDocument,
} from '../../types/admission';

export const admissionService = {
  // Get current admission status and steps
  getStatus: async (): Promise<AdmissionStatus> => {
    const response = await api.get('/api/admission/status');
    return response.data;
  },

  // Submit documents and data for a step
  submitStep: async (stepId: number, formData: FormData): Promise<void> => {
    try {
      await api.post(`/api/admission/submit/${stepId}`, formData);
    } catch (error) {
      console.error('Upload error:', {
        error,
        formData: Array.from(formData.entries()),
      });
      throw error;
    }
  },

  // Delete all documents for a step
  deleteStepDocuments: async (stepId: number): Promise<void> => {
    await api.delete(`/api/admission/documents/step/${stepId}`);
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
    try {
      await api.post(`/api/admission/review/${userId}/${stepId}`, data);
    } catch (error) {
      console.error('Review submission error:', error);
      throw error;
    }
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
  scheduleAppointment: async (appointmentId: number): Promise<{ status: string }> => {
    const response = await api.post(`/api/admission/appointments/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (): Promise<void> => {
    await api.post('/api/admission/appointments/cancel');
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
  ): Promise<{ status: string; steps: { step_id: number; name: string; status: string }[] }> => {
    const response = await api.post(`/api/admission/admin/appointments/${userId}/review`, data);
    return response.data;
  },

  // Admin: Get documents for a user's step
  getAdminDocuments: async (userId: number, stepId: number): Promise<AdminDocument[]> => {
    const response = await api.get(`/api/admission/admin/documents/${userId}/${stepId}`);
    return response.data;
  },

  // Admin: Download a document
  downloadDocument: async (documentId: number): Promise<Blob> => {
    const response = await api.get(`/api/admission/admin/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
