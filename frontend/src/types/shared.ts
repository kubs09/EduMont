export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export interface User {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  role: string;
  phone?: string;
}

export interface Teacher extends User {
  role: 'teacher';
}

export interface Parent extends User {
  role: 'parent';
}

export interface Admin extends User {
  role: 'admin';
}

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

export interface UpdateUserData {
  firstname: string;
  surname: string;
  email: string;
  phone?: string;
}

// ... Add all other interfaces (Child, CreateChildData, UpdateChildData, etc.) ...
