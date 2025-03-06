
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
  // State variables
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [eventLikes, setEventLikes] = useState<Record<string, number>>(() => {
    const savedLikes = localStorage.getItem('eventLikes');
    return savedLikes ? JSON.parse(savedLikes) : {};
  });

  // Load events on component mount
  useEffect(() => {
    refreshEvents();
  }, []);

  // Function to refresh events
  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      // Load events from Supabase
      const supabaseEvents = await fetchSupabaseEvents();
      
      // Load GitHub likes
      const githubLikes = await fetchGitHubLikes();
      
      // Update local storage with GitHub likes
      setEventLikes(prev => {
        const updatedLikes = { ...prev, ...githubLikes };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Load external events
      const externalEvents = await fetchExternalEvents(eventLikes);
      
      // Combine events, ensuring no duplicates
      const combinedEvents = [...supabaseEvents];
      
      // Add external events that don't exist in Supabase
      externalEvents.forEach(extEvent => {
        if (!combinedEvents.some(event => event.id === extEvent.id)) {
          combinedEvents.push(extEvent);
        }
      });
      
      // If no events were loaded, use example data
      if (combinedEvents.length === 0) {
        setEvents(bielefeldEvents);
      } else {
        setEvents(combinedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Use example data if everything fails
      setEvents(bielefeldEvents);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle like functionality
  const handleLikeEvent = async (eventId: string) => {
    try {
      // Find the current event
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) return;
      
      // Calculate new likes value
      const currentLikes = currentEvent.likes || 0;
      const newLikesValue = currentLikes + 1;
      
      // Update likes in our state
      setEventLikes(prev => {
        const updatedLikes = {
          ...prev,
          [eventId]: prev[eventId] ? prev[eventId] + 1 : 1
        };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Update events array
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: newLikesValue } 
            : event
        )
      );
      
      // Update likes in Supabase
      await updateEventLikes(eventId, newLikesValue);
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

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

export const useEventContext = (): EventContextProps => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
