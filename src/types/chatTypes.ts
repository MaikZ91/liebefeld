
import { MessageReaction } from "@/integrations/supabase/client";

export type ChatGroup = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
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

export const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const USERNAME_KEY = "community_chat_username";
export const AVATAR_KEY = "community_chat_avatar";
