// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchSupabaseEvents, updateEventLikes, addNewEvent, syncGitHubEvents, generateCityEvents, updateEventRsvp } from '../services/eventService'; // Import updateEventRsvp
import { Event } from '../types/eventTypes';
import { useEventContext } from '@/contexts/EventContext';
import { format } from 'date-fns';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCity } = useEventContext();

  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('🔄 [useEvents] Refreshing events...');
    try {
      const fetchedEvents = await fetchSupabaseEvents(selectedCity, today);
      setEvents(fetchedEvents);
      console.log(`🔄 [useEvents] Events refreshed. ${fetchedEvents.length} events loaded.`);
    } catch (error) {
      console.error('🔄 [useEvents] FEHLER beim Aktualisieren der Events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('🔄 [useEvents] Today is:', today);
      try {
        console.log('🔄 [useEvents] Starte einmaligen Sync und Ladevorgang...');
        await syncGitHubEvents();

        const allEvents = await fetchSupabaseEvents(selectedCity, today);
        
        console.log(`🔄 [useEvents] Einmaliger Ladevorgang abgeschlossen. ${allEvents.length} Events geladen.`);
        console.log('🔄 [useEvents] First 3 events:', allEvents.slice(0, 3));
        console.log('🔄 [useEvents] Events for today (filtered by DB):', allEvents.filter(e => e.date === today));
        setEvents(allEvents);
        
      } catch (error) {
        console.error('🔄 [useEvents] FEHLER beim initialen Laden:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialLoad();
  }, [selectedCity]);

  const handleLikeEvent = useCallback(async (eventId: string) => {
    const dummyUserData = { username: 'testuser', avatar_url: null }; 
    await updateEventLikes(eventId, 'like', dummyUserData);
    refreshEvents();
  }, [refreshEvents]);

  // Add handleRsvpEvent to useEvents hook
  const handleRsvpEvent = useCallback(async (eventId: string, rsvpType: 'yes' | 'no' | 'maybe') => {
    try {
      // Logic to get current RSVP counts for the event from `events` state
      const currentEvent = events.find(e => e.id === eventId);
      if (!currentEvent) {
        console.error('Event not found for RSVP:', eventId);
        return;
      }

      let newRsvpCounts = {
        yes: currentEvent.rsvp_yes || 0,
        no: currentEvent.rsvp_no || 0,
        maybe: currentEvent.rsvp_maybe || 0,
      };

      // Adjust counts based on rsvpType (simplified, a full implementation would track individual users)
      if (rsvpType === 'yes') newRsvpCounts.yes += 1;
      else if (rsvpType === 'no') newRsvpCounts.no += 1;
      else if (rsvpType === 'maybe') newRsvpCounts.maybe += 1;

      await updateEventRsvp(eventId, newRsvpCounts);
      refreshEvents(); // Refresh events to show updated RSVP counts
      console.log(`RSVP for event ${eventId} updated to:`, rsvpType);
    } catch (error) {
      console.error('Error handling RSVP:', error);
    }
  }, [events, refreshEvents]);


  const addUserEvent = useCallback(async (newEvent: Omit<Event, 'id'>) => {
    const addedEvent = await addNewEvent(newEvent);
    if (addedEvent) {
      refreshEvents();
    }
    return addedEvent;
  }, [refreshEvents]);

  const addCityEvents = useCallback(async (city: string) => {
    await generateCityEvents(city);
    refreshEvents();
  }, [refreshEvents]);

  return {
    events,
    isLoading,
    refreshEvents,
    handleLikeEvent,
    handleRsvpEvent, // Expose handleRsvpEvent
    addUserEvent,
    addCityEvents
  };
};