
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startOfDay } from 'date-fns';
import { Event, RsvpOption } from '../types/eventTypes';
import { 
  fetchSupabaseEvents, 
  updateEventRsvp,
  syncGitHubEvents,
  addNewEvent,
  logTodaysEvents
} from '../services/eventService';
import { updateEventLikesInDb } from '../services/singleEventService';

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
  handleLikeEvent: (eventId: string) => Promise<void>;
  handleRsvpEvent: (eventId: string, option: RsvpOption) => Promise<void>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  refreshEvents: () => Promise<void>;
  topEventsPerDay: Record<string, string>;
  addUserEvent: (event: Omit<Event, 'id'>) => Promise<Event>;
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [topEventsPerDay, setTopEventsPerDay] = useState<Record<string, string>>({});

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [refreshEvents] STARTING refresh...');
      
      // First sync GitHub events
      await syncGitHubEvents();
      
      // Then fetch all events from unified table
      const refreshStartTime = Date.now();
      const allEvents = await fetchSupabaseEvents();
      const refreshDuration = Date.now() - refreshStartTime;
      
      console.log(`🔄 [refreshEvents] Loaded ${allEvents.length} events in ${refreshDuration}ms`);
      
      // Calculate top events per day
      const topEventsByDay: Record<string, string> = {};
      const eventsByDate: Record<string, Event[]> = {};
      
      allEvents.forEach(event => {
        if (!event.date) return;
        
        if (!eventsByDate[event.date]) {
          eventsByDate[event.date] = [];
        }
        
        eventsByDate[event.date].push(event);
      });
      
      Object.keys(eventsByDate).forEach(date => {
        const sortedEvents = [...eventsByDate[date]].sort((a, b) => {
          if (b.likes !== a.likes) {
            return b.likes - a.likes;
          }
          return a.id.localeCompare(b.id);
        });
        
        if (sortedEvents.length > 0) {
          topEventsByDay[date] = sortedEvents[0].id;
        }
      });
      
      setTopEventsPerDay(topEventsByDay);
      setEvents(allEvents);
      
      logTodaysEvents(allEvents);
      
      console.log('🔄 [refreshEvents] COMPLETED ✅');
      
    } catch (error) {
      console.error('🔄 [refreshEvents] ERROR:', error);
      console.log('Keeping current events due to error, no fallback to example data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeEvent = async (eventId: string) => {
    const eventToLike = events.find(e => e.id === eventId);
    if (!eventToLike) {
      console.error(`[handleLikeEvent] Event with ID ${eventId} not found.`);
      return;
    }

    const oldLikes = eventToLike.likes || 0;
    const newLikes = oldLikes + 1;

    // Optimistic UI update
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, likes: newLikes } : event
      )
    );

    // Update database
    const success = await updateEventLikesInDb(eventId, newLikes);

    // Revert if DB update fails
    if (!success) {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId ? { ...event, likes: oldLikes } : event
        )
      );
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
      
      const currentRsvp = {
        yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
        no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
        maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
      };
      
      const newRsvp = { ...currentRsvp };
      newRsvp[option] += 1;
      
      console.log(`Updating RSVP for ${eventId} to:`, newRsvp);
      
      await updateEventRsvp(eventId, newRsvp);
      console.log(`Successfully updated RSVP in database for event ${eventId}`);
      
      const newLikesValue = Math.max(currentEvent.likes || 0, newRsvp.yes + newRsvp.maybe);
      
      await updateEventLikesInDb(eventId, newLikesValue);
      console.log(`Successfully updated likes in database for event ${eventId} to ${newLikesValue}`);
      
      setEvents(prevEvents => {
        return prevEvents.map(event => 
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
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const addUserEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
    try {
      console.log('Adding new user event to database and local state:', eventData);
      
      const newEvent = await addNewEvent(eventData);
      console.log('Successfully added new event to database:', newEvent);
      
      setEvents(prevEvents => 
        [...prevEvents, newEvent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      
      return newEvent;
    } catch (error) {
      console.error('Error adding new event:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('EventProvider: Initial event load...');
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
    handleLikeEvent,
    handleRsvpEvent,
    showFavorites,
    setShowFavorites,
    refreshEvents,
    topEventsPerDay,
    addUserEvent,
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
