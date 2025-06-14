
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/eventTypes';

export const refetchSingleEvent = async (eventId: string): Promise<Event | null> => {
  try {
    console.log(`Refetching single event: ${eventId}`);
    
    const { data: eventData, error } = await supabase
      .from('community_events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }
    
    if (eventData) {
      return {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || '',
        date: eventData.date,
        time: eventData.time?.toString() || '00:00',
        location: eventData.location || '',
        organizer: eventData.organizer || '',
        category: eventData.category,
        link: eventData.link,
        image_url: eventData.image_urls?.[0] || undefined,
        likes: eventData.likes || 0,
        rsvp_yes: eventData.rsvp_yes || 0,
        rsvp_no: eventData.rsvp_no || 0,
        rsvp_maybe: eventData.rsvp_maybe || 0,
        source: eventData.source || 'community',
        external_id: eventData.external_id,
        is_paid: eventData.is_paid || false
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in refetchSingleEvent:', error);
    return null;
  }
};

export const updateEventLikesInDb = async (eventId: string, newLikes: number): Promise<boolean> => {
  try {
    console.log(`Updating likes for event ${eventId} to ${newLikes}`);
    
    const { error } = await supabase
      .from('community_events')
      .update({ likes: newLikes })
      .eq('id', eventId);
    
    if (error) {
      console.error('Error updating event likes:', error);
      return false;
    }
    
    console.log(`Successfully updated likes for event ${eventId} to ${newLikes}`);
    return true;
  } catch (error) {
    console.error('Error in updateEventLikesInDb:', error);
    return false;
  }
};
