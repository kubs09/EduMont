export interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  notes: string;
  age: number;
  parents: ParentSummary[];
  class_id?: number;
  class_name?: string;
}

export interface ParentSummary {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  phone?: string;
}

export interface CreateChildData {
  firstname: string;
  surname: string;
  date_of_birth: string;
  parent_ids: number[];
  notes?: string;
}

export interface UpdateChildData {
  id: number;
  firstname?: string;
  surname?: string;
  date_of_birth?: string;
  parent_ids?: number[];
  notes?: string;
}
