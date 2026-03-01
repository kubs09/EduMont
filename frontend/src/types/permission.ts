export interface PermissionRequestData {
  resource_type: string;
  resource_id: number;
  reason: string;
  language: 'cs' | 'en';
}

export interface PermissionRequestResponse {
  message: string;
  recipients_count: number;
  already_requested: boolean;
}

export interface PermissionCheckResponse {
  already_requested: boolean;
}

export interface PresentationPermissionResponse {
  has_access: boolean;
}

export interface PendingPermissionRequest {
  id: number;
  admin_id: number;
  class_id: number;
  firstname: string;
  surname: string;
  email: string;
}

export interface PendingPermissionsResponse {
  has_pending: boolean;
  requests: PendingPermissionRequest[];
}
