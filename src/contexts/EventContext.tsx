import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

  const refreshEvents = useCallback(async () => {
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
      
      setEvents(allEvents);
      
      logTodaysEvents(allEvents);
      
      console.log('🔄 [refreshEvents] COMPLETED ✅');
      
    } catch (error) {
      console.error('🔄 [refreshEvents] ERROR:', error);
      console.log('Keeping current events due to error, no fallback to example data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const topEventsByDay: Record<string, string> = {};
    const eventsByDate: Record<string, Event[]> = {};

    events.forEach(event => {
      if (!event.date) return;
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    });

    Object.keys(eventsByDate).forEach(date => {
      const sortedEvents = [...eventsByDate[date]].sort((a, b) => {
        const bLikes = b.likes || 0;
        const aLikes = a.likes || 0;
        if (bLikes !== aLikes) {
          return bLikes - aLikes;
        }
        return a.id.localeCompare(b.id);
      });

      if (sortedEvents.length > 0) {
        topEventsByDay[date] = sortedEvents[0].id;
      }
    });

    setTopEventsPerDay(topEventsByDay);
  }, [events]);

  const handleLikeEvent = useCallback(async (eventId: string) => {
    console.log(`[handleLikeEvent] 💙 Funktion wurde für Event-ID aufgerufen: ${eventId}`);

    if (!eventId || typeof eventId !== 'string') {
        console.error('[handleLikeEvent] 🛑 Ungültige oder fehlende eventId!', eventId);
        return;
    }
    
    let oldLikes = -1; // -1 to indicate event not found yet

    try {
        // Optimistic UI update
        setEvents(prevEvents => {
            const eventToLike = prevEvents.find(e => e.id === eventId);
            if (!eventToLike) {
                console.error(`[handleLikeEvent] 💔 Event mit ID ${eventId} im State nicht gefunden.`);
                return prevEvents; // Return unchanged state if event not found
            };
            oldLikes = eventToLike.likes || 0;
            console.log(`[handleLikeEvent] 👍 Optimistisches Update: oldLikes=${oldLikes}, newLikes=${oldLikes + 1}`);
            
            return prevEvents.map(event =>
                event.id === eventId ? { ...event, likes: oldLikes + 1 } : event
            );
        });

        // A short delay to ensure state update has propagated before we check oldLikes
        await new Promise(resolve => setTimeout(resolve, 0));

        if (oldLikes === -1) {
            console.error("[handleLikeEvent] 🛑 Abbruch, da Event nicht im State gefunden wurde.");
            return;
        }

        // Update database
        console.log(`[handleLikeEvent] 🚀 Datenbank-Update wird für ${eventId} mit newLikes=${oldLikes + 1} aufgerufen...`);
        const success = await updateEventLikesInDb(eventId, oldLikes + 1);
        console.log(`[handleLikeEvent] 🛰️ Datenbank-Update Ergebnis: ${success ? '✅ ERFOLGREICH' : '❌ FEHLGESCHLAGEN'}`);

        // Revert if DB update fails
        if (!success) {
          console.log(`[handleLikeEvent] ⏪ Rollback wird ausgeführt. Likes werden auf ${oldLikes} zurückgesetzt.`);
          setEvents(prevEvents =>
            prevEvents.map(event =>
              event.id === eventId ? { ...event, likes: oldLikes } : event
            )
          );
        }
    } catch (error) {
        console.error('[handleLikeEvent] 💥 Unerwarteter Fehler im try-catch Block:', error);
        // Revert on any unexpected error
        if (oldLikes !== -1) {
            setEvents(prevEvents =>
                prevEvents.map(event =>
                  event.id === eventId ? { ...event, likes: oldLikes } : event
                )
            );
        }
    }
  }, []);

  const handleRsvpEvent = useCallback(async (eventId: string, option: RsvpOption) => {
    try {
      console.log(`RSVP for event with ID: ${eventId}, option: ${option}`);
      let newLikesValue = 0;
      const newRsvp = { yes: 0, no: 0, maybe: 0 };
      
      setEvents(prevEvents => {
        const currentEvent = prevEvents.find(event => event.id === eventId);
        if (!currentEvent) {
          console.error(`Event with ID ${eventId} not found`);
          return prevEvents;
        }
        
        const currentRsvp = {
          yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
          no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
          maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
        };
        
        newRsvp.yes = currentRsvp.yes;
        newRsvp.no = currentRsvp.no;
        newRsvp.maybe = currentRsvp.maybe;
        newRsvp[option] += 1;
        
        newLikesValue = Math.max(currentEvent.likes || 0, newRsvp.yes + newRsvp.maybe);
        
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
      
      await updateEventRsvp(eventId, newRsvp);
      console.log(`Successfully updated RSVP in database for event ${eventId}`);
      
      await updateEventLikesInDb(eventId, newLikesValue);
      console.log(`Successfully updated likes in database for event ${eventId} to ${newLikesValue}`);
      
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  }, []);

  const addUserEvent = useCallback(async (eventData: Omit<Event, 'id'>): Promise<Event> => {
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
  }, []);

  useEffect(() => {
    console.log('EventProvider: Initial event load...');
    refreshEvents();
  }, [refreshEvents]);

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
