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

export interface MessageDetailProps {
  message: Message | null;
  onDelete: (id: number) => void;
  onCompose: () => void;
  translations: {
    from: string;
    to: string;
    title: string;
    compose: string;
    delete: string;
  };
}
export interface MessageListProps {
  messages: Message[];
  selectedMessageId?: number;
  currentUserId: number;
  onMessageClick: (id: number) => void;
  emptyMessage: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortChange: (direction: 'asc' | 'desc') => void;
}
