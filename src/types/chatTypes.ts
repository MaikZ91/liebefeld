export const USERNAME_KEY = 'username';
export const AVATAR_KEY = 'avatar';

export interface TypingUser {
  username: string;
  avatar: string | null;
  isTyping: boolean;
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
}
