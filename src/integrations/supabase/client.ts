// src/integrations/supabase/client.ts
// Changed: 'content' to 'text' in ChatMessage type
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ykleosfvtqcmqxqihnod.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Define message reaction type for TypeScript
export type MessageReaction = {
  emoji: string;
  users: string[];
}

// Define chat message type including the new fields
export type ChatMessage = {
  id: string;
  group_id: string;
  sender: string;
  text: string; // Changed from 'content' to 'text'
  avatar?: string;
  created_at: string;
  media_url?: string | null;
  reactions?: MessageReaction[] | null;
  read_by?: string[] | null;
}