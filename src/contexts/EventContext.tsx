import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startOfDay, format } from 'date-fns';
import { Event, RsvpOption } from '../types/eventTypes';
import { 
  fetchSupabaseEvents, 
  fetchExternalEvents, 
  fetchGitHubLikes, 
  updateEventLikes,
  bielefeldEvents,
  updateEventRsvp,
  syncGitHubEvents,
  addNewEvent,
  logTodaysEvents
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
  newEventIds: Set<string>;
  topEventsPerDay: Record<string, string>;
  addUserEvent: (event: Omit<Event, 'id'>) => Promise<Event>;
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
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [topEventsPerDay, setTopEventsPerDay] = useState<Record<string, string>>({});

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing events...');
      
      const previouslySeenEventsJson = localStorage.getItem('seenEventIds');
      const previouslySeenEvents: string[] = previouslySeenEventsJson ? JSON.parse(previouslySeenEventsJson) : [];
      const previouslySeenSet = new Set(previouslySeenEvents);
      
      // Load GitHub likes from database first
      const githubLikes = await fetchGitHubLikes();
      console.log('Fetched GitHub likes from database:', githubLikes);
      
      // Set eventLikes directly from database - no merge logic
      const databaseLikes: Record<string, number> = {};
      Object.keys(githubLikes).forEach(eventId => {
        databaseLikes[eventId] = githubLikes[eventId].likes || 0;
      });
      
      setEventLikes(databaseLikes);
      console.log('Updated event likes state with database values:', databaseLikes);
      
      const supabaseEvents = await fetchSupabaseEvents();
      console.log(`Loaded ${supabaseEvents.length} events from Supabase`);
      
      const externalEvents = await fetchExternalEvents(databaseLikes);
      console.log(`Loaded ${externalEvents.length} external events`);
      
      await syncGitHubEvents(externalEvents);
      
      const eventMap = new Map<string, Event>();
      
      supabaseEvents.forEach(event => {
        eventMap.set(event.id, event);
      });
      
      externalEvents.forEach(extEvent => {
        if (!eventMap.has(extEvent.id)) {
          // Use database likes for GitHub events
          const eventLikes = databaseLikes[extEvent.id] || 0;
          eventMap.set(extEvent.id, {
            ...extEvent,
            likes: eventLikes,
            rsvp_yes: githubLikes[extEvent.id]?.rsvp_yes || 0,
            rsvp_no: githubLikes[extEvent.id]?.rsvp_no || 0,
            rsvp_maybe: githubLikes[extEvent.id]?.rsvp_maybe || 0
          });
        }
      });
      
      const combinedEvents = Array.from(eventMap.values());
      
      const newEventIdsSet = new Set<string>();
      
      const currentEventIds = combinedEvents.map(event => event.id);
      currentEventIds.forEach(id => {
        if (!previouslySeenSet.has(id)) {
          newEventIdsSet.add(id);
        }
      });
      
      setNewEventIds(newEventIdsSet);
      
      localStorage.setItem('seenEventIds', JSON.stringify(currentEventIds));
      
      if (combinedEvents.length === 0) {
        console.log('No events found, using example data');
        setEvents(bielefeldEvents);
      } else {
        const eventsWithSyncedRsvp = combinedEvents.map(event => {
          if (event.id.startsWith('github-') && githubLikes[event.id]) {
            const eventLikes = databaseLikes[event.id] || 0;
            return {
              ...event,
              likes: eventLikes,
              rsvp_yes: githubLikes[event.id]?.rsvp_yes || 0,
              rsvp_no: githubLikes[event.id]?.rsvp_no || 0,
              rsvp_maybe: githubLikes[event.id]?.rsvp_maybe || 0,
              rsvp: {
                yes: githubLikes[event.id]?.rsvp_yes || 0,
                no: githubLikes[event.id]?.rsvp_no || 0,
                maybe: githubLikes[event.id]?.rsvp_maybe || 0
              }
            };
          }
          
          if (event.rsvp_yes !== undefined || event.rsvp_no !== undefined || event.rsvp_maybe !== undefined) {
            return {
              ...event,
              rsvp: {
                yes: event.rsvp_yes || 0,
                no: event.rsvp_no || 0,
                maybe: event.rsvp_maybe || 0
              }
            };
          }
          
          return event;
        });
        
        const topEventsByDay: Record<string, string> = {};
        const eventsByDate: Record<string, Event[]> = {};
        
        eventsWithSyncedRsvp.forEach(event => {
          if (!event.date) return;
          
          if (!eventsByDate[event.date]) {
            eventsByDate[event.date] = [];
          }
          
          eventsByDate[event.date].push(event);
        });
        
        Object.keys(eventsByDate).forEach(date => {
          const sortedEvents = [...eventsByDate[date]].sort((a, b) => {
            // Use database likes for GitHub events, event.likes for others
            const likesA = a.id.startsWith('github-') ? (databaseLikes[a.id] || 0) : (a.likes || 0);
            const likesB = b.id.startsWith('github-') ? (databaseLikes[b.id] || 0) : (b.likes || 0);
            
            if (likesB !== likesA) {
              return likesB - likesA;
            }
            
            return a.id.localeCompare(b.id);
          });
          
          if (sortedEvents.length > 0) {
            topEventsByDay[date] = sortedEvents[0].id;
          }
        });
        
        setTopEventsPerDay(topEventsByDay);
        setEvents(eventsWithSyncedRsvp);
        
        localStorage.setItem('lastEventsRefresh', new Date().toISOString());
        
        logTodaysEvents(eventsWithSyncedRsvp);
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
      if (pendingLikes.has(eventId)) {
        console.log(`Like operation already in progress for event ${eventId}`);
        return;
      }
      
      console.log(`Starting like operation for event with ID: ${eventId}`);
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) {
        console.error(`Event with ID ${eventId} not found`);
        return;
      }
      
      setPendingLikes(prev => new Set(prev).add(eventId));
      
      // Get current likes from the correct source
      const currentLikes = currentEvent.id.startsWith('github-') 
        ? (eventLikes[eventId] || 0) 
        : (currentEvent.likes || 0);
      
      const newLikesValue = currentLikes + 1;
      
      console.log(`Increasing likes for ${eventId} from ${currentLikes} to ${newLikesValue}`);
      
      try {
        // First update database
        await updateEventLikes(eventId, newLikesValue);
        console.log(`Successfully updated likes in database for event ${eventId}`);
        
        // Then update local state only after successful database update
        setEventLikes(prev => ({
          ...prev,
          [eventId]: newLikesValue
        }));
        
        // Update events state for immediate UI response
        setEvents(prevEvents => {
          const updatedEvents = prevEvents.map(event => 
            event.id === eventId 
              ? { 
                  ...event, 
                  likes: newLikesValue,
                  rsvp_yes: (event.rsvp_yes ?? event.rsvp?.yes ?? 0) + 1,
                  rsvp: {
                    yes: (event.rsvp_yes ?? event.rsvp?.yes ?? 0) + 1,
                    no: event.rsvp_no ?? event.rsvp?.no ?? 0,
                    maybe: event.rsvp_maybe ?? event.rsvp?.maybe ?? 0
                  }
                } 
              : event
          );
          
          return updatedEvents.sort((a, b) => {
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            
            const likesA = a.id.startsWith('github-') ? (eventLikes[a.id] || 0) : (a.likes || 0);
            const likesB = b.id.startsWith('github-') ? (eventLikes[b.id] || 0) : (b.likes || 0);
            if (likesB !== likesA) return likesB - likesA;
            
            return a.id.localeCompare(b.id);
          });
        });
        
        // Update RSVP in database
        const currentRsvp = {
          yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
          no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
          maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
        };
        
        const newRsvp = { 
          ...currentRsvp,
          yes: currentRsvp.yes + 1 
        };
        
        await updateEventRsvp(eventId, newRsvp);
        console.log(`Successfully updated RSVP in database for event ${eventId}`);
        
        // Update topEventsPerDay after successful database update
        setTopEventsPerDay(prev => {
          const updated = { ...prev };
          const eventDate = currentEvent.date;
          if (eventDate) {
            const eventsForDate = events.filter(e => e.date === eventDate);
            const sortedByLikes = eventsForDate.sort((a, b) => {
              const likesA = a.id === eventId ? newLikesValue : (a.id.startsWith('github-') ? (eventLikes[a.id] || 0) : (a.likes || 0));
              const likesB = b.id.startsWith('github-') ? (eventLikes[b.id] || 0) : (b.likes || 0);
              return likesB - likesA;
            });
            if (sortedByLikes.length > 0) {
              updated[eventDate] = sortedByLikes[0].id;
            }
          }
          return updated;
        });
        
      } catch (error) {
        console.error('Database update failed:', error);
        // Don't revert on error - the database is the source of truth
        // The next refresh will correct any inconsistencies
      } finally {
        setPendingLikes(prev => {
          const updated = new Set(prev);
          updated.delete(eventId);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      setPendingLikes(prev => {
        const updated = new Set(prev);
        updated.delete(eventId);
        return updated;
      });
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
      
      const currentLikes = currentEvent.id.startsWith('github-')
        ? (eventLikes[eventId] || 0)
        : (currentEvent.likes || 0);
        
      const newLikesValue = Math.max(currentLikes, newRsvp.yes + newRsvp.maybe);
      
      await updateEventLikes(eventId, newLikesValue);
      console.log(`Successfully updated likes in database for event ${eventId} to ${newLikesValue}`);
      
      if (currentEvent.id.startsWith('github-')) {
        setEventLikes(prev => ({
          ...prev,
          [eventId]: newLikesValue
        }));
      }
      
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
      console.log('Adding new user event to database only:', eventData);
      
      const newEvent = await addNewEvent(eventData);
      console.log('Successfully added new event to database:', newEvent);
      
      await refreshEvents();
      
      return newEvent;
    } catch (error) {
      console.error('Error adding new event:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('EventProvider: Loading events...');
    
    localStorage.removeItem('lastEventsRefresh');
    
    refreshEvents();
    
    window.refreshEventsContext = refreshEvents;
    
    const refreshInterval = setInterval(() => {
      console.log('Performing periodic event refresh');
      refreshEvents();
    }, 60000);
    
    return () => {
      clearInterval(refreshInterval);
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
    newEventIds,
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
