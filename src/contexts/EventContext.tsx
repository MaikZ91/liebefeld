import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startOfDay } from 'date-fns';
import { Event } from '../types/eventTypes';
import { 
  fetchSupabaseEvents, 
  fetchExternalEvents, 
  fetchGitHubLikes, 
  updateEventLikes,
  bielefeldEvents
} from '../services/eventService';

interface EventContextProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  isLoading: boolean;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  selectedEvent: Event | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  filter: string | null;
  setFilter: React.Dispatch<React.SetStateAction<string | null>>;
  eventLikes: Record<string, number>;
  handleLikeEvent: (eventId: string) => Promise<void>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  refreshEvents: () => Promise<void>;
}

declare global {
  interface Window {
    refreshEventsContext?: () => Promise<void>;
  }
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [eventLikes, setEventLikes] = useState<Record<string, number>>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing events...');
      
      // First, fetch likes to ensure we have the most up-to-date data
      const githubLikes = await fetchGitHubLikes();
      console.log('Fetched GitHub likes:', githubLikes);
      
      setEventLikes(prev => {
        const updatedLikes = { ...prev, ...githubLikes };
        console.log('Updated event likes state:', updatedLikes);
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Store the old events to compare later
      const oldEvents = [...events];
      
      // Now fetch events 
      const supabaseEvents = await fetchSupabaseEvents();
      console.log(`Loaded ${supabaseEvents.length} events from Supabase`);
      
      // Fetch external events with the latest likes data
      const externalEvents = await fetchExternalEvents(githubLikes);
      console.log(`Loaded ${externalEvents.length} external events`);
      
      const combinedEvents = [...supabaseEvents];
      
      // Keep track of new events
      const newEvents: Event[] = [];
      
      externalEvents.forEach(extEvent => {
        // Make sure we're not adding duplicates
        if (!combinedEvents.some(event => event.id === extEvent.id)) {
          // Ensure the likes from the database are applied
          combinedEvents.push({
            ...extEvent,
            likes: githubLikes[extEvent.id] || 0
          });
          
          // Check if this event existed in the old events list
          if (!oldEvents.some(oldEvent => oldEvent.id === extEvent.id)) {
            newEvents.push(extEvent);
          }
        }
      });
      
      console.log(`Combined ${combinedEvents.length} total events`);
      console.log(`Found ${newEvents.length} new events since last refresh`);
      
      if (combinedEvents.length === 0) {
        console.log('No events found, using example data');
        setEvents(bielefeldEvents);
      } else {
        // Debugging: log likes for GitHub events
        const githubEventsInCombined = combinedEvents.filter(e => e.id.startsWith('github-'));
        console.log(`GitHub events with likes: ${githubEventsInCombined.map(e => `${e.id}: ${e.likes}`).join(', ')}`);
        
        setEvents(combinedEvents);
        
        // Store last refresh time
        setLastRefreshed(new Date());
        localStorage.setItem('lastEventsRefresh', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents(bielefeldEvents);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeEvent = async (eventId: string) => {
    try {
      console.log(`Liking event with ID: ${eventId}`);
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) {
        console.error(`Event with ID ${eventId} not found`);
        return;
      }
      
      const currentLikes = currentEvent.likes || 0;
      const newLikesValue = currentLikes + 1;
      
      console.log(`Updating likes for ${eventId} from ${currentLikes} to ${newLikesValue}`);
      
      // Update the local state
      setEventLikes(prev => {
        const updatedLikes = {
          ...prev,
          [eventId]: prev[eventId] ? prev[eventId] + 1 : 1
        };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Update events array with new likes value
      const updatedEvents = events.map(event => 
        event.id === eventId 
          ? { ...event, likes: newLikesValue } 
          : event
      );
      
      setEvents(updatedEvents);
      
      // Make sure to update database with new likes value
      try {
        console.log(`Updating event likes in database: ${eventId} -> ${newLikesValue}`);
        await updateEventLikes(eventId, newLikesValue);
        console.log(`Successfully updated likes in database for event ${eventId}`);
        
        // Refresh events to make sure we have the latest data
        await refreshEvents();
      } catch (updateError) {
        console.error(`Error updating likes in database for event ${eventId}:`, updateError);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  useEffect(() => {
    console.log('EventProvider: Loading events...');
    
    // Check when events were last refreshed
    const lastRefreshStr = localStorage.getItem('lastEventsRefresh');
    if (lastRefreshStr) {
      const lastRefresh = new Date(lastRefreshStr);
      const now = new Date();
      const hoursSinceLastRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
      
      console.log(`Last events refresh was ${hoursSinceLastRefresh.toFixed(2)} hours ago`);
      
      // If it's been more than an hour, refresh events
      if (hoursSinceLastRefresh > 1) {
        console.log('More than 1 hour since last refresh, fetching new events');
        refreshEvents();
      } else {
        console.log('Less than 1 hour since last refresh, loading cached events');
        // Still fetch events, but we won't force a refresh of external data
        refreshEvents();
      }
    } else {
      // No record of last refresh, so do a full refresh
      console.log('No record of last refresh, doing full refresh');
      refreshEvents();
    }
    
    // Expose refreshEvents globally so it can be called from other components
    window.refreshEventsContext = refreshEvents;
    
    return () => {
      // Clean up global reference when component unmounts
      delete window.refreshEventsContext;
    };
  }, []);

  const value = {
    events,
    setEvents,
    isLoading,
    selectedDate,
    setSelectedDate,
    selectedEvent,
    setSelectedEvent,
    filter,
    setFilter,
    eventLikes,
    handleLikeEvent,
    showFavorites,
    setShowFavorites,
    refreshEvents,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
