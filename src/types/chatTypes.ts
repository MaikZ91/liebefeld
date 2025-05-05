
export const USERNAME_KEY = 'username';
export const AVATAR_KEY = 'avatar';

export interface TypingUser {
  username: string;
  avatar: string | null;
  isTyping: boolean;
  lastTyped?: Date;
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

// Define shared event display format for chats
export interface EventShare {
  title: string;
  date: string;
  time: string;
  location?: string;
  category: string;
  link?: string; // Link zur Veranstaltung hinzugefügt
}

// Message interface used across the application
export interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_data?: EventShare;
}
