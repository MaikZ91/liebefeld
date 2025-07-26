// src/services/eventService.ts

import { supabase } from "@/integrations/supabase/client";
import { Event } from "../types/eventTypes";

// Fetch events from unified community_events table, filtered by city and date
export const fetchSupabaseEvents = async (selectedCity?: string, currentDate?: string): Promise<Event[]> => {
  try {
    console.log('踏 [fetchSupabaseEvents] Starting database query...');
    
    let query = supabase
      .from('community_events')
      .select('*'); // Select all fields

    // Apply city filter at database level
    if (selectedCity) {
      const targetCityName = selectedCity.toLowerCase();
      // Special handling for "Bielefeld" to include events without explicit city
      if (targetCityName === 'bi' || targetCityName === 'bielefeld') {
        query = query.or('city.is.null,city.ilike.bielefeld,city.ilike.bi');
      } else {
        query = query.ilike('city', targetCityName);
      }
      console.log(`踏 [fetchSupabaseEvents] Applying DB filter for city: ${selectedCity}`);
    } else {
      console.log('踏 [fetchSupabaseEvents] No specific city selected, fetching all events.');
    }

    // Apply date filter at database level (current date onwards)
    if (currentDate) {
      query = query.gte('date', currentDate);
      console.log(`踏 [fetchSupabaseEvents] Applying DB filter for date >= ${currentDate}`);
    } else {
      console.log('踏 [fetchSupabaseEvents] No specific start date, fetching all events.');
    }

    // Order by date as before
    query = query.order('date', { ascending: true });


    const { data: eventsData, error: eventsError } = await query;
    
    if (eventsError) {
      console.error('踏 [fetchSupabaseEvents] DATABASE ERROR:', eventsError);
      throw eventsError;
    }
    
    console.log('踏 [fetchSupabaseEvents] Raw data received:', eventsData?.length || 0, 'events');
    
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
        image_urls: event.image_url ? [event.image_url] : [], // Shim for backward compatibility
        likes: event.likes || 0,
        liked_by_users: Array.isArray(event.liked_by_users) ? event.liked_by_users as Array<{username: string; avatar_url?: string | null; timestamp: string}> : [],
        rsvp_yes: event.rsvp_yes || 0,
        rsvp_no: event.rsvp_no || 0,
        rsvp_maybe: event.rsvp_maybe || 0,
        source: (event.source as 'community' | 'github' | 'ai_generated') || 'community',
        external_id: event.external_id,
        is_paid: event.is_paid || false,
        created_at: event.created_at, // Add created_at for DB-based NEW badge
        city: event.city || undefined,
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
    console.error('踏 [fetchSupabaseEvents] EXCEPTION:', error);
    return [];
  }
};

// Update event likes and liked_by_users
export const updateEventLikes = async (
  eventId: string, 
  action: 'like' | 'unlike', 
  userData: { username?: string | null; avatar_url?: string | null }
): Promise<void> => {
  try {
    console.log(`${action === 'like' ? 'Liking' : 'Unliking'} event ${eventId} for user:`, userData);
    
    // First get current event data
    const { data: currentEvent, error: fetchError } = await supabase
      .from('community_events')
      .select('likes, liked_by_users')
      .eq('id', eventId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current event data:', fetchError);
      return;
    }
    
    const currentLikes = currentEvent.likes || 0;
    const currentLikedBy = Array.isArray(currentEvent.liked_by_users) ? currentEvent.liked_by_users : [];
    
    let newLikes = currentLikes;
    let newLikedBy = [...currentLikedBy];
    
    if (action === 'like') {
      // Check if user already liked (by username)
      const alreadyLiked = currentLikedBy.some((user: any) => 
        user.username === userData.username
      );
      
      if (!alreadyLiked) {
        newLikes = currentLikes + 1;
        newLikedBy.push({
          username: userData.username || 'Anonymous',
          avatar_url: userData.avatar_url || null,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Remove user from liked_by_users
      newLikedBy = currentLikedBy.filter((user: any) => 
        user.username !== userData.username
      );
      newLikes = Math.max(0, currentLikes - 1);
    }
    
    const { error } = await supabase
      .from('community_events')
      .update({ 
        likes: newLikes,
        liked_by_users: newLikedBy
      })
      .eq('id', eventId);
      
    if (error) {
      console.error('Error updating likes in Supabase:', error);
    } else {
      console.log(`Successfully ${action}d event ${eventId}`);
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
        city: newEvent.city || null,
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
        likes: 0,
        image_urls: newEvent.image_url ? [newEvent.image_url] : [],
      };
    }
    
    console.log('Successfully added event to database:', data);
    
    return {
      ...newEvent,
      id: data.id,
      likes: 0,
      image_url: data.image_url,
      image_urls: data.image_url ? [data.image_url] : [],
      city: data.city || undefined,
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
      likes: 0,
      image_urls: newEvent.image_url ? [newEvent.image_url] : [],
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

// Generate events for a new city using AI
export const generateCityEvents = async (city: string): Promise<void> => {
  try {
    console.log(`Generating events for city: ${city}`);
    
    const { data, error } = await supabase.functions.invoke('generate-city-events', {
      body: { city }
    });
    
    if (error) {
      console.error('Error generating city events:', error);
      throw error;
    } else {
      console.log('City events generation completed:', data);
    }
  } catch (error) {
    console.error('Error calling city events generation function:', error);
    throw error;
  }
};