import { Teacher } from './shared';
import { Child } from './child';

export interface ClassChild extends Child {
  parent_names?: string;
}

export interface Class {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teachers: Teacher[];
  children: ClassChild[];
}

export interface CreateClassData {
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teacherIds: number[];
}

export interface UpdateClassData extends CreateClassData {
  id: number;
}
