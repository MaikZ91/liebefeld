import { supabase } from '@/integrations/supabase/client';

export const dislikeService = {
  async dislikeEvent(eventId: string, username: string): Promise<void> {
    const { error } = await supabase
      .from('disliked_events' as any)
      .insert({
        event_id: eventId,
        username: username
      });

    if (error) throw error;
  },

  async undislikeEvent(eventId: string, username: string): Promise<void> {
    const { error } = await supabase
      .from('disliked_events' as any)
      .delete()
      .eq('event_id', eventId)
      .eq('username', username);

    if (error) throw error;
  },

  async getDislikedEvents(username: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('disliked_events' as any)
      .select('event_id')
      .eq('username', username);

    if (error) throw error;
    return data?.map((item: any) => item.event_id) || [];
  }
};
