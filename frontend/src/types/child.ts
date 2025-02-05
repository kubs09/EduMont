export interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  contact: string;
  notes: string;
  parent_firstname?: string;
  parent_surname?: string;
  parent_email?: string;
}
