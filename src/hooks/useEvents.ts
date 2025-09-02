import { useState, useCallback, useEffect } from 'react';
import { Event, RsvpOption } from '../types/eventTypes';
import { USERNAME_KEY } from '../types/chatTypes';
import {
  fetchSupabaseEvents,
  updateEventRsvp,
  updateEventLikes,
  syncGitHubEvents,
  addNewEvent
} from '../services/eventService';

import { useUserProfile } from './chat/useUserProfile';

// Remove the import of useEventContext from here
// import { useEventContext } from '../contexts/EventContext';

// Accept selectedCity as a parameter
export const useEvents = (selectedCity: string) => {
  // const { selectedCity } = useEventContext(); // This line should be removed

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Ladezustand standardmäßig auf true
  const { userProfile } = useUserProfile();

  // This useEffect will now re-run when selectedCity changes
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      console.log('🔄 [useEvents] Today is:', today);
      try {
        console.log('🔄 [useEvents] Starte einmaligen Sync und Ladevorgang...');


        // alle Events aus der Datenbank laden, JETZT MIT CITY FILTER
        const allEvents = await fetchSupabaseEvents(selectedCity, today); // Pass selectedCity and currentDate

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
  }, [selectedCity]); // Re-run effect when selectedCity changes

  // Eine Funktion, um Events manuell aus der DB zu aktualisieren, ohne GitHub-Sync.
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [refreshEvents] Manuelles Neuladen der Events aus der DB...');
      const today = new Date().toISOString().split('T')[0];
      const allEvents = await fetchSupabaseEvents(selectedCity, today); // Pass selectedCity and currentDate
      setEvents(allEvents);
      console.log(`🔄 [refreshEvents] ${allEvents.length} Events geladen.`);
    } catch (error) {
      console.error('🔄 [refreshEvents] FEHLER:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity]);

  const handleLikeEvent = useCallback(async (eventId: string) => {
    console.log(`[handleLikeEvent] 💙 Community Like-Funktion wurde für Event-ID aufgerufen: ${eventId}`);

    if (!eventId || typeof eventId !== 'string') {
        console.error('[handleLikeEvent] 🛑 Ungültige oder fehlende eventId!', eventId);
        return;
    }

    try {
        const username = localStorage.getItem(USERNAME_KEY) || null;
        const avatarUrl = userProfile?.avatar || null;

        console.log('[handleLikeEvent] Using username:', username, 'avatar:', avatarUrl);

        // Get current event to determine action
        const currentEvents = await new Promise<Event[]>((resolve) => {
            setEvents(prevEvents => {
                resolve(prevEvents);
                return prevEvents;
            });
        });

        const eventToLike = currentEvents.find(e => e.id === eventId);
        if (!eventToLike) {
            console.error(`[handleLikeEvent] 💔 Event mit ID ${eventId} im State nicht gefunden.`);
            return;
        }

        const currentLikedBy = eventToLike.liked_by_users || [];
        const alreadyLiked = currentLikedBy.some((user: any) => user.username === username);
        const action = alreadyLiked ? 'unlike' : 'like';

        // Optimistic UI update
        let newLikes: number;
        let newLikedBy: any[];

        if (action === 'unlike') {
            newLikes = Math.max(0, (eventToLike.likes || 0) - 1);
            newLikedBy = currentLikedBy.filter((user: any) => user.username !== username);
        } else {
            newLikes = (eventToLike.likes || 0) + 1;
            newLikedBy = [
                ...currentLikedBy,
                {
                    username: username || 'Anonymous',
                    avatar_url: avatarUrl,
                    timestamp: new Date().toISOString()
                }
            ];
        }

        // Update UI immediately
        setEvents(prevEvents => 
            prevEvents.map(event =>
                event.id === eventId ? {
                    ...event,
                    likes: newLikes,
                    liked_by_users: newLikedBy
                } : event
            )
        );

        // Try to update database
        try {
            await updateEventLikes(eventId, action, { username, avatar_url: avatarUrl });
            console.log(`[handleLikeEvent] ✅ Successfully ${action}d event in database`);
        } catch (dbError) {
            console.error(`[handleLikeEvent] ❌ Database ${action} failed:`, dbError);
            
            // Revert optimistic update on database failure
            setEvents(prevEvents => 
                prevEvents.map(event =>
                    event.id === eventId ? {
                        ...event,
                        likes: eventToLike.likes,
                        liked_by_users: eventToLike.liked_by_users
                    } : event
                )
            );
            
            // Refresh from database to ensure consistency
            await refreshEvents();
        }

    } catch (error) {
        console.error('[handleLikeEvent] 💥 Unerwarteter Fehler:', error);
        // Refresh events to get correct state
        refreshEvents();
    }
  }, [refreshEvents, userProfile]);

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