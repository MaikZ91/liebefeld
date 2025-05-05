
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
  lastTyped?: Date;
}

export interface EventShare {
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export const USERNAME_KEY = 'community_chat_username';
export const AVATAR_KEY = 'community_chat_avatar';

export interface ChatQuery {
  id?: string;
  query: string;
  created_at?: string;
}

export interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_data?: EventShare;
  read_by?: string[];
}

export interface ChatGroup {
  id: string;
  name: string;
  created_at: string;
}

export const GROUP_CATEGORIES = [
  { id: 'spot', name: 'Spot' },
  { id: 'sport', name: 'Sport' },
  { id: 'ausgehen', name: 'Ausgehen' },
];
