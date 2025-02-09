export interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  notes: string;
  parent_firstname?: string;
  parent_surname?: string;
  parent_email?: string;
  parent_contact?: string;
}
