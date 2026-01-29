export interface Message {
  id: number;
  subject: string;
  content: string;
  from_user_id: number;
  to_user_id: number;
  created_at: string;
  read_at: string | null;
  from_user?: {
    firstname: string;
    surname: string;
    email: string;
  };
  to_user?: {
    firstname: string;
    surname: string;
    email: string;
  };
  recipients?: Array<{
    id: number;
    firstname: string;
    surname: string;
    email: string;
  }>;
}

export interface SendMessageData {
  to_user_ids: number[];
  subject: string;
  content: string;
  language: string;
}
