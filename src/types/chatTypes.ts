
import { MessageReaction } from "@/integrations/supabase/client";

export type ChatGroup = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  category?: string; // Added category field
}

export type TypingUser = {
  username: string;
  avatar?: string;
  lastTyped: Date;
}

export type EventShare = {
  title: string;
  date: string;
  time: string;
  location?: string;
  category: string;
}

export interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_share?: EventShare | null;
}

export const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const USERNAME_KEY = "community_chat_username";
export const AVATAR_KEY = "community_chat_avatar";

// Group categories
export const GROUP_CATEGORIES = ["Ausgehen", "Sport", "Kreativität"];
