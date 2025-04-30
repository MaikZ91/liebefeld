
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { eventService } from '@/services/eventService';
import { Event as EventType } from '@/types/eventTypes';

// Use the Event type from types/eventTypes.ts for consistency
export type Event = EventType;

export interface EventContextProps {
  events: Event[];
  refreshEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  toggleLike: (eventId: string) => Promise<void>;
  isLoadingEvents: boolean;
  updateRSVP: (eventId: string, status: 'yes' | 'no' | 'maybe') => Promise<void>;
  // Add missing properties needed by components
  eventLikes: Record<string, number>;
  newEventIds: Set<string>;
  filter: string | null;
  topEventsPerDay: Record<string, string>;
  handleRsvpEvent: (eventId: string, status: 'yes' | 'no' | 'maybe') => Promise<void>;
}

const EventContext = createContext<EventContextProps>({
  events: [],
  refreshEvents: async () => {},
  addEvent: async () => {},
  toggleLike: async () => {},
  isLoadingEvents: false,
  updateRSVP: async () => {},
  // Initialize new properties
  eventLikes: {},
  newEventIds: new Set<string>(),
  filter: null,
  topEventsPerDay: {},
  handleRsvpEvent: async () => {}
});

export const useEventContext = () => useContext(EventContext);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  // Add new states for the additional properties
  const [eventLikes, setEventLikes] = useState<Record<string, number>>({});
  const [newEventIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string | null>(null);
  const [topEventsPerDay, setTopEventsPerDay] = useState<Record<string, string>>({});

  const refreshEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      const fetchedEvents = await eventService.getAllEvents();
      setEvents(fetchedEvents);
      
      // Calculate top events per day
      const topEventsByDay: Record<string, string> = {};
      fetchedEvents.forEach(event => {
        if (!event.date) return;
        
        const currentTopEvent = topEventsByDay[event.date];
        const currentTopEventLikes = currentTopEvent ? 
          fetchedEvents.find(e => e.id === currentTopEvent)?.likes || 0 : 0;
        
        if (!currentTopEvent || (event.likes || 0) > currentTopEventLikes) {
          topEventsByDay[event.date] = event.id;
        }
      });
      
      setTopEventsPerDay(topEventsByDay);
      
      // Extract event likes for GitHub events
      const likes: Record<string, number> = {};
      fetchedEvents.forEach(event => {
        if (event.id.startsWith('github-')) {
          likes[event.id] = event.likes || 0;
        }
      });
      
      setEventLikes(likes);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Fehler beim Laden der Events', {
        description: 'Bitte versuche es später noch einmal.',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    try {
      // Add event to database
      const { data, error } = await supabase
        .from('community_events')
        .insert({
          title: event.title,
          description: event.description || '',
          date: event.date,
          time: event.time,
          location: event.location || '',
          category: event.category,
          organizer: event.organizer || '',
          link: event.link || '',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new event to the local state
      const newEvent: Event = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        category: data.category,
        organizer: data.organizer,
        link: data.link,
        likes: 0,
        rsvp_yes: 0,
        rsvp_no: 0,
        rsvp_maybe: 0,
        origin: 'database',
      };

      setEvents(prevEvents => [...prevEvents, newEvent]);
      
      // Add to new events set
      newEventIds.add(data.id);
      
      return;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }, [newEventIds]);

  const toggleLike = useCallback(async (eventId: string) => {
    try {
      // Optimistically update the UI
      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.id === eventId) {
            const currentLikes = event.likes || 0;
            return {
              ...event,
              likes: currentLikes + 1,
            };
          }
          return event;
        })
      );

      // Also update eventLikes for GitHub events
      if (eventId.startsWith('github-')) {
        setEventLikes(prev => ({
          ...prev,
          [eventId]: (prev[eventId] || 0) + 1
        }));
      }

      // Update likes in database
      if (eventId.startsWith('github-')) {
        const githubEventId = eventId.substring(7); // Remove "github-" prefix
        await eventService.updateGithubEventLikes(githubEventId);
      } else {
        await eventService.updateDatabaseEventLikes(eventId);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      
      // Revert the optimistic update
      await refreshEvents();
      
      toast.error('Fehler beim Liken des Events', {
        description: 'Bitte versuche es später noch einmal.',
      });
    }
  }, [refreshEvents]);

  const updateRSVP = useCallback(async (eventId: string, status: 'yes' | 'no' | 'maybe') => {
    try {
      // Optimistically update the UI
      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.id === eventId) {
            const updatedEvent = { ...event };
            
            // Increment the selected status
            if (status === 'yes') {
              updatedEvent.rsvp_yes = (updatedEvent.rsvp_yes || 0) + 1;
            } else if (status === 'no') {
              updatedEvent.rsvp_no = (updatedEvent.rsvp_no || 0) + 1;
            } else if (status === 'maybe') {
              updatedEvent.rsvp_maybe = (updatedEvent.rsvp_maybe || 0) + 1;
            }
            
            return updatedEvent;
          }
          return event;
        })
      );

      // Update RSVP in database
      if (eventId.startsWith('github-')) {
        const githubEventId = eventId.substring(7); // Remove "github-" prefix
        await eventService.updateGithubEventRSVP(githubEventId, status);
      } else {
        await eventService.updateDatabaseEventRSVP(eventId, status);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      
      // Revert the optimistic update
      await refreshEvents();
      
      toast.error('Fehler beim RSVP des Events', {
        description: 'Bitte versuche es später noch einmal.',
      });
    }
  }, [refreshEvents]);

  // Add handler for RSVP events from chat
  const handleRsvpEvent = useCallback(async (eventId: string, status: 'yes' | 'no' | 'maybe') => {
    await updateRSVP(eventId, status);
    
    const statusText = status === 'yes' ? 'teilnehmen' : 
                      status === 'no' ? 'nicht teilnehmen' : 
                      'vielleicht teilnehmen';
    
    const event = events.find(e => e.id === eventId);
    if (event) {
      toast.success(`Du wirst am ${event.title} ${statusText}`, {
        description: `Deine RSVP wurde für dieses Event gespeichert.`
      });
    }
  }, [events, updateRSVP]);

  // Load events on component mount
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  return (
    <EventContext.Provider
      value={{
        events,
        refreshEvents,
        addEvent,
        toggleLike,
        isLoadingEvents,
        updateRSVP,
        // Add new properties
        eventLikes,
        newEventIds,
        filter,
        topEventsPerDay,
        handleRsvpEvent
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
