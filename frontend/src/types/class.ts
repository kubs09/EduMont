import { Teacher } from './teacher';

export interface ClassChild {
  id: number;
  firstname: string;
  surname: string;
  age: number;
  parent: string;
  parent_id: number;
  parent_email: string;
  parent_contact: string;
  confirmed: boolean; // Make this required, not optional
}

export interface Class {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teachers: Teacher[];
  children: ClassChild[]; // Use the ClassChild interface
}
