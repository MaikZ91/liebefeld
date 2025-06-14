
import { supabase } from "@/integrations/supabase/client";
import { Event } from "../types/eventTypes";
import { format } from "date-fns";

// Example data for Bielefeld events
export const bielefeldEvents: Event[] = [
  {
    id: "example-1",
    title: "Jazz-Konzert",
    description: "Live-Jazz-Musik in der Innenstadt",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: "19:00",
    location: "Bielefeld",
    organizer: "Jazzclub Bielefeld",
    category: "Konzert",
    source: "community",
    is_paid: false,
    likes: 0,
    rsvp_yes: 0,
    rsvp_no: 0,
    rsvp_maybe: 0
  },
  {
    id: "example-2",
    title: "Stadtfest",
    description: "Jährliches Stadtfest mit vielen Attraktionen",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: "10:00",
    location: "Bielefeld",
    organizer: "Stadt Bielefeld",
    category: "Sonstiges",
    source: "community",
    is_paid: false,
    likes: 0,
    rsvp_yes: 0,
    rsvp_no: 0,
    rsvp_maybe: 0
  }
];

// Fetch all events from unified community_events table
export const fetchSupabaseEvents = async (): Promise<Event[]> => {
  try {
    const { data: eventsData, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (eventsData) {
      console.log('Loaded events from Supabase:', eventsData);
      return eventsData.map(event => ({
        id: event.id.toString(),
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time?.toString() || '00:00',
        location: event.location || '',
        organizer: event.organizer || '',
        category: event.category,
        link: event.link,
        image_url: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : null,
        likes: event.likes || 0,
        rsvp_yes: event.rsvp_yes || 0,
        rsvp_no: event.rsvp_no || 0,
        rsvp_maybe: event.rsvp_maybe || 0,
        source: (event.source as 'community' | 'github') || 'community',
        external_id: event.external_id,
        is_paid: event.is_paid || false,
        rsvp: {
          yes: event.rsvp_yes || 0,
          no: event.rsvp_no || 0,
          maybe: event.rsvp_maybe || 0
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error loading events from Supabase:', error);
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
        image_urls: newEvent.image_url ? [newEvent.image_url] : null,
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
      image_url: data.image_urls && data.image_urls.length > 0 ? data.image_urls[0] : null,
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

// Log today's events
export const logTodaysEvents = (events: Event[]): void => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysEvents = events.filter(event => event.date === today);
  console.log(`Today's events (${today}):`, todaysEvents.length);
  todaysEvents.forEach(event => {
    console.log(`- ${event.title} (${event.source}) - ${event.likes} likes`);
  });
};

// Deprecated functions (kept for backward compatibility but will be removed)
export const fetchExternalEvents = async (): Promise<Event[]> => {
  console.warn('fetchExternalEvents is deprecated. Use fetchSupabaseEvents instead.');
  return [];
};

export const fetchGitHubLikes = async (): Promise<Record<string, any>> => {
  console.warn('fetchGitHubLikes is deprecated. Likes are now in community_events table.');
  return {};
};
