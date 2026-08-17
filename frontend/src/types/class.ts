import { Child } from './child';

export interface ClassChild extends Child {
  parent_names?: string;
}

export interface ClassTeacher {
  id: number;
  firstname: string;
  surname: string;
  class_role: 'teacher' | 'assistant';
  permission_requested?: boolean;
}

export interface Class {
  id: number;
  name: string;
  description: string;
  age_group: string;
  min_age: number;
  max_age: number;
  teachers: ClassTeacher[];
  children: ClassChild[];
}

export interface CreateClassData {
  name: string;
  description: string;
  age_group: string;
  min_age: number;
  max_age: number;
  teacherId: number;
  assistantId?: number | null;
}

export interface UpdateClassData extends CreateClassData {
  id: number;
}

export interface NextPresentation {
  id: number;
  child_id: number;
  class_id: number;
  name: string;
  category?: string;
  status: string;
  notes?: string;
  class_name: string;
  child_firstname: string;
  child_surname: string;
  created_by_firstname?: string;
  created_by_surname?: string;
  updated_by_firstname?: string;
  updated_by_surname?: string;
}

export interface ClassAttendanceRow {
  id: number;
  firstname: string;
  surname: string;
  attendance_date: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  checked_in_by: number | null;
  checked_out_by: number | null;
  notes: string | null;
}
