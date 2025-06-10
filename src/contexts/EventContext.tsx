
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Event, GitHubEvent } from '../types/eventTypes';
import { transformGitHubEvents } from '../utils/eventUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventContextType {
  events: Event[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  filter: string | null;
  setFilter: (filter: string | null) => void;
  handleLikeEvent: (eventId: string) => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
  eventLikes: Record<string, number>;
  refreshEvents: () => Promise<void>;
  newEventIds: Set<string>;
  topEventsPerDay: Record<string, string>;
  addUserEvent: (event: Omit<Event, 'id'>) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};

// Session storage key for optimistic likes
const SESSION_LIKES_KEY = 'event_session_likes';
const LAST_VISIT_KEY = 'last_visit_timestamp';

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [eventLikes, setEventLikes] = useState<Record<string, number>>({});
  const [sessionLikes, setSessionLikes] = useState<Record<string, number>>({});
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  // Calculate top events per day based on combined likes (DB + session)
  const topEventsPerDay = useMemo(() => {
    console.log('[EventContext] Calculating topEventsPerDay with eventLikes:', eventLikes);
    console.log('[EventContext] Session likes:', sessionLikes);
    
    const eventsByDate: Record<string, Event[]> = {};
    
    // Group events by date
    events.forEach(event => {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    });
    
    const topEvents: Record<string, string> = {};
    
    // Find the top event for each date based on combined likes
    Object.keys(eventsByDate).forEach(date => {
      const eventsOnDate = eventsByDate[date];
      
      const topEvent = eventsOnDate.reduce((prev, current) => {
        const prevLikes = (eventLikes[prev.id] || 0) + (sessionLikes[prev.id] || 0);
        const currentLikes = (eventLikes[current.id] || 0) + (sessionLikes[current.id] || 0);
        
        console.log(`[EventContext] Comparing for ${date}: ${prev.title} (${prevLikes} likes) vs ${current.title} (${currentLikes} likes)`);
        
        if (currentLikes > prevLikes) {
          return current;
        } else if (currentLikes === prevLikes) {
          // If likes are equal, prefer the one with higher base likes from DB
          const prevBaseLikes = eventLikes[prev.id] || 0;
          const currentBaseLikes = eventLikes[current.id] || 0;
          return currentBaseLikes > prevBaseLikes ? current : prev;
        }
        return prev;
      });
      
      const topEventLikes = (eventLikes[topEvent.id] || 0) + (sessionLikes[topEvent.id] || 0);
      if (topEventLikes > 0) {
        topEvents[date] = topEvent.id;
        console.log(`[EventContext] Top event for ${date}: ${topEvent.title} with ${topEventLikes} likes`);
      }
    });
    
    console.log('[EventContext] Final topEventsPerDay:', topEvents);
    return topEvents;
  }, [events, eventLikes, sessionLikes]);

  // Load session likes from localStorage
  const loadSessionLikes = useCallback(() => {
    try {
      const stored = localStorage.getItem(SESSION_LIKES_KEY);
      if (stored) {
        const parsedLikes = JSON.parse(stored);
        console.log('[EventContext] Loaded session likes from localStorage:', parsedLikes);
        setSessionLikes(parsedLikes);
      }
    } catch (error) {
      console.error('[EventContext] Error loading session likes:', error);
      setSessionLikes({});
    }
  }, []);

  // Save session likes to localStorage
  const saveSessionLikes = useCallback((likes: Record<string, number>) => {
    try {
      localStorage.setItem(SESSION_LIKES_KEY, JSON.stringify(likes));
      console.log('[EventContext] Saved session likes to localStorage:', likes);
    } catch (error) {
      console.error('[EventContext] Error saving session likes:', error);
    }
  }, []);

  // Load events from both GitHub and community events
  const refreshEvents = useCallback(async () => {
    console.log('[EventContext] Starting refreshEvents...');
    
    try {
      // Load GitHub events
      const githubResponse = await fetch('https://raw.githubusercontent.com/Lameshow/BielfeldEvents/main/events.json');
      
      if (!githubResponse.ok) {
        throw new Error(`GitHub fetch failed: ${githubResponse.status}`);
      }
      
      const githubData = await githubResponse.json();
      console.log('[EventContext] GitHub events fetched:', githubData.length);

      // Load database likes FIRST - this is critical for correct ranking
      console.log('[EventContext] Loading database likes...');
      const { data: likesData, error: likesError } = await supabase
        .from('github_event_likes')
        .select('event_id, likes');

      if (likesError) {
        console.error('[EventContext] Error loading likes:', likesError);
      }

      // Create likes mapping from database
      const dbLikes: Record<string, number> = {};
      if (likesData) {
        likesData.forEach(like => {
          if (like.event_id && like.likes > 0) {
            dbLikes[like.event_id] = like.likes;
          }
        });
      }
      console.log('[EventContext] Database likes loaded:', dbLikes);

      // Update event likes state with database values
      setEventLikes(dbLikes);

      // Transform GitHub events with database likes
      const transformedGitHubEvents = transformGitHubEvents(githubData, dbLikes);
      console.log('[EventContext] Transformed GitHub events:', transformedGitHubEvents.length);

      // Load community events
      const { data: communityEvents, error: communityError } = await supabase
        .from('community_events')
        .select('*')
        .order('date', { ascending: true });

      if (communityError) {
        console.error('[EventContext] Error loading community events:', communityError);
      }

      const transformedCommunityEvents: Event[] = communityEvents ? communityEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time,
        location: event.location || '',
        organizer: event.organizer || '',
        category: event.category,
        likes: event.likes || 0,
        rsvp: {
          yes: event.rsvp_yes || 0,
          no: event.rsvp_no || 0,
          maybe: event.rsvp_maybe || 0
        },
        link: event.link,
        image_url: Array.isArray(event.image_urls) ? event.image_urls[0] : null
      })) : [];

      console.log('[EventContext] Community events loaded:', transformedCommunityEvents.length);

      // Combine all events
      const allEvents = [...transformedGitHubEvents, ...transformedCommunityEvents];
      console.log('[EventContext] Total events combined:', allEvents.length);

      // Check for new events
      const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
      const lastVisitTime = lastVisit ? new Date(lastVisit) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const newIds = new Set<string>();
      allEvents.forEach(event => {
        // For GitHub events, check if they're recent additions
        if (event.id.startsWith('github-')) {
          // Simple heuristic: if we don't have likes data for this event, it might be new
          if (!(event.id in dbLikes)) {
            newIds.add(event.id);
          }
        }
        // For community events, check creation date if available
        // (This would require adding created_at to the query above)
      });

      setNewEventIds(newIds);
      console.log('[EventContext] New event IDs detected:', Array.from(newIds));

      // Update last visit timestamp
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());

      setEvents(allEvents);
      console.log('[EventContext] Events state updated with combined likes and ranking restored');

    } catch (error) {
      console.error('[EventContext] Error in refreshEvents:', error);
      toast.error('Fehler beim Laden der Events');
    }
  }, []);

  // Handle liking an event
  const handleLikeEvent = useCallback(async (eventId: string) => {
    console.log(`[EventContext] handleLikeEvent called for ${eventId}`);
    
    // Optimistic update for immediate UI feedback
    const currentSessionLikes = { ...sessionLikes };
    const currentSessionLike = currentSessionLikes[eventId] || 0;
    currentSessionLikes[eventId] = currentSessionLike + 1;
    
    console.log(`[EventContext] Optimistic update: ${eventId} session likes: ${currentSessionLike} -> ${currentSessionLike + 1}`);
    
    setSessionLikes(currentSessionLikes);
    saveSessionLikes(currentSessionLikes);

    // Update database
    try {
      const { data, error } = await supabase
        .from('github_event_likes')
        .upsert({
          event_id: eventId,
          likes: (eventLikes[eventId] || 0) + 1
        }, {
          onConflict: 'event_id'
        })
        .select();

      if (error) {
        console.error('[EventContext] Database update failed:', error);
        // Revert optimistic update on error
        const revertedLikes = { ...currentSessionLikes };
        revertedLikes[eventId] = currentSessionLike;
        setSessionLikes(revertedLikes);
        saveSessionLikes(revertedLikes);
        toast.error('Fehler beim Speichern des Likes');
        return;
      }

      console.log('[EventContext] Database updated successfully:', data);
      
      // Update local eventLikes state with new database value
      const newDbLikes = { ...eventLikes };
      newDbLikes[eventId] = (eventLikes[eventId] || 0) + 1;
      setEventLikes(newDbLikes);
      
      // Clear the session like for this event since it's now in the database
      const clearedSessionLikes = { ...currentSessionLikes };
      delete clearedSessionLikes[eventId];
      setSessionLikes(clearedSessionLikes);
      saveSessionLikes(clearedSessionLikes);
      
      console.log(`[EventContext] Like successfully saved to database for ${eventId}`);
      
    } catch (error) {
      console.error('[EventContext] Error updating database:', error);
      // Revert optimistic update on error
      const revertedLikes = { ...currentSessionLikes };
      revertedLikes[eventId] = currentSessionLike;
      setSessionLikes(revertedLikes);
      saveSessionLikes(revertedLikes);
      toast.error('Fehler beim Speichern des Likes');
    }
  }, [eventLikes, sessionLikes, saveSessionLikes]);

  // Add user event
  const addUserEvent = useCallback(async (eventData: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          organizer: eventData.organizer,
          category: eventData.category,
          link: eventData.link,
          image_urls: eventData.image_url ? [eventData.image_url] : null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[EventContext] User event added:', data);
      
      // Refresh events to include the new event
      await refreshEvents();
      
      toast.success('Event erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('[EventContext] Error adding user event:', error);
      toast.error('Fehler beim Hinzufügen des Events');
      throw error;
    }
  }, [refreshEvents]);

  // Initialize data on mount
  useEffect(() => {
    console.log('[EventContext] Initializing EventContext...');
    loadSessionLikes();
    refreshEvents();
  }, [loadSessionLikes, refreshEvents]);

  return (
    <EventContext.Provider
      value={{
        events,
        selectedDate,
        setSelectedDate,
        selectedEvent,
        setSelectedEvent,
        filter,
        setFilter,
        handleLikeEvent,
        showFavorites,
        setShowFavorites,
        eventLikes,
        refreshEvents,
        newEventIds,
        topEventsPerDay,
        addUserEvent
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
