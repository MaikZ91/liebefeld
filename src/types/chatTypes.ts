// src/types/chatTypes.ts
// Changed: 'content' to 'text' in message type and added 'reactions'
export interface ChatMessage {
  id: string;
  group_id: string;
  sender: string;
  text: string; // Changed from 'content' to 'text'
  avatar?: string;
  created_at: string;
  media_url?: string | null;
  reactions?: { emoji: string; users: string[] }[] | null;
  read_by?: string[] | null;
  reply_to?: string | null; // ID of the message being replied to
  mentions?: string[] | null; // Array of mentioned usernames
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

// Changed: 'content' to 'text' and added 'reactions'
export interface Message {
  id: string;
  created_at: string;
  text: string; // Changed from 'content' to 'text'
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_data?: EventShare;
  read_by?: string[];
  reactions?: { emoji: string; users: string[] }[]; // Added reactions
  reply_to?: string | null; // ID of the message being replied to
  mentions?: string[] | null; // Array of mentioned usernames
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

// Benutzerprofiltyp
export interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  interests: string[] | null;
  hobbies?: string[] | null; // Making this optional since we're consolidating to just interests
  favorite_locations: string[] | null;
  created_at: string;
  last_online: string;
  current_live_location_lat?: number | null; // Latitude
  current_live_location_lng?: number | null; // Longitude
  current_status_message?: string | null;     // Custom status message
  current_checkin_timestamp?: string | null;  // Timestamp of last check-in
}

// Private Nachrichtentyp - updated to match database schema
export interface PrivateMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  created_at: string;
  read_at: string | null;
}