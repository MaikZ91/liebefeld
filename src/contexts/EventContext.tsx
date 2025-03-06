
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

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [eventLikes, setEventLikes] = useState<Record<string, number>>({});

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing events...');
      
      const supabaseEvents = await fetchSupabaseEvents();
      console.log(`Loaded ${supabaseEvents.length} events from Supabase`);
      
      const githubLikes = await fetchGitHubLikes();
      
      setEventLikes(prev => {
        const updatedLikes = { ...prev, ...githubLikes };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      const externalEvents = await fetchExternalEvents(eventLikes);
      console.log(`Loaded ${externalEvents.length} external events`);
      
      const combinedEvents = [...supabaseEvents];
      
      externalEvents.forEach(extEvent => {
        if (!combinedEvents.some(event => event.id === extEvent.id)) {
          combinedEvents.push(extEvent);
        }
      });
      
      console.log(`Combined ${combinedEvents.length} total events`);
      
      if (combinedEvents.length === 0) {
        console.log('No events found, using example data');
        setEvents(bielefeldEvents);
      } else {
        setEvents(combinedEvents);
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
      } catch (updateError) {
        console.error(`Error updating likes in database for event ${eventId}:`, updateError);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  useEffect(() => {
    console.log('EventProvider: Loading events...');
    refreshEvents();
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
