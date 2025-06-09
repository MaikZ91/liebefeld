import { supabase } from "@/integrations/supabase/client";
import { Event, GitHubEvent } from "../types/eventTypes";
import { transformGitHubEvents } from "../utils/eventUtils";
import { format } from "date-fns";

// URL to JSON file with events
const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";

// Example data for Bielefeld events
export const bielefeldEvents: Event[] = [
  {
    id: "example-1",
    title: "Jazz-Konzert",
    description: "Live-Jazz-Musik in der Innenstadt",
    date: format(new Date(), 'yyyy-MM-dd'), // Today
    time: "19:00",
    location: "Bielefeld",
    organizer: "Jazzclub Bielefeld",
    category: "Konzert"
  },
  {
    id: "example-2",
    title: "Stadtfest",
    description: "Jährliches Stadtfest mit vielen Attraktionen",
    date: format(new Date(), 'yyyy-MM-dd'), // Today
    time: "10:00",
    location: "Bielefeld",
    organizer: "Stadt Bielefeld",
    category: "Sonstiges"
  }
];

// Fetch events from Supabase
export const fetchSupabaseEvents = async (): Promise<Event[]> => {
  try {
    // Fetch all events including GitHub-sourced events
    const { data: eventsData, error: eventsError } = await supabase
      .from('community_events')
      .select('*');
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (eventsData) {
      console.log('Loaded events from Supabase:', eventsData);
      // Convert Supabase UUIDs to Strings and ensure RSVP data is properly formatted
      return eventsData.map(event => ({
        ...event,
        id: event.id.toString(),
        // Format RSVP data consistently
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

// Fetch GitHub event likes from Supabase
export const fetchGitHubLikes = async (): Promise<Record<string, any>> => {
  try {
    console.log('Fetching GitHub event likes from database');
    const { data: githubLikesData, error: githubLikesError } = await supabase
      .from('github_event_likes')
      .select('*');
    
    if (githubLikesError) {
      console.error('Error loading GitHub likes:', githubLikesError);
      return {};
    }
    
    // Create a map of GitHub event likes and RSVP counts
    const githubLikesMap: Record<string, any> = {};
    if (githubLikesData) {
      console.log(`Loaded ${githubLikesData.length} GitHub event likes from database`);
      githubLikesData.forEach(like => {
        githubLikesMap[like.event_id] = {
          likes: like.likes || 0,
          rsvp_yes: like.rsvp_yes || 0,
          rsvp_no: like.rsvp_no || 0,
          rsvp_maybe: like.rsvp_maybe || 0
        };
        console.log(`Found data for ${like.event_id}: ${like.likes} likes, RSVP: yes=${like.rsvp_yes || 0}, no=${like.rsvp_no || 0}, maybe=${like.rsvp_maybe || 0}`);
      });
    } else {
      console.log('No GitHub likes data found in database');
    }
    
    return githubLikesMap;
  } catch (error) {
    console.error('Error fetching GitHub likes:', error);
    return {};
  }
};

// Fetch external events from GitHub
export const fetchExternalEvents = async (eventLikes: Record<string, number>): Promise<Event[]> => {
  try {
    console.log(`[fetchExternalEvents] Attempting to fetch events from: ${EXTERNAL_EVENTS_URL}`);
    
    // Add cache-busting parameter to avoid caching issues
    const cacheBuster = `?t=${new Date().getTime()}`;
    const response = await fetch(`${EXTERNAL_EVENTS_URL}${cacheBuster}`);
    
    if (!response.ok) {
      console.log(`[fetchExternalEvents] Fehler beim Laden von ${EXTERNAL_EVENTS_URL}: ${response.status}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const githubEvents: GitHubEvent[] = await response.json();
    console.log(`[fetchExternalEvents] Successfully loaded ${githubEvents.length} events from ${EXTERNAL_EVENTS_URL}`);
    
    // Log first few events to debug
    console.log('[fetchExternalEvents] First 3 GitHub events:', githubEvents.slice(0, 3));
    
    // Transform GitHub events to our format and pass eventLikes to ensure likes are applied
    const transformedEvents = transformGitHubEvents(githubEvents, eventLikes, new Date().getFullYear());
    console.log(`[fetchExternalEvents] Transformed ${transformedEvents.length} GitHub events`);
    console.log('[fetchExternalEvents] First 3 transformed events:', transformedEvents.slice(0, 3));
    
    return transformedEvents;
  } catch (error) {
    console.error(`[fetchExternalEvents] Fehler beim Laden von ${EXTERNAL_EVENTS_URL}:`, error);
    return [];
  }
};

// Update event likes in Supabase - ensuring likes are properly stored
export const updateEventLikes = async (eventId: string, newLikesValue: number): Promise<void> => {
  try {
    console.log(`Updating likes for event ${eventId} to ${newLikesValue}`);
    
    // For GitHub events
    if (eventId.startsWith('github-')) {
      console.log(`Updating GitHub event like: ${eventId}`);
      
      // Check if the record already exists
      const { data: existingLike, error: checkError } = await supabase
        .from('github_event_likes')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') { // PGRST116 means no rows returned
          console.log(`No existing like found for GitHub event ${eventId}, creating new record`);
        } else {
          console.error('Error checking if GitHub like exists:', checkError);
        }
      }
      
      if (existingLike) {
        console.log(`Existing like found for GitHub event ${eventId}, updating to ${newLikesValue}`);
        // Update existing record
        const { error: updateError } = await supabase
          .from('github_event_likes')
          .update({ likes: newLikesValue })
          .eq('event_id', eventId);
          
        if (updateError) {
          console.error('Error updating GitHub event likes:', updateError);
        } else {
          console.log(`Successfully updated likes for GitHub event ${eventId}`);
        }
      } else {
        console.log(`Creating new like record for GitHub event ${eventId} with ${newLikesValue} likes`);
        // Insert new record
        const { error: insertError } = await supabase
          .from('github_event_likes')
          .insert({ event_id: eventId, likes: newLikesValue });
          
        if (insertError) {
          console.error('Error inserting GitHub event likes:', insertError);
        } else {
          console.log(`Successfully created new like record for GitHub event ${eventId}`);
        }
      }
    } 
    // For regular Supabase events
    else {
      console.log(`Updating regular event like: ${eventId}`);
      const { error } = await supabase
        .from('community_events')
        .update({ likes: newLikesValue })
        .eq('id', eventId);
        
      if (error) {
        console.error('Error updating likes in Supabase:', error);
      } else {
        console.log(`Successfully updated likes for regular event ${eventId}`);
      }
    }
  } catch (error) {
    console.error('Error updating likes:', error);
  }
};

// Update event RSVP counts in Supabase
export const updateEventRsvp = async (eventId: string, rsvpData: { yes: number, no: number, maybe: number }): Promise<void> => {
  try {
    console.log(`Updating RSVP for event ${eventId} to ${JSON.stringify(rsvpData)}`);
    
    // For GitHub events
    if (eventId.startsWith('github-')) {
      console.log(`Updating GitHub event RSVP: ${eventId}`);
      
      // Check if the record already exists
      const { data: existingEvent, error: checkError } = await supabase
        .from('github_event_likes')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') { // PGRST116 means no rows returned
          console.log(`No existing record found for GitHub event ${eventId}, creating new record with RSVP data`);
        } else {
          console.error('Error checking if GitHub event exists:', checkError);
        }
      }
      
      if (existingEvent) {
        console.log(`Existing record found for GitHub event ${eventId}, updating with RSVP data`);
        // Update existing record with RSVP data
        const { error: updateError } = await supabase
          .from('github_event_likes')
          .update({ 
            rsvp_yes: rsvpData.yes,
            rsvp_no: rsvpData.no,
            rsvp_maybe: rsvpData.maybe
          })
          .eq('event_id', eventId);
          
        if (updateError) {
          console.error('Error updating GitHub event RSVP:', updateError);
        } else {
          console.log(`Successfully updated RSVP for GitHub event ${eventId}`);
        }
      } else {
        console.log(`Creating new record for GitHub event ${eventId} with RSVP data`);
        // Insert new record with RSVP data
        const { error: insertError } = await supabase
          .from('github_event_likes')
          .insert({ 
            event_id: eventId, 
            likes: 0,
            rsvp_yes: rsvpData.yes,
            rsvp_no: rsvpData.no,
            rsvp_maybe: rsvpData.maybe
          });
          
        if (insertError) {
          console.error('Error inserting GitHub event RSVP:', insertError);
        } else {
          console.log(`Successfully created new record with RSVP for GitHub event ${eventId}`);
        }
      }
    } 
    // For regular Supabase events
    else {
      console.log(`Updating regular event RSVP: ${eventId}`);
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
        console.log(`Successfully updated RSVP for regular event ${eventId}`);
      }
    }
  } catch (error) {
    console.error('Error updating RSVP:', error);
  }
};

// Add a new event to Supabase
export const addNewEvent = async (newEvent: Omit<Event, 'id'>): Promise<Event> => {
  try {
    console.log('Adding new event to database:', newEvent);
    
    // Insert the event into Supabase
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
        image_urls: newEvent.image_urls || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding event to database:', error);
      
      // If there's an error, create a user-added event with a local ID as fallback
      const localId = `local-${Math.random().toString(36).substring(2, 9)}`;
      return {
        ...newEvent,
        id: localId,
        likes: 0
      };
    }
    
    console.log('Successfully added event to database:', data);
    
    // Return the event with the new ID
    return {
      ...newEvent,
      id: data.id,
      likes: 0,
      rsvp: {
        yes: 0,
        no: 0,
        maybe: 0
      }
    };
  } catch (error) {
    console.error('Error adding event:', error);
    
    // Create a local ID as fallback
    const localId = `local-${Math.random().toString(36).substring(2, 9)}`;
    
    // Return event with local ID
    return {
      ...newEvent,
      id: localId,
      likes: 0
    };
  }
};

// Sync GitHub events with database
export const syncGitHubEvents = async (githubEvents: Event[]): Promise<void> => {
  try {
    console.log(`Syncing ${githubEvents.length} GitHub events with database`);
    
    const { data: existingEventLikes, error: likesError } = await supabase
      .from('github_event_likes')
      .select('event_id');
    
    if (likesError) {
      console.error('Error fetching existing GitHub event likes:', likesError);
      return;
    }
    
    const existingEventIds = new Set(existingEventLikes?.map(e => e.event_id) || []);
    const newEvents = githubEvents.filter(e => !existingEventIds.has(e.id));
    
    console.log(`Found ${newEvents.length} new GitHub events to sync`);
    
    // Insert records for new GitHub events
    if (newEvents.length > 0) {
      const newEventRecords = newEvents.map(event => ({
        event_id: event.id,
        likes: 0,
        rsvp_yes: 0,
        rsvp_no: 0,
        rsvp_maybe: 0
      }));
      
      const { error: insertError } = await supabase
        .from('github_event_likes')
        .insert(newEventRecords);
      
      if (insertError) {
        console.error('Error syncing new GitHub events:', insertError);
      } else {
        console.log(`Successfully synced ${newEvents.length} new GitHub events`);
      }
    }
  } catch (error) {
    console.error('Error syncing GitHub events:', error);
  }
};

// Helper to log today's events in console
export const logTodaysEvents = (events: Event[]) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log('===== TODAY\'S EVENTS =====');
  
  const todaysEvents = events.filter(event => event.date === today);
  
  if (todaysEvents.length === 0) {
    console.log('No events found for today');
    return;
  }
  
  // Sort by likes (highest first)
  const sortedEvents = [...todaysEvents].sort((a, b) => {
    const likesA = a.likes || 0;
    const likesB = b.likes || 0;
    
    if (likesB !== likesA) {
      return likesB - likesA;
    }
    
    return a.id.localeCompare(b.id);
  });
  
  console.log(`Found ${sortedEvents.length} events for today (${today}):`);
  
  sortedEvents.forEach((event, index) => {
    console.log(`${index + 1}. ${event.title} (ID: ${event.id})`);
    console.log(`   Category: ${event.category}, Likes: ${event.likes || 0}`);
    console.log(`   RSVP: yes=${event.rsvp?.yes || event.rsvp_yes || 0}, no=${event.rsvp?.no || event.rsvp_no || 0}, maybe=${event.rsvp?.maybe || event.rsvp_maybe || 0}`);
    console.log(`   Origin: ${event.id.startsWith('github-') ? 'GitHub' : (event.id.startsWith('local-') ? 'User-added' : 'Database')}`);
  });
  
  console.log('=========================');
};

// Expose function to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).logTodaysEvents = (events?: Event[]) => {
    if (!events) {
      // Try to get events from context if available
      try {
        const contextModule = require('../contexts/EventContext');
        const context = contextModule.useEventContext();
        logTodaysEvents(context.events);
      } catch (error) {
        console.error('Could not access events from context. Please provide events as parameter.');
        console.log('Usage: window.logTodaysEvents(events)');
      }
    } else {
      logTodaysEvents(events);
    }
  };
}
