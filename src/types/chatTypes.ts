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

// Changed: 'content' to 'text' and added 'reactions' and poll fields
export interface Message {
  id: string;
  created_at: string;
  text: string; // Changed from 'content' to 'text'
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_data?: EventShare;
  event_id?: string; // Added event_id for joining event chats
  event_title?: string; // Added event_title for display
  event_date?: string; // Added for meetup proposals
  event_location?: string; // Added for meetup proposals
  meetup_responses?: { // Added for meetup proposals
    'bin dabei'?: Array<{ username: string; avatar?: string }>;
    'diesmal nicht'?: Array<{ username: string; avatar?: string }>;
  };
  read_by?: string[];
  reactions?: { emoji: string; users: string[] }[]; // Added reactions
  // Reply fields
  reply_to_message_id?: string;
  reply_to_sender?: string;
  reply_to_text?: string;
  // Poll fields - keep as raw database types
  poll_question?: string;
  poll_options?: any; // Can be array or JSON depending on source
  poll_votes?: { [optionIndex: number]: { username: string; avatar?: string }[] };
  poll_allow_multiple?: boolean;
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