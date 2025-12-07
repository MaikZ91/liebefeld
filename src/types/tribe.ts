export interface TribeEvent {
  id: string;
  date: string;
  time?: string | null;
  title: string;
  event: string; // alias for title
  category?: string;
  description?: string;
  link: string;
  image_url?: string | null;
  city?: string;
  location?: string | null;
  // THE TRIBE Expert Features
  matchScore?: number; // 0-100
  attendees?: number; // Count of people going
  vibe?: 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY';
  summary?: string; // AI Generated summary
  attendeeAvatars?: string[]; // User avatars
  likes?: number;
  liked_by_users?: any;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  text: string;
  content?: string;
  isLoading?: boolean;
  relatedEvents?: TribeEvent[];
}

export interface UserProfile {
  username: string;
  bio: string;
  avatarUrl: string;
  avatar?: string;
  homebase?: string;
  interests?: string[];
  hobbies?: string[];
  favorite_locations?: string[];
  matchScore?: number;
}

export interface NexusFilter {
  category?: string;
  vibe?: 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY';
  date?: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  timestamp: string; // ISO date for sorting
  userAvatar?: string;
}

export interface Post {
  id: string;
  user: string;
  text: string;
  city: string;
  likes: number;
  time: string;
  timestamp: string; // ISO date for sorting
  tags: string[];
  userAvatar?: string;
  comments?: Comment[];
  isTribeCall?: boolean;
}

export enum ViewState {
  AUTH = 'AUTH',
  FEED = 'FEED',
  TRIBE_AI = 'TRIBE_AI',
  COMMUNITY = 'COMMUNITY',
  MAP = 'MAP',
  PROFILE = 'PROFILE',
  MATCHER = 'MATCHER'
}

export interface ConnectionSuggestion {
  userId: string;
  username: string;
  matchScore: number;
  reason: string;
}
