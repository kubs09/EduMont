export interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  notes: string;
  age: number;
  parent_id: number;
  parent_firstname: string;
  parent_surname: string;
  parent_email: string;
  parent_contact?: string;
  parent?: string; // computed field
  confirmed?: boolean;
  status?: 'accepted' | 'denied' | 'pending';
}

export interface CreateChildData {
  firstname: string;
  surname: string;
  date_of_birth: string;
  parent_id: number;
  notes?: string;
}

export interface UpdateChildData extends CreateChildData {
  id: number;
}
