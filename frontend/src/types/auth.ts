export interface LoginResponse {
  token: string;
  email: string;
  firstname: string;
  surname: string;
  role: string;
  id: number;
  phone: string;
  messageNotifications: boolean;
}

export interface PasswordResetRequest {
  email: string;
  language: string;
}

export interface PasswordResetConfirmation {
  token: string;
  password: string;
}
