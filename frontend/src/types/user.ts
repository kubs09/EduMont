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
  role: 'teacher' | 'parent' | 'admin';
  phone?: string;
}

export interface UpdateUserData {
  firstname: string;
  surname: string;
  email: string;
  phone?: string;
}

export interface UserTableProps {
  data: User[];
  loading?: boolean;
  error?: string | null;
  onDelete: (userId: number) => void;
}
