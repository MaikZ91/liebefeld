import { supabase } from '@/integrations/supabase/client';

const LOCALSTORAGE_KEY = 'disliked_events';

export const dislikeService = {
  // Get disliked events from localStorage
  getLocalDislikedEvents(): string[] {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Save disliked events to localStorage
  setLocalDislikedEvents(eventIds: string[]): void {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(eventIds));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Dislike an event (with or without username)
  async dislikeEvent(eventId: string, username?: string): Promise<void> {
    if (username) {
      // Save to database if user is logged in
      const { error } = await supabase
        .from('disliked_events' as any)
        .insert({
          event_id: eventId,
          username: username
        });

      if (error) throw error;
    } else {
      // Save to localStorage if not logged in
      const current = this.getLocalDislikedEvents();
      if (!current.includes(eventId)) {
        this.setLocalDislikedEvents([...current, eventId]);
      }
    }
  },

  // Undislike an event (with or without username)
  async undislikeEvent(eventId: string, username?: string): Promise<void> {
    if (username) {
      // Remove from database if user is logged in
      const { error } = await supabase
        .from('disliked_events' as any)
        .delete()
        .eq('event_id', eventId)
        .eq('username', username);

      if (error) throw error;
    } else {
      // Remove from localStorage if not logged in
      const current = this.getLocalDislikedEvents();
      this.setLocalDislikedEvents(current.filter(id => id !== eventId));
    }
  },

  // Get all disliked events (from database or localStorage)
  async getDislikedEvents(username?: string): Promise<string[]> {
    if (username) {
      // Get from database if user is logged in
      const { data, error } = await supabase
        .from('disliked_events' as any)
        .select('event_id')
        .eq('username', username);

      if (error) throw error;
      return data?.map((item: any) => item.event_id) || [];
    } else {
      // Get from localStorage if not logged in
      return this.getLocalDislikedEvents();
    }
  }
};
