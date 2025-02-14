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
  phone: string | null;
  child_firstname: string;
  child_surname: string;
  date_of_birth: string;
  message?: string | null;
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

export interface AdminTableTexts {
  table: {
    name: Record<string, string>;
    parent: Record<string, string>;
    email: Record<string, string>;
    phone: Record<string, string>;
    date: Record<string, string>;
    age: Record<string, string>;
    status: Record<string, string>;
    actions: Record<string, string>;
  };
  approve: Record<string, string>;
  deny: Record<string, string>;
}

export interface AdmissionRequestProps {
  admissions: AdmissionRequestDetails[];
  onApprove: (admission: AdmissionRequestDetails) => void;
  onDeny: (admission: AdmissionRequestDetails) => void;
  calculateAge: (dob: string) => number;
  getStatusBadge: (status: string) => React.ReactElement;
  language: string;
  loadingApproval?: number;
  loadingDenial?: number;
  texts: AdminTableTexts;
}
