import { useState, useCallback, useEffect } from 'react';
import { Event, RsvpOption } from '../types/eventTypes';
import { 
  fetchSupabaseEvents, 
  updateEventRsvp,
  updateEventLikes,
  syncGitHubEvents,
  addNewEvent
} from '../services/eventService';
import { updateEventLikesInDb } from '../services/singleEventService';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Ladezustand standardmäßig auf true

  // Dieser useEffect wird nur einmal beim Start der App ausgeführt.
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 [useEvents] Starte einmaligen Sync und Ladevorgang...');
        // 1. Zuerst die Events von GitHub synchronisieren.
        //await syncGitHubEvents();
        
        // 2. Danach alle Events aus der Datenbank laden.
        const allEvents = await fetchSupabaseEvents();
        
        console.log(`🔄 [useEvents] Einmaliger Ladevorgang abgeschlossen. ${allEvents.length} Events geladen.`);
        console.log('🔄 [useEvents] First 3 events:', allEvents.slice(0, 3));
        console.log('🔄 [useEvents] Events for today (2025-07-10):', allEvents.filter(e => e.date === '2025-07-10'));
        setEvents(allEvents);
        
      } catch (error) {
        console.error('🔄 [useEvents] FEHLER beim initialen Laden:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialLoad();
  }, []); // Das leere Array [] stellt sicher, dass dies nur einmal passiert.

  // Eine Funktion, um Events manuell aus der DB zu aktualisieren, ohne GitHub-Sync.
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [refreshEvents] Manuelles Neuladen der Events aus der DB...');
      const allEvents = await fetchSupabaseEvents();
      setEvents(allEvents);
      console.log(`🔄 [refreshEvents] ${allEvents.length} Events geladen.`);
    } catch (error) {
      console.error('🔄 [refreshEvents] FEHLER:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLikeEvent = useCallback(async (eventId: string) => {
    console.log(`[handleLikeEvent] 💙 Community Like-Funktion wurde für Event-ID aufgerufen: ${eventId}`);

    if (!eventId || typeof eventId !== 'string') {
        console.error('[handleLikeEvent] 🛑 Ungültige oder fehlende eventId!', eventId);
        return;
    }
    
    try {
        const username = localStorage.getItem('selectedUsername') || null;
        const avatarUrl = null; // TODO: Get from user profile when available
        
        console.log('[handleLikeEvent] Using username:', username);
        
        // Use setEvents with functional update to access current state
        setEvents(prevEvents => {
            const eventToLike = prevEvents.find(e => e.id === eventId);
            if (!eventToLike) {
                console.error(`[handleLikeEvent] 💔 Event mit ID ${eventId} im State nicht gefunden.`);
                return prevEvents;
            }

            // Check if user already liked this event (check in liked_by_users)
            const currentLikedBy = eventToLike.liked_by_users || [];
            const alreadyLiked = currentLikedBy.some((user: any) => 
                user.username === username
            );
            
            if (alreadyLiked) {
                // Unlike the event
                console.log(`[handleLikeEvent] 👎 Removing like for event ${eventId}`);
                
                const oldLikes = eventToLike.likes || 0;
                const newLikes = Math.max(0, oldLikes - 1);
                const newLikedBy = currentLikedBy.filter((user: any) => 
                    user.username !== username
                );
                
                // Update in database (don't await to avoid blocking UI)
                updateEventLikes(eventId, 'unlike', { username, avatar_url: avatarUrl });
                
                return prevEvents.map(event =>
                    event.id === eventId ? { 
                        ...event, 
                        likes: newLikes,
                        liked_by_users: newLikedBy
                    } : event
                );
                
            } else {
                // Like the event
                console.log(`[handleLikeEvent] 👍 Adding like for event ${eventId}`);
                
                const oldLikes = eventToLike.likes || 0;
                const newLikes = oldLikes + 1;
                const newLikedBy = [
                    ...currentLikedBy,
                    {
                        username: username || 'Anonymous',
                        avatar_url: avatarUrl,
                        timestamp: new Date().toISOString()
                    }
                ];
                
                // Update in database (don't await to avoid blocking UI)
                updateEventLikes(eventId, 'like', { username, avatar_url: avatarUrl });
                
                return prevEvents.map(event =>
                    event.id === eventId ? { 
                        ...event, 
                        likes: newLikes,
                        liked_by_users: newLikedBy
                    } : event
                );
            }
        });
        
        console.log('[handleLikeEvent] ✅ Successfully updated like!');
    } catch (error) {
        console.error('[handleLikeEvent] 💥 Unerwarteter Fehler:', error);
        // Refresh events to get correct state
        refreshEvents();
    }
  }, [refreshEvents]);

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
  }, [events]);

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

  return {
    events,
    setEvents,
    isLoading,
    refreshEvents,
    handleLikeEvent,
    handleRsvpEvent,
    addUserEvent,
  };
};
