// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchSupabaseEvents, updateEventLikes, addNewEvent, syncGitHubEvents, generateCityEvents } from '../services/eventService';
import { Event } from '../types/eventTypes';
import { useEventContext } from '@/contexts/EventContext'; // Import useEventContext
import { format } from 'date-fns'; // Import format for date handling

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCity } = useEventContext(); // Get selectedCity from context

  // Memoized function to refresh events
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd'); // Get today's date in YYYY-MM-DD format
    console.log('🔄 [useEvents] Refreshing events...');
    try {
      // Pass selectedCity and today's date to fetchSupabaseEvents
      const fetchedEvents = await fetchSupabaseEvents(selectedCity, today); 
      setEvents(fetchedEvents);
      console.log(`🔄 [useEvents] Events refreshed. ${fetchedEvents.length} events loaded.`);
    } catch (error) {
      console.error('🔄 [useEvents] FEHLER beim Aktualisieren der Events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity]); // Re-run refreshEvents when selectedCity changes

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd'); // Get today's date in YYYY-MM-DD format
      console.log('🔄 [useEvents] Today is:', today);
      try {
        console.log('🔄 [useEvents] Starte einmaligen Sync und Ladevorgang...');
        // 1. Zuerst die Events von GitHub synchronisieren.
        await syncGitHubEvents(); // Uncommented: This was identified as a previous issue

        // 2. Danach alle Events aus der Datenbank laden.
        // Pass selectedCity and today's date to fetchSupabaseEvents during initial load
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
  }, [selectedCity]); // Add selectedCity to dependency array to trigger re-fetch on city change

  const handleLikeEvent = useCallback(async (eventId: string) => {
    // Dummy user data for now
    const dummyUserData = { username: 'testuser', avatar_url: null }; 
    await updateEventLikes(eventId, 'like', dummyUserData);
    refreshEvents(); // Refresh events to show updated likes
  }, [refreshEvents]);

  const addUserEvent = useCallback(async (newEvent: Omit<Event, 'id'>) => {
    const addedEvent = await addNewEvent(newEvent);
    if (addedEvent) {
      refreshEvents(); // Refresh events to include the new one
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
    addUserEvent,
    addCityEvents
  };
};