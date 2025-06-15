import { supabase } from "@/integrations/supabase/client";
import { Event } from "../types/eventTypes";

// Fetch all events from unified community_events table
export const fetchSupabaseEvents = async (): Promise<Event[]> => {
  try {
    const { data: eventsData, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });
    
    if (eventsError) {
      console.error('📥 [fetchSupabaseEvents] DATABASE ERROR:', eventsError);
      throw eventsError;
    }
    
    if (eventsData) {
      const transformedEvents = eventsData.map(event => ({
        id: event.id.toString(),
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time?.toString() || '00:00',
        location: event.location || '',
        organizer: event.organizer || '',
        category: event.category,
        link: event.link,
        image_url: event.image_url,
        likes: event.likes || 0,
        rsvp_yes: event.rsvp_yes || 0,
        rsvp_no: event.rsvp_no || 0,
        rsvp_maybe: event.rsvp_maybe || 0,
        source: (event.source as 'community' | 'github') || 'community',
        external_id: event.external_id,
        is_paid: event.is_paid || false,
        created_at: event.created_at, // Add created_at for DB-based NEW badge
        rsvp: {
          yes: event.rsvp_yes || 0,
          no: event.rsvp_no || 0,
          maybe: event.rsvp_maybe || 0
        }
      }));
      return transformedEvents;
    }
    
    return [];
  } catch (error) {
    console.error('📥 [fetchSupabaseEvents] EXCEPTION:', error);
    return [];
  }
};

// Update event likes
export const updateEventLikes = async (eventId: string, newLikesValue: number): Promise<void> => {
  try {
    console.log(`Updating likes for event ${eventId} to ${newLikesValue}`);
    
    const { error } = await supabase
      .from('community_events')
      .update({ likes: newLikesValue })
      .eq('id', eventId);
      
    if (error) {
      console.error('Error updating likes in Supabase:', error);
    } else {
      console.log(`Successfully updated likes for event ${eventId}`);
    }
  } catch (error) {
    console.error('Error updating likes:', error);
  }
};

// Update event RSVP counts
export const updateEventRsvp = async (eventId: string, rsvpData: { yes: number, no: number, maybe: number }): Promise<void> => {
  try {
    console.log(`Updating RSVP for event ${eventId} to ${JSON.stringify(rsvpData)}`);
    
    const { error } = await supabase
      .from('community_events')
      .update({ 
        rsvp_yes: rsvpData.yes,
        rsvp_no: rsvpData.no,
        rsvp_maybe: rsvpData.maybe 
      })
      .eq('id', eventId);
      
    if (error) {
      console.error('Error updating RSVP in Supabase:', error);
    } else {
      console.log(`Successfully updated RSVP for event ${eventId}`);
    }
  } catch (error) {
    console.error('Error updating RSVP:', error);
  }
};

// Add a new event
export const addNewEvent = async (newEvent: Omit<Event, 'id'>): Promise<Event> => {
  try {
    console.log('Adding new event to database:', newEvent);
    
    const { data, error } = await supabase
      .from('community_events')
      .insert({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        organizer: newEvent.organizer,
        category: newEvent.category,
        likes: 0,
        rsvp_yes: 0,
        rsvp_no: 0,
        rsvp_maybe: 0,
        link: newEvent.link || null,
        image_url: newEvent.image_url || null,
        source: newEvent.source || 'community',
        external_id: newEvent.external_id || null,
        is_paid: newEvent.is_paid || false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding event to database:', error);
      
      const localId = `local-${Math.random().toString(36).substring(2, 9)}`;
      return {
        ...newEvent,
        id: localId,
        likes: 0
      };
    }
    
    console.log('Successfully added event to database:', data);
    
    return {
      ...newEvent,
      id: data.id,
      likes: 0,
      image_url: data.image_url,
      rsvp: {
        yes: 0,
        no: 0,
        maybe: 0
      }
    };
  } catch (error) {
    console.error('Error adding event:', error);
    
    const localId = `local-${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      ...newEvent,
      id: localId,
      likes: 0
    };
  }
};

// Sync GitHub events by calling the edge function
export const syncGitHubEvents = async (): Promise<void> => {
  try {
    console.log('Triggering GitHub events sync...');
    
    const { data, error } = await supabase.functions.invoke('sync-github-events', {
      body: { manual: true }
    });
    
    if (error) {
      console.error('Error syncing GitHub events:', error);
    } else {
      console.log('GitHub events sync completed:', data);
    }
  } catch (error) {
    console.error('Error calling GitHub sync function:', error);
  }
};
