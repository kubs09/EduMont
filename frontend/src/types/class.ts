import { Child } from './child';

export interface ClassChild extends Child {
  parent_names?: string;
}

export interface ClassTeacher {
  id: number;
  firstname: string;
  surname: string;
  class_role: 'teacher' | 'assistant';
}

export interface Class {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teachers: ClassTeacher[];
  children: ClassChild[];
}

export interface CreateClassData {
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teacherId: number;
  assistantId?: number | null;
}

export interface UpdateClassData extends CreateClassData {
  id: number;
}
