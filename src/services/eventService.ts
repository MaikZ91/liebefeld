// src/services/eventService.ts

import { supabase } from "@/integrations/supabase/client";
import { Event, GitHubEvent } from "../types/eventTypes";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
    // Use image_urls for now until database is updated
    const { data: eventsData, error: eventsError } = await supabase
      .from('community_events')
      .select('*, image_urls'); // Keep using image_urls until database is updated
    
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
        },
        // Convert image_urls array to single image_url for compatibility
        image_url: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : null
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
    
    // Insert the event into Supabase - convert single image_url to image_urls array for database
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
        image_urls: newEvent.image_url ? [newEvent.image_url] : null // Convert single URL to array
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
    
    // Return the event with the new ID and convert back to single image_url
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

// Transform GitHub events to our Event format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, any> = {},
  currentYear: number = new Date().getFullYear()
): Event[] => {
  console.log(`[transformGitHubEvents] Processing ${githubEvents.length} GitHub events`);
  
  return githubEvents.map((githubEvent, index) => {
    console.log(`[transformGitHubEvents] Processing event ${index}:`, githubEvent);
    
    const eventId = `github-${githubEvent.hash || githubEvent.event || index}`;
    const likesData = eventLikes[eventId] || {};
    
    // Extract location and clean title from event name
    let title = githubEvent.event || 'Unnamed Event';
    let location = githubEvent.location || '';
    
    // Check if the title contains location in format "Event Name (@Location)"
    const locationMatch = title.match(/^(.+?)\s*\(@([^)]+)\)$/);
    if (locationMatch) {
      title = locationMatch[1].trim(); // Extract the event name without location
      location = locationMatch[2].trim(); // Extract the location from parentheses
      console.log(`[transformGitHubEvents] Extracted title: "${title}" and location: "${location}"`);
    }
    
    // Extract category from the GitHub event data
    let category = 'Sonstiges'; // Default fallback
    
    // Check if category is directly provided in the GitHub event
    if (githubEvent.category) {
      category = githubEvent.category;
      console.log(`[transformGitHubEvents] Found direct category: ${category}`);
    }
    // Check if there's a genre field (some events use this)
    else if (githubEvent.genre) {
      category = githubEvent.genre;
      console.log(`[transformGitHubEvents] Found genre category: ${category}`);
    }
    // Check if there's a type field
    else if (githubEvent.type) {
      category = githubEvent.type;
      console.log(`[transformGitHubEvents] Found type category: ${category}`);
    }
    // Try to infer category from event name/description
    else {
      const eventText = (title + ' ' + (githubEvent.description || '')).toLowerCase();
      
      if (eventText.includes('konzert') || eventText.includes('concert') || eventText.includes('musik') || eventText.includes('band')) {
        category = 'Konzert';
      } else if (eventText.includes('party') || eventText.includes('club') || eventText.includes('dj')) {
        category = 'Party';
      } else if (eventText.includes('festival')) {
        category = 'Festival';
      } else if (eventText.includes('ausstellung') || eventText.includes('exhibition') || eventText.includes('kunst')) {
        category = 'Ausstellung';
      } else if (eventText.includes('sport') || eventText.includes('fitness') || eventText.includes('lauf')) {
        category = 'Sport';
      } else if (eventText.includes('workshop') || eventText.includes('kurs')) {
        category = 'Workshop';
      } else if (eventText.includes('theater') || eventText.includes('schauspiel')) {
        category = 'Theater';
      } else if (eventText.includes('kino') || eventText.includes('film')) {
        category = 'Kino';
      } else if (eventText.includes('lesung') || eventText.includes('literatur')) {
        category = 'Lesung';
      }
      
      console.log(`[transformGitHubEvents] Inferred category from text: ${category}`);
    }

    // Parse the date - handle different formats
    let eventDate = '';
    try {
      // Handle formats like "Thu, 29.05.2025" or "Th, 29.05"
      const dateStr = githubEvent.date;
      console.log(`[transformGitHubEvents] Original date string: ${dateStr}`);
      
      if (dateStr.includes('.')) {
        // Extract day and month from formats like "Thu, 29.05.2025" or "Th, 29.05"
        const dateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3] || currentYear.toString();
          eventDate = `${year}-${month}-${day}`;
          console.log(`[transformGitHubEvents] Parsed date: ${eventDate}`);
        }
      }
      
      if (!eventDate) {
        console.warn(`[transformGitHubEvents] Could not parse date: ${dateStr}, using today`);
        eventDate = format(new Date(), 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error(`[transformGitHubEvents] Error parsing date for event ${title}:`, error);
      eventDate = format(new Date(), 'yyyy-MM-dd');
    }

    const transformedEvent: Event = {
      id: eventId,
      title: title,
      description: githubEvent.description || '',
      date: eventDate,
      time: githubEvent.time || '00:00',
      location: location,
      organizer: githubEvent.organizer || 'Unbekannt',
      category: category,
      likes: likesData.likes || 0,
      rsvp: {
        yes: likesData.rsvp_yes || 0,
        no: likesData.rsvp_no || 0,
        maybe: likesData.rsvp_maybe || 0
      },
      link: githubEvent.link || null,
      image_url: githubEvent.image_url || null // Changed from image_urls to image_url
    };
    
    console.log(`[transformGitHubEvents] Transformed event:`, transformedEvent);
    return transformedEvent;
  });
};

// Sync GitHub events with database
export const syncGitHubEvents = async (events: Event[]): Promise<void> => {
  console.log('Syncing GitHub events with database...');
  
  try {
    for (const event of events) {
      if (event.id.startsWith('github-')) {
        // Use UPSERT to prevent duplicate key errors
        const { error } = await supabase
          .from('github_event_likes')
          .upsert({
            event_id: event.id,
            likes: event.likes || 0,
            rsvp_yes: event.rsvp_yes || 0,
            rsvp_no: event.rsvp_no || 0,
            rsvp_maybe: event.rsvp_maybe || 0,
            image_urls: event.image_url ? [event.image_url] : [] // Fixed: use image_url instead of image_urls
          }, {
            onConflict: 'event_id'
          });
          
        if (error) {
          console.error(`Error syncing GitHub event ${event.id}:`, error);
          // Continue with other events even if one fails
          continue;
        }
        
        console.log(`Successfully synced GitHub event: ${event.id}`);
      }
    }
    
    console.log('GitHub events sync completed');
  } catch (error) {
    console.error('Error syncing new GitHub events:', error);
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
    if (event.image_url) {
        console.log(`   Image: ${event.image_url}`);
    }
  });
  
  console.log('=========================');
};

// Add missing functions that are used in other components (assuming they are correct)
export const groupEventsByDate = (events: Event[]): { [key: string]: Event[] } => {
  return events.reduce((groups: { [key: string]: Event[] }, event: Event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});
};
export const sortEventsByDate = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
export const getWeekRange = (currentDate: Date): [Date, Date] => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return [startOfWeek, endOfWeek];
};
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const startFormat = startDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  const endFormat = endDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startFormat} - ${endFormat}`;
};
export const getEventsForDay = (events: Event[], selectedDate: Date | null, filter: string | null = null): Event[] => {
  if (!selectedDate) return [];

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  let filteredEvents = events.filter(event => event.date === formattedDate);

  if (filter) {
    filteredEvents = filteredEvents.filter(event =>
      event.category.toLowerCase().includes(filter.toLowerCase())
    );
  }

  return filteredEvents;
};
export const getMonthOrFavoriteEvents = (events: Event[], currentDate: Date, showFavorites: boolean = false, eventLikes: Record<string, number> = {}): Event[] => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  let filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth && eventDate <= endOfMonth;
  });

  if (showFavorites) {
    filteredEvents = filteredEvents.filter(event => eventLikes[event.id]);
  }

  return filteredEvents;
};
export const groupFutureEventsByDate = (events: Event[]): Record<string, Event[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events.reduce((acc: Record<string, Event[]>, event: Event) => {
    const eventDate = new Date(event.date);

    if (eventDate >= today) {
      const dateKey = format(eventDate, 'yyyy-MM-dd');

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(event);
    }

    return acc;
  }, {});
};
export const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy', { locale: de });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};
export const getFutureEvents = (events: Event[]): Event[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today;
  });
};
export const hasEventsOnDay = (events: Event[], day: Date): boolean => {
  const formattedDay = format(day, 'yyyy-MM-dd');
  return events.some(event => event.date === formattedDay);
};
export const getEventCountForDay = (events: Event[], day: Date): number => {
  const formattedDay = format(day, 'yyyy-MM-dd');
  return events.filter(event => event.date === formattedDay).length;
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
