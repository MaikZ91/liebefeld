export interface ChatMessage {
  id: string;
  group_id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
  media_url?: string | null;
  reactions?: { emoji: string; users: string[] }[] | null;
  read_by?: string[] | null;
}

export interface TypingUser {
  username: string;
  avatar?: string;
  isTyping: boolean;
}

export interface EventShare {
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export const USERNAME_KEY = 'community_chat_username';

export interface ChatQuery {
  id?: string;
  query: string;
  created_at?: string;
}
