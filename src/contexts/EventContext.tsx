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
  addUserEvent: (event: Omit<Event, 'id'>) => Promise<void>;
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
      
      const githubLikes = await fetchGitHubLikes();
      console.log('Fetched GitHub likes:', githubLikes);
      
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
      
      const supabaseEvents = await fetchSupabaseEvents();
      console.log(`Loaded ${supabaseEvents.length} events from Supabase`);
      
      const externalEvents = await fetchExternalEvents(likesMap);
      console.log(`Loaded ${externalEvents.length} external events`);
      
      await syncGitHubEvents(externalEvents);
      
      const combinedEvents = [...supabaseEvents];
      
      const newEvents: Event[] = [];
      const currentEventIds: string[] = [];
      
      [...supabaseEvents, ...externalEvents].forEach(event => {
        currentEventIds.push(event.id);
      });
      
      const newEventIdsSet = new Set<string>();
      
      externalEvents.forEach(extEvent => {
        if (!combinedEvents.some(event => event.id === extEvent.id)) {
          combinedEvents.push({
            ...extEvent,
            likes: typeof likesMap[extEvent.id] === 'number' ? likesMap[extEvent.id] : 0,
            rsvp_yes: githubLikes[extEvent.id]?.rsvp_yes || 0,
            rsvp_no: githubLikes[extEvent.id]?.rsvp_no || 0,
            rsvp_maybe: githubLikes[extEvent.id]?.rsvp_maybe || 0
          });
          
          if (!previouslySeenSet.has(extEvent.id)) {
            newEvents.push(extEvent);
            newEventIdsSet.add(extEvent.id);
          }
        }
      });
      
      const jamesLegEvent = combinedEvents.find(e => e.title.includes("James Leg"));
      if (jamesLegEvent) {
        console.log("Found James Leg event in combined events:", jamesLegEvent);
      } else {
        console.log("James Leg event NOT found in combined events");
        
        const inSupabase = supabaseEvents.find(e => e.title.includes("James Leg"));
        const inExternal = externalEvents.find(e => e.title.includes("James Leg"));
        
        console.log("James Leg in Supabase:", inSupabase ? "YES" : "NO");
        console.log("James Leg in External:", inExternal ? "YES" : "NO");
      }
      
      console.log(`Combined ${combinedEvents.length} total events`);
      console.log(`Found ${newEvents.length} new events since last refresh`);
      
      setNewEventIds(newEventIdsSet);
      
      localStorage.setItem('seenEventIds', JSON.stringify(currentEventIds));
      
      if (combinedEvents.length === 0) {
        console.log('No events found, using example data');
        setEvents(bielefeldEvents);
      } else {
        const eventsWithSyncedRsvp = combinedEvents.map(event => {
          if (event.id.startsWith('github-') && githubLikes[event.id]) {
            const totalRsvp = (githubLikes[event.id]?.rsvp_yes || 0) + 
                            (githubLikes[event.id]?.rsvp_maybe || 0);
            
            const syncedLikes = Math.max(totalRsvp, githubLikes[event.id]?.likes || 0);
            
            return {
              ...event,
              likes: syncedLikes,
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
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todaysEvents = eventsWithSyncedRsvp.filter(event => event.date === todayStr);
        console.log('===== TODAY\'S EVENTS =====');
        console.log(`Found ${todaysEvents.length} events for today (${todayStr}):`);
        todaysEvents.forEach(event => {
          console.log(`- ${event.title} (ID: ${event.id})`);
          console.log(`  Category: ${event.category}, Likes: ${event.likes || 0}`);
          console.log(`  RSVP: yes=${event.rsvp?.yes || event.rsvp_yes || 0}, no=${event.rsvp?.no || event.rsvp_no || 0}, maybe=${event.rsvp?.maybe || event.rsvp_maybe || 0}`);
        });
        console.log('=========================');
        
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
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            
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
        
        const githubEventsInCombined = eventsWithSyncedRsvp.filter(e => e.id.startsWith('github-'));
        console.log(`GitHub events with likes: ${githubEventsInCombined.map(e => `${e.id}: ${e.likes} - RSVP: yes=${e.rsvp_yes || e.rsvp?.yes || 0}, no=${e.rsvp_no || e.rsvp?.no || 0}, maybe=${e.rsvp_maybe || e.rsvp?.maybe || 0}`).join(', ')}`);
        
        setEvents(eventsWithSyncedRsvp);
        
        setLastRefreshed(new Date());
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
      
      console.log(`Liking event with ID: ${eventId}`);
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) {
        console.error(`Event with ID ${eventId} not found`);
        return;
      }
      
      setPendingLikes(prev => new Set(prev).add(eventId));
      
      const currentLikes = currentEvent.likes || 0;
      const newLikesValue = currentLikes + 1;
      
      setEvents(prevEvents => {
        return prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                likes: newLikesValue,
                rsvp_yes: (event.rsvp_yes || 0) + 1,
                rsvp: {
                  ...(event.rsvp || {}),
                  yes: ((event.rsvp?.yes || 0) + 1),
                  no: (event.rsvp?.no || 0),
                  maybe: (event.rsvp?.maybe || 0)
                }
              } 
            : event
        );
      });
      
      setEventLikes(prev => {
        const updatedLikes = {
          ...prev,
          [eventId]: newLikesValue
        };
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      const currentRsvp = {
        yes: currentEvent.rsvp_yes ?? currentEvent.rsvp?.yes ?? 0,
        no: currentEvent.rsvp_no ?? currentEvent.rsvp?.no ?? 0,
        maybe: currentEvent.rsvp_maybe ?? currentEvent.rsvp?.maybe ?? 0
      };
      
      const newRsvp = { 
        ...currentRsvp,
        yes: currentRsvp.yes + 1 
      };
      
      Promise.all([
        updateEventLikes(eventId, newLikesValue),
        updateEventRsvp(eventId, newRsvp)
      ]).finally(() => {
        setPendingLikes(prev => {
          const updated = new Set(prev);
          updated.delete(eventId);
          return updated;
        });
      });
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
      
      const currentLikes = currentEvent.likes || 0;
      const newLikesValue = Math.max(currentLikes, newRsvp.yes + newRsvp.maybe);
      
      console.log(`Synchronizing likes with RSVP: ${eventId} -> ${newLikesValue}`);
      
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
      
      await Promise.all([
        updateEventRsvp(eventId, newRsvp),
        updateEventLikes(eventId, newLikesValue)
      ]);
      
      console.log(`Successfully updated RSVP and likes in database for event ${eventId}`);
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const addUserEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      console.log('Adding new user event:', eventData);
      
      const newEvent = await addNewEvent(eventData);
      
      setEvents(prev => [...prev, newEvent]);
      
      setNewEventIds(prev => {
        const updated = new Set(prev);
        updated.add(newEvent.id);
        return updated;
      });
      
      console.log('Successfully added new event:', newEvent);
      return newEvent;
    } catch (error) {
      console.error('Error adding new event:', error);
      throw error;
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
