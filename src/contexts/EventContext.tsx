import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startOfDay } from 'date-fns';
import { Event, RsvpOption } from '../types/eventTypes';
import { 
  fetchSupabaseEvents, 
  fetchExternalEvents, 
  fetchGitHubLikes, 
  updateEventLikes,
  bielefeldEvents,
  updateEventRsvp
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
  handleRsvpEvent: (eventId: string, option: RsvpOption) => Promise<void>;
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
      
      // First fetch GitHub likes to ensure we have the latest counts
      const githubLikes = await fetchGitHubLikes();
      console.log('Fetched GitHub likes:', githubLikes);
      
      // Create a proper likes map with only numeric values
      const likesMap: Record<string, number> = {};
      Object.keys(githubLikes).forEach(eventId => {
        if (typeof githubLikes[eventId].likes === 'number') {
          likesMap[eventId] = githubLikes[eventId].likes;
        }
      });
      
      setEventLikes(prev => {
        const updatedLikes = { ...prev, ...likesMap };
        console.log('Updated event likes state:', updatedLikes);
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      const oldEvents = [...events];
      
      // Fetch events from Supabase
      const supabaseEvents = await fetchSupabaseEvents();
      console.log(`Loaded ${supabaseEvents.length} events from Supabase`);
      
      // Fetch events from external source (GitHub)
      const externalEvents = await fetchExternalEvents(likesMap);
      console.log(`Loaded ${externalEvents.length} external events`);
      
      const combinedEvents = [...supabaseEvents];
      
      const newEvents: Event[] = [];
      
      // Combine the events, ensuring no duplicates
      externalEvents.forEach(extEvent => {
        if (!combinedEvents.some(event => event.id === extEvent.id)) {
          // Add GitHub likes count to external events
          combinedEvents.push({
            ...extEvent,
            likes: typeof likesMap[extEvent.id] === 'number' ? likesMap[extEvent.id] : 0,
            rsvp_yes: githubLikes[extEvent.id]?.rsvp_yes || 0,
            rsvp_no: githubLikes[extEvent.id]?.rsvp_no || 0,
            rsvp_maybe: githubLikes[extEvent.id]?.rsvp_maybe || 0
          });
          
          if (!oldEvents.some(oldEvent => oldEvent.id === extEvent.id)) {
            newEvents.push(extEvent);
          }
        }
      });
      
      console.log(`Combined ${combinedEvents.length} total events`);
      console.log(`Found ${newEvents.length} new events since last refresh`);
      
      // If no events found, use example data
      if (combinedEvents.length === 0) {
        console.log('No events found, using example data');
        setEvents(bielefeldEvents);
      } else {
        // Map RSVP counts from GitHub likes to the event objects consistently
        const eventsWithSyncedRsvp = combinedEvents.map(event => {
          // For GitHub events, make sure we have the latest RSVP counts
          if (event.id.startsWith('github-') && githubLikes[event.id]) {
            // Calculate total RSVP counts for likes
            const totalRsvp = (githubLikes[event.id]?.rsvp_yes || 0) + 
                            (githubLikes[event.id]?.rsvp_maybe || 0);
            
            // Synchronize likes with RSVP counts
            const syncedLikes = Math.max(totalRsvp, githubLikes[event.id]?.likes || 0);
            
            return {
              ...event,
              likes: syncedLikes,
              rsvp_yes: githubLikes[event.id]?.rsvp_yes || 0,
              rsvp_no: githubLikes[event.id]?.rsvp_no || 0,
              rsvp_maybe: githubLikes[event.id]?.rsvp_maybe || 0,
              // Also maintain the rsvp object for backward compatibility
              rsvp: {
                yes: githubLikes[event.id]?.rsvp_yes || 0,
                no: githubLikes[event.id]?.rsvp_no || 0,
                maybe: githubLikes[event.id]?.rsvp_maybe || 0
              }
            };
          }
          
          // For regular events, ensure we have an rsvp object and sync with likes
          if (event.rsvp_yes !== undefined || event.rsvp_no !== undefined || event.rsvp_maybe !== undefined) {
            const totalRsvp = (event.rsvp_yes || 0) + (event.rsvp_maybe || 0);
            const syncedLikes = Math.max(totalRsvp, event.likes || 0);
            
            return {
              ...event,
              likes: syncedLikes,
              rsvp: {
                yes: event.rsvp_yes || 0,
                no: event.rsvp_no || 0,
                maybe: event.rsvp_maybe || 0
              }
            };
          }
          
          return event;
        });
        
        const githubEventsInCombined = eventsWithSyncedRsvp.filter(e => e.id.startsWith('github-'));
        console.log(`GitHub events with likes: ${githubEventsInCombined.map(e => `${e.id}: ${e.likes} - RSVP: yes=${e.rsvp_yes || e.rsvp?.yes || 0}, no=${e.rsvp_no || e.rsvp?.no || 0}, maybe=${e.rsvp_maybe || e.rsvp?.maybe || 0}`).join(', ')}`);
        
        setEvents(eventsWithSyncedRsvp);
        
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
      
      // Update likes in local state
      setEventLikes(prev => {
        const updatedLikes = {
          ...prev,
          [eventId]: prev[eventId] ? prev[eventId] + 1 : 1
        };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Update RSVP counts to match likes (synchronization)
      const currentRsvp = {
        yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
        no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
        maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
      };
      
      // Increment "yes" RSVP count along with likes
      const newRsvp = { 
        ...currentRsvp,
        yes: currentRsvp.yes + 1 
      };
      
      // Update the event in the events array
      const updatedEvents = events.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              likes: newLikesValue,
              rsvp_yes: newRsvp.yes,
              rsvp_no: newRsvp.no,
              rsvp_maybe: newRsvp.maybe,
              rsvp: newRsvp
            } 
          : event
      );
      
      setEvents(updatedEvents);
      
      try {
        console.log(`Updating event likes in database: ${eventId} -> ${newLikesValue}`);
        await updateEventLikes(eventId, newLikesValue);
        
        // Also update RSVP to keep them in sync
        console.log(`Synchronizing RSVP counts with likes: ${eventId} -> ${JSON.stringify(newRsvp)}`);
        await updateEventRsvp(eventId, newRsvp);
        
        console.log(`Successfully updated likes and RSVP in database for event ${eventId}`);
        
        // Refresh events to get the latest data
        await refreshEvents();
      } catch (updateError) {
        console.error(`Error updating likes/RSVP in database for event ${eventId}:`, updateError);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleRsvpEvent = async (eventId: string, option: RsvpOption) => {
    try {
      console.log(`RSVP for event with ID: ${eventId}, option: ${option}`);
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) {
        console.error(`Event with ID ${eventId} not found`);
        return;
      }
      
      // Normalize the current RSVP counts
      const currentRsvp = {
        yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
        no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
        maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
      };
      
      const newRsvp = { ...currentRsvp };
      
      newRsvp[option] += 1;
      
      console.log(`Updating RSVP for ${eventId} to:`, newRsvp);
      
      // Calculate new likes value based on RSVP counts
      const currentLikes = currentEvent.likes || 0;
      // Likes should be at least as high as the sum of 'yes' and 'maybe' RSVPs
      const newLikesValue = Math.max(currentLikes, newRsvp.yes + newRsvp.maybe);
      
      console.log(`Synchronizing likes with RSVP: ${eventId} -> ${newLikesValue}`);
      
      // Update the events state with the new RSVP counts and likes
      const updatedEvents = events.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              // Update both the individual fields and the rsvp object
              likes: newLikesValue,
              rsvp_yes: newRsvp.yes,
              rsvp_no: newRsvp.no,
              rsvp_maybe: newRsvp.maybe,
              rsvp: newRsvp 
            } 
          : event
      );
      
      setEvents(updatedEvents);
      
      try {
        // Update both RSVP and likes to keep them in sync
        console.log(`Updating event RSVP in database: ${eventId} -> ${JSON.stringify(newRsvp)}`);
        await updateEventRsvp(eventId, newRsvp);
        
        console.log(`Updating event likes in database to match RSVP: ${eventId} -> ${newLikesValue}`);
        await updateEventLikes(eventId, newLikesValue);
        
        console.log(`Successfully updated RSVP and likes in database for event ${eventId}`);
        
        // Refresh events to ensure all components have the updated data
        await refreshEvents();
      } catch (updateError) {
        console.error(`Error updating RSVP/likes in database for event ${eventId}:`, updateError);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  useEffect(() => {
    console.log('EventProvider: Loading events...');
    
    const lastRefreshStr = localStorage.getItem('lastEventsRefresh');
    if (lastRefreshStr) {
      const lastRefresh = new Date(lastRefreshStr);
      const now = new Date();
      const hoursSinceLastRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
      
      console.log(`Last events refresh was ${hoursSinceLastRefresh.toFixed(2)} hours ago`);
      
      if (hoursSinceLastRefresh > 1) {
        console.log('More than 1 hour since last refresh, fetching new events');
        refreshEvents();
      } else {
        console.log('Less than 1 hour since last refresh, loading cached events');
        refreshEvents();
      }
    } else {
      console.log('No record of last refresh, doing full refresh');
      refreshEvents();
    }
    
    window.refreshEventsContext = refreshEvents;
    
    return () => {
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
    handleRsvpEvent,
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
