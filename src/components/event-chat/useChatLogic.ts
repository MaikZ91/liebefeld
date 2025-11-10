// src/components/event-chat/useChatLogic.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, CHAT_HISTORY_KEY, CHAT_QUERIES_KEY, PanelEventData, PanelEvent, AdEvent } from './types';
import { supabase } from '@/integrations/supabase/client';
import { generateResponse, getWelcomeMessage, createResponseHeader, createLandingSlideData } from '@/utils/chatUtils';
import { toast } from 'sonner';
import { Event } from '@/types/eventTypes';
import { getFutureEvents, getEventsForDay, getWeekRange } from '@/utils/eventUtils';
import { fetchWeather } from '@/utils/weatherUtils';
import { useEventNotifications } from '@/hooks/useEventNotifications';
import { createEventNotificationMessage, getNewEventsFromIds } from '@/utils/eventNotificationUtils';
import { useEventContext } from '@/contexts/EventContext';
import { useDailyPerfectDay } from '@/hooks/useDailyPerfectDay';
import { createCitySpecificGroupId } from '@/utils/groupIdUtils';

// Define a key for localStorage to track if the app has been launched before
const APP_LAUNCHED_KEY = 'app_launched_before';
const USER_SENT_FIRST_MESSAGE_KEY = 'user_sent_first_message'; 

export const useChatLogic = (
  fullPage: boolean = false,
  activeChatModeValue: 'ai' | 'community' = 'ai',
  onDateFilterChange?: (date: Date) => void,
  onCategoryFilterChange?: (category: string) => void,
  onAiResponseReceived?: (response: string, suggestions?: string[]) => void
) => {
  // Get events and selectedCity from EventContext instead of props
  const { events, selectedCity } = useEventContext();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); // This will indicate AI processing/typing
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false);
  const [currentContextEvent, setCurrentContextEvent] = useState<any>(null);
  const [pendingMeetup, setPendingMeetup] = useState<{
    eventId: string;
    eventTitle: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const welcomeMessageShownRef = useRef(false);
  const appLaunchedBeforeRef = useRef(false);
  const isSendingRef = useRef(false);
  // Removed typingTimeoutRef as it's not needed for AI typing simulation during user input
  

  // Promptvorschlag-Liste für den Schreibmaschinen-Effekt (erweitert)
  const examplePrompts = [
    "Welche Events gibt es heute?",
    "Was geht am Wochenende in Liebefeld?",
    "Zeig mir Events für Familien.",
    "Welche Konzerte laufen diese Woche?",
    "Gibt es kostenlose Events?",
    "Meine Tipps für einen perfekten Tag in Liebefeld.",
    "Zeig mir nachhaltige Events.",
    "Was läuft gerade in der Nähe?",
    "Empfiehl mir etwas Neues!",
    "Welche kulturellen Highlights gibt es?",
    "Gibt es Workshops oder Kurse demnächst?",
    "Welche Outdoor-Aktivitäten finden statt?",
    "Was ist heute für Kinder und Jugendliche los?",
    "Finde ein Afterwork-Event!",
    "Zeig mir Kunst- und Ausstellungs-Highlights."
  ];

  const shuffledExamplePrompts = useMemo(() => {
    const first = examplePrompts[0];
    const rest = examplePrompts.slice(1);
    const arr = [...rest];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return first ? [first, ...arr] : arr;
  }, []);


  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Creative Circle',
      date: 'Immer am letzten Freitag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/83f7c05b-0e56-4f3c-a19c-adeab5429b59.jpg',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Hör dir die Tribe Playlist an!',
      date: 'Jederzeit',
      location: 'Spotify',
      imageUrl: '/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png',
      link: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      type: "music"
    },
    {
      title: 'Ihre Anzeige hier! Erreichen Sie Ihr Zielpublikum.',
      date: 'Maßgeschneiderte Lösungen',
      location: 'Kontaktieren Sie uns jetzt!',
      imageUrl: '/lovable-uploads/placeholder-ad.png',
      link: "mailto:mschach@googlemail.com",
      type: "sponsored-ad"
    }
  ];

  // Helper function to filter events by selected city
  const filterEventsByCity = useCallback((eventsToFilter: Event[]) => {
    if (!selectedCity) return eventsToFilter;
    
    // Special handling for Bielefeld - include events without city specified
    if (selectedCity.toLowerCase() === 'bi' || selectedCity.toLowerCase() === 'bielefeld') {
      return eventsToFilter.filter(event => 
        !event.city || 
        event.city.toLowerCase() === 'bielefeld' || 
        event.city.toLowerCase() === 'bi'
      );
    }
    
    // For other cities, filter by exact match
    return eventsToFilter.filter(event => 
      event.city && event.city.toLowerCase() === selectedCity.toLowerCase()
    );
  }, [selectedCity]);

  // Handle new event notifications - removed for now since newEventIds was removed
  const handleNewEventNotification = useCallback((eventCount: number) => {
    console.log('Event notifications temporarily disabled');
  }, []);

  // Setup event notifications (disabled for now)
  // useEventNotifications({
  //   onNewEvents: handleNewEventNotification,
  //   isEnabled: false,
  //   activeChatMode: activeChatModeValue
  // });

  // Handle daily Perfect Day messages
  const handleDailyPerfectDayMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Setup daily Perfect Day messages
  useDailyPerfectDay({
    onDailyMessage: handleDailyPerfectDayMessage,
    activeChatMode: activeChatModeValue
  });

  const createPanelData = (filteredEvents: Event[]): PanelEventData => {
    // Filter events by selected city before creating panel data
    const cityFilteredEvents = filterEventsByCity(filteredEvents);
    
    const allItems: (PanelEvent | AdEvent)[] = [];

    cityFilteredEvents.slice(0, 5).forEach(event => {
      allItems.push({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        price: event.is_paid ? "Kostenpflichtig" : "Kostenlos",
        location: event.location,
        image_url: event.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        category: event.category,
        link: event.link,
        likes: event.likes || 0
      });
    });

    if (adEvents.length > 0) {
      const randomAd = adEvents[Math.floor(Math.random() * adEvents.length)];
      
      const insertIndex = allItems.length >= 2 ? Math.floor(Math.random() * (allItems.length - 2 + 1)) + 2 : allItems.length;
      
      allItems.splice(insertIndex, 0, randomAd);
      console.log('Adding random ad to panel at index', insertIndex, ':', randomAd.title);
    }

    return {
      events: allItems,
      currentIndex: 0
    };
  };

  const handleToggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
    if (!isChatOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  }, [isChatOpen]);

  // Funktion zum Abrufen globaler Abfragen von Supabase
  const fetchGlobalQueries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_queries')
        .select('query')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        console.error('[useChatLogic] Error fetching global queries:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const queries = data.map(item => item.query);
        setGlobalQueries(queries);
      }
    } catch (error) {
      console.error('[useChatLogic] Exception fetching global queries:', error);
    }
  }, []);

  // Funktion zum Speichern einer Abfrage in Supabase
  const saveGlobalQuery = useCallback(async (query: string) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from('chat_queries')
        .select('id')
        .eq('query', query)
        .limit(1);
        
      if (checkError) {
        console.error('[useChatLogic] Error checking for existing query:', checkError);
        return;
      }
      
      if (existingData && existingData.length > 0) {
        await supabase
          .from('chat_queries')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existingData[0].id);
      } else {
        const { error: insertError } = await supabase
          .from('chat_queries')
          .insert({ query: query });
          
        if (insertError) {
          console.error('[useChatLogic] Error saving global query:', insertError);
        }
      }
      
      fetchGlobalQueries();
    } catch (error) {
      console.error('[useChatLogic] Exception saving global query:', error);
    }
  }, [fetchGlobalQueries]);

  const updateRecentQueries = useCallback((query: string) => {
    setRecentQueries(prev => {
      const filteredQueries = prev.filter(q => q !== query);
      const newQueries = [query, ...filteredQueries].slice(0, 3);
      return newQueries;
    });
    
    saveGlobalQuery(query);
  }, [saveGlobalQuery]);

  const handleAttendEvent = useCallback(async (eventId: string) => {
    console.log('[useChatLogic] User attending event:', eventId);
    const username = localStorage.getItem('community_chat_username') || 'Gast';
    
    setIsTyping(true);

    try {
      // Load event from DB
      const { data: event, error: eventError } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (eventError || !event) {
        console.error('[useChatLogic] Error loading event:', eventError);
        throw new Error('Event nicht gefunden');
      }

      // Add user to liked_by_users - ensure we're working with an array
      const likedByUsers = Array.isArray(event.liked_by_users) 
        ? event.liked_by_users 
        : [];
      
      const currentUserLike = {
        username,
        avatar_url: localStorage.getItem('community_chat_avatar') || null,
        timestamp: new Date().toISOString()
      };

      // Check if user already liked
      const alreadyLiked = likedByUsers.some((like: any) => like.username === username);

      if (!alreadyLiked) {
        const updatedLikedBy = [...likedByUsers, currentUserLike];
        
        // Update event in DB
        const { error: updateError } = await supabase
          .from('community_events')
          .update({
            likes: (event.likes || 0) + 1,
            liked_by_users: updatedLikedBy
          })
          .eq('id', eventId);

        if (updateError) {
          console.error('[useChatLogic] Error updating event:', updateError);
          throw new Error('Fehler beim Speichern');
        }
      }

      // Reload event to get updated data
      const { data: updatedEvent } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .single();

      const attendees = Array.isArray(updatedEvent?.liked_by_users) 
        ? updatedEvent.liked_by_users 
        : [];
      const attendeeCount = attendees.length;

      // Generate MIA response
      const responseHtml = `
        <div class="space-y-3">
          <p class="text-white/90 text-base">
            Schön, dass du dabei bist! 🎉
          </p>
          ${attendeeCount > 1 ? `
            <div class="bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/20 rounded-lg p-3">
              <p class="text-white/80 text-sm mb-2">
                <strong>${attendeeCount} ${attendeeCount === 1 ? 'Person ist' : 'Personen sind'}</strong> auch dabei:
              </p>
              <div class="flex flex-wrap gap-1.5">
                ${attendees.map((a: any) => `
                  <span class="bg-red-500/20 text-white text-xs px-2 py-1 rounded-full border border-red-500/30">
                    ${a.username}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : `
            <p class="text-white/70 text-sm">
              Du bist die erste Person, die sich für dieses Event interessiert! 💫
            </p>
          `}
          <p class="text-white/80 text-sm mt-3">
            Soll ich ein Treffen in der Community vorschlagen?
          </p>
        </div>
      `;

      const suggestions = ['Treffen vorschlagen', 'Weitere Events anzeigen', 'Event teilen'];

      const aiMessage: ChatMessage = {
        id: `ai-attend-${Date.now()}`,
        isUser: false,
        text: '',
        html: responseHtml,
        suggestions,
        timestamp: new Date().toISOString(),
        metadata: { eventId, eventTitle: event.title }
      };

      setMessages(prev => [...prev, aiMessage]);

      if (onAiResponseReceived) {
        onAiResponseReceived(responseHtml, suggestions);
      }

      toast.success(`Du bist jetzt bei "${event.title}" dabei!`);

    } catch (error) {
      console.error('[useChatLogic] Error in handleAttendEvent:', error);
      toast.error('Fehler beim Beitreten zum Event');
    } finally {
      setIsTyping(false);
    }
  }, [onAiResponseReceived]);

  const handleProposeMeetup = useCallback(async (eventId: string, eventTitle: string) => {
    console.log('[DEBUG] handleProposeMeetup called with:', eventId, eventTitle);
    
    // Set state to track pending meetup
    setPendingMeetup({ eventId, eventTitle });
    console.log('[DEBUG] pendingMeetup state set');
    
    // Ask for meetup details
    const promptHtml = `
      <div class="space-y-3">
        <p class="text-white/90 text-base">
          Super! Lass uns ein Treffen organisieren. 📅
        </p>
        <p class="text-white/80 text-sm">
          Beantworte bitte folgende Fragen:
        </p>
        <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3 space-y-2 text-sm">
          <div>1️⃣ Wann sollen wir uns treffen?</div>
          <div>2️⃣ Wo ist der Treffpunkt?</div>
          <div>3️⃣ Gibt es weitere Hinweise?</div>
        </div>
        <p class="text-white/70 text-xs mt-2">
          Schreibe mir einfach die Details und ich poste sie im Community-Chat!
        </p>
      </div>
    `;

    const aiMessage: ChatMessage = {
      id: `ai-meetup-prompt-${Date.now()}`,
      isUser: false,
      text: '',
      html: promptHtml,
      timestamp: new Date().toISOString(),
      metadata: { awaitingMeetupDetails: true, eventId, eventTitle }
    };

    setMessages(prev => [...prev, aiMessage]);

    if (onAiResponseReceived) {
      onAiResponseReceived(promptHtml, []);
    }
  }, [onAiResponseReceived]);

  const handleSendMessage = async (customInput?: string) => {
    const message = customInput || input;
    if (!message.trim()) return;
    
    // Prevent multiple simultaneous sends
    if (isSendingRef.current) {
      console.log('[useChatLogic] Already sending a message, ignoring duplicate call');
      return;
    }
    isSendingRef.current = true;

    // Check if user clicked "Treffen vorschlagen"
    if (message === 'Treffen vorschlagen') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.metadata?.eventId) {
        handleProposeMeetup(lastMessage.metadata.eventId, lastMessage.metadata.eventTitle);
        setInput('');
        isSendingRef.current = false;
        return;
      }
    }

    // Check if user clicked "Ich bin dabei"
    if (message === '🎉 Ich bin dabei' || message === 'Ich bin dabei') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.metadata?.eventId) {
        handleAttendEvent(lastMessage.metadata.eventId);
        setInput('');
        isSendingRef.current = false;
        return;
      }
    }

    // Check if we have a pending meetup (state-based, no marker search needed)
    console.log('[DEBUG] handleSendMessage - pendingMeetup:', pendingMeetup);
    if (pendingMeetup) {
      console.log('[DEBUG] Processing meetup with:', pendingMeetup);
      const username = localStorage.getItem('community_chat_username') || 'Gast';
      const { eventId, eventTitle } = pendingMeetup;
      
      // Add user message to show in chat
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        isUser: true,
        text: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Determine the correct community group ID based on selected city
      const cityAbbr = selectedCity || 'BI';
      const communityGroupId = createCitySpecificGroupId('ausgehen', cityAbbr);
      
      console.log('[useChatLogic] Posting meetup to group:', communityGroupId);
      
      // Prepare meetup text with category hashtag for visibility
      const meetupText = `#ausgehen 🎉 Meetup-Vorschlag für "${eventTitle}"!\n\n${username} schlägt vor:\n${message}\n\nWer ist dabei? Antwortet hier im Chat! 💬`;
      
      // Send meetup proposal to community chat
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            group_id: communityGroupId,
            sender: 'MIA',
            text: meetupText,
            avatar: '/lovable-uploads/c38064ee-a32f-4ecc-b148-f9c53c28d472.png',
            event_id: eventId,
            event_title: eventTitle
          });

        if (error) {
          console.error('[useChatLogic] Error posting meetup to community:', error);
          toast.error('Fehler beim Posten im Community-Chat');
        } else {
          toast.success('Meetup-Vorschlag wurde im Community-Chat gepostet!');
          
          const confirmHtml = `
            <div class="space-y-3">
              <p class="text-white/90 text-base">
                Perfekt! Dein Meetup-Vorschlag wurde im Community-Chat gepostet! 🎊
              </p>
              <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/20 rounded-lg p-3">
                <p class="text-white/80 text-sm">
                  Die Community kann jetzt auf deinen Vorschlag antworten. Schau im Chat nach! 💬
                </p>
              </div>
            </div>
          `;

          const aiMessage: ChatMessage = {
            id: `ai-meetup-confirm-${Date.now()}`,
            isUser: false,
            text: '',
            html: confirmHtml,
            suggestions: ['Zum Community-Chat', 'Weitere Events anzeigen'],
            timestamp: new Date().toISOString(),
          };

          setMessages(prev => [...prev, aiMessage]);

          if (onAiResponseReceived) {
            onAiResponseReceived(confirmHtml, aiMessage.suggestions || []);
          }
        }
      } catch (error) {
        console.error('[useChatLogic] Error posting meetup:', error);
        toast.error('Fehler beim Posten des Meetup-Vorschlags');
      }
      
      // Reset pending meetup state
      setPendingMeetup(null);
      setInput('');
      isSendingRef.current = false;
      return;
    }

    // Check für Event-Kontext-Fragen
    const lowerQuery = message.toLowerCase();
    if (currentContextEvent && (
      lowerQuery.includes('wann') || 
      lowerQuery.includes('was kostet') || 
      lowerQuery.includes('ähnliche') ||
      lowerQuery.includes('wie komme') ||
      lowerQuery.includes('wo ist')
    )) {
      const event = currentContextEvent;
      let contextResponse = '';

      if (lowerQuery.includes('wann')) {
        contextResponse = `Das Event **${event.title}** findet am **${event.date}** um **${event.time} Uhr** statt.`;
      } else if (lowerQuery.includes('was kostet')) {
        contextResponse = event.is_paid 
          ? `Das Event **${event.title}** ist kostenpflichtig. Details zum Preis findest du beim Veranstalter.`
          : `Das Event **${event.title}** ist kostenlos! 🎉`;
      } else if (lowerQuery.includes('ähnliche')) {
        // Trigger search for similar events - reset context and continue with normal flow
        setCurrentContextEvent(null);
        isSendingRef.current = false;
        await handleSendMessage(`Zeige mir ${event.category} Events`);
        return;
      } else if (lowerQuery.includes('wie komme') || lowerQuery.includes('wo ist')) {
        contextResponse = `Das Event findet statt in: **${event.location}**. Du kannst die Location auf der Karte anzeigen lassen.`;
      }

      if (contextResponse) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          isUser: true,
          text: message,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        
        const contextMessage: ChatMessage = {
          id: `ai-context-${Date.now()}`,
          isUser: false,
          text: '',
          html: `<div class="text-white/90">${contextResponse}</div>`,
          suggestions: ['Zeig mir ähnliche Events', 'Auf Karte zeigen', 'Mehr Details'],
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, contextMessage]);
        
        if (onAiResponseReceived) {
          onAiResponseReceived(contextMessage.html!, contextMessage.suggestions);
        }
        
        setInput('');
        isSendingRef.current = false;
        return;
      }
    }
    
    if (!hasUserSentFirstMessage) {
      setHasUserSentFirstMessage(true);
      localStorage.setItem(USER_SENT_FIRST_MESSAGE_KEY, 'true');
    }

    updateRecentQueries(message);
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      isUser: true,
      text: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Clear input immediately for smooth typing experience
    setIsTyping(true); // Set isTyping to true to show AI processing/typing indicator

    // Simulate AI processing/typing delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const lowercaseMessage = message.toLowerCase().trim();

    if (lowercaseMessage === "mein perfekter tag in liebefeld") {
      console.log('[useChatLogic] "Mein Perfekter Tag in Liebefeld" Anfrage erkannt.');
      try {
        const weather = await fetchWeather();
        const today = new Date().toISOString().split('T')[0];

        const { data: currentUserProfileData, error: profileError } = await supabase.from('user_profiles')
          .select('interests, favorite_locations')
          .eq('username', localStorage.getItem('community_chat_username'))
          .single();

        if (profileError) {
          console.error('[useChatLogic] Error fetching user profile:', profileError);
        }
          
        const interests = currentUserProfileData?.interests || [];
        const favorite_locations = currentUserProfileData?.favorite_locations || [];

        const { data, error } = await supabase.functions.invoke('generate-perfect-day', {
          body: {
            weather: weather,
            username: localStorage.getItem('community_chat_username'),
            interests: interests,
            favorite_locations: favorite_locations
          }
        });

        if (error) {
          console.error('[useChatLogic] Error calling generate-perfect-day edge function:', error);
          throw new Error(`Edge function error: ${error.message}`);
        }

        const botMessage: ChatMessage = {
          id: `bot-perfect-day-${Date.now()}`,
          isUser: false,
          text: 'Hier ist dein perfekter Tag in Liebefeld!',
          html: data.response || data.message || "Entschuldige, ich konnte deinen perfekten Tag nicht generieren.",
          timestamp: new Date().toISOString(),
          suggestions: ['Weitere Events heute', 'Was läuft am Wochenende?', 'Zeige mir Sport-Events']
        };
        setMessages(prev => [...prev, botMessage]);

      } catch (error) {
        console.error('[useChatLogic] Error generating perfect day:', error);
        
        const fallbackSuggestions = ['Was läuft heute?', 'Events am Wochenende', 'Zeige mir Sport-Events'];
        const errorHtml = `${createResponseHeader("Fehler")}
          <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
            Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
            Bitte versuche es später noch einmal.
          </div>`;
        
        // If callback provided, send error there too
        if (onAiResponseReceived) {
          onAiResponseReceived(errorHtml, fallbackSuggestions);
        } else {
          const errorMessage: ChatMessage = {
            id: `error-perfect-day-${Date.now()}`,
            isUser: false,
            text: 'Es tut mir leid, ich konnte deinen perfekten Tag nicht generieren.',
            html: errorHtml,
            timestamp: new Date().toISOString(),
            suggestions: fallbackSuggestions
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } finally {
        setIsTyping(false); // Stop typing after response
        isSendingRef.current = false; // Reset flag
      }
      return;
    }

    let relevantEvents: Event[] = [];
    const currentDate = new Date();

    if (lowercaseMessage.includes('heute') || lowercaseMessage.includes('today')) {
      relevantEvents = getEventsForDay(events, currentDate);
      // Update heatmap filter to today
      if (onDateFilterChange) {
        onDateFilterChange(currentDate);
      }
    } else if (lowercaseMessage.includes('morgen') || lowercaseMessage.includes('tomorrow')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      relevantEvents = getEventsForDay(events, tomorrow);
      // Update heatmap filter to tomorrow
      if (onDateFilterChange) {
        onDateFilterChange(tomorrow);
      }
    }
     else if (lowercaseMessage.includes('wochenende') || lowercaseMessage.includes('weekend')) {
      const [startOfWeek, endOfWeek] = getWeekRange(currentDate);
      let saturday = new Date(currentDate);
      let sunday = new Date(currentDate);

      saturday.setDate(currentDate.getDate() + (6 - currentDate.getDay() + 7) % 7);
      sunday.setDate(currentDate.getDate() + (0 - currentDate.getDay() + 7) % 7);

      if (saturday < currentDate) {
          saturday.setDate(saturday.getDate() + 7);
      }
      if (sunday < currentDate) {
          sunday.setDate(sunday.getDate() + 7);
      }
      
      relevantEvents = events.filter(e => 
        (new Date(e.date).toISOString().split('T')[0] === saturday.toISOString().split('T')[0]) ||
        (new Date(e.date).toISOString().split('T')[0] === sunday.toISOString().split('T')[0])
      );
      
      // Update heatmap filter to Saturday (weekend start)
      if (onDateFilterChange) {
        onDateFilterChange(saturday);
      }
    } else {
      // Check for specific weekdays
      const weekdayMap: { [key: string]: number } = {
        'montag': 1, 'mo': 1,
        'dienstag': 2, 'di': 2,
        'mittwoch': 3, 'mi': 3,
        'donnerstag': 4, 'do': 4,
        'freitag': 5, 'fr': 5,
        'samstag': 6, 'sa': 6,
        'sonntag': 0, 'so': 0
      };
      
      let targetWeekday: number | null = null;
      for (const [keyword, dayNumber] of Object.entries(weekdayMap)) {
        if (lowercaseMessage.includes(keyword)) {
          targetWeekday = dayNumber;
          break;
        }
      }
      
      if (targetWeekday !== null) {
        // Calculate next occurrence of this weekday
        const targetDate = new Date(currentDate);
        const currentDay = currentDate.getDay();
        let daysUntilTarget = targetWeekday - currentDay;
        
        // If the target day is today or already passed this week, go to next week
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }
        
        targetDate.setDate(currentDate.getDate() + daysUntilTarget);
        relevantEvents = getEventsForDay(events, targetDate);
        
        // Update heatmap filter to target weekday
        if (onDateFilterChange) {
          onDateFilterChange(targetDate);
        }
      } else {
        // Default: show all future events
        relevantEvents = getFutureEvents(events);
      }
    }
    
    const categoryMapping: { [key: string]: { displayName: string, filterGroup: string } } = {
      konzert: { displayName: "Konzert", filterGroup: "ausgehen" },
      party: { displayName: "Party", filterGroup: "ausgehen" },
      ausstellung: { displayName: "Ausstellung", filterGroup: "kreativität" },
      sport: { displayName: "Sport", filterGroup: "sport" },
      workshop: { displayName: "Workshop", filterGroup: "kreativität" },
      kultur: { displayName: "Kultur", filterGroup: "ausgehen" },
      film: { displayName: "Film", filterGroup: "ausgehen" },
      theater: { displayName: "Theater", filterGroup: "kreativität" },
      lesung: { displayName: "Lesung", filterGroup: "kreativität" }
    };

    let detectedCategory: string | null = null;
    let detectedFilterGroup: string | null = null;
    for (const [keyword, categoryData] of Object.entries(categoryMapping)) {
      if (lowercaseMessage.includes(keyword)) {
        detectedCategory = categoryData.displayName;
        detectedFilterGroup = categoryData.filterGroup;
        break;
      }
    }

    if (detectedCategory) {
      relevantEvents = relevantEvents.filter(event => event.category && event.category.toLowerCase() === detectedCategory.toLowerCase());
      
      // Update heatmap category filter
      if (onCategoryFilterChange && detectedFilterGroup) {
        onCategoryFilterChange(detectedFilterGroup);
      }
    }
    
    const panelMessage: ChatMessage = {
      id: `panel-${Date.now()}`,
      isUser: false,
      text: 'Hier sind einige Events für dich:',
      panelData: createPanelData(relevantEvents),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, panelMessage]);
    
    // Generate contextual follow-up suggestions
    const generateSuggestions = (query: string, hasEvents: boolean): string[] => {
      console.log('[useChatLogic] Generating suggestions for query:', query, 'hasEvents:', hasEvents);
      const suggestions: string[] = [];
      const lower = query.toLowerCase();
      
      if (hasEvents) {
        // Event-specific suggestions
        if (lower.includes('heute') || lower.includes('morgen') || lower.includes('wochenende')) {
          suggestions.push('Weitere Events diese Woche');
        } else {
          suggestions.push('Was läuft heute?');
        }
        
        suggestions.push('Zeige mir auf der Karte');
        
        if (lower.includes('konzert') || lower.includes('party') || lower.includes('ausgehen')) {
          suggestions.push('Weitere Ausgeh-Events');
        } else if (lower.includes('sport') || lower.includes('fitness')) {
          suggestions.push('Mehr Sport-Events');
        } else if (lower.includes('kunst') || lower.includes('kultur') || lower.includes('kreativ')) {
          suggestions.push('Weitere Kreativ-Events');
        } else {
          suggestions.push('Kostenlose Events');
        }
      } else {
        // General suggestions when no specific events shown
        suggestions.push('Was läuft heute?');
        suggestions.push('Events am Wochenende');
        suggestions.push('Mein perfekter Tag');
      }
      
      const result = suggestions.slice(0, 4);
      console.log('[useChatLogic] Generated suggestions:', result);
      return result;
    };

    try {
      const responseHtml = await generateResponse(message, events, isHeartActive);
      const suggestions = generateSuggestions(message, relevantEvents.length > 0);
      
      // If callback provided, use it instead of adding to chat
      if (onAiResponseReceived) {
        onAiResponseReceived(responseHtml, suggestions);
      } else {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          isUser: false,
          text: 'Hier sind weitere Details zu den Events.',
          html: responseHtml,
          timestamp: new Date().toISOString(),
          suggestions: suggestions
        };
        
        console.log('[useChatLogic] Created bot message with suggestions:', botMessage.suggestions);
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('[useChatLogic] Error generating response:', error);
      
      // Create fallback suggestions
      const fallbackSuggestions = ['Was läuft heute?', 'Events am Wochenende', 'Zeige mir Sport-Events'];
      
      const errorHtml = `${createResponseHeader("Fehler")}
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
          Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
          Bitte versuche es später noch einmal.
        </div>`;
      
      // If callback provided, send error there too
      if (onAiResponseReceived) {
        onAiResponseReceived(errorHtml, fallbackSuggestions);
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          isUser: false,
          text: 'Es tut mir leid, ich konnte deine Anfrage nicht verarbeiten.',
          html: errorHtml,
          timestamp: new Date().toISOString(),
          suggestions: fallbackSuggestions
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false); // Stop typing after response
      isSendingRef.current = false; // Reset flag
    }
  };

  const handleDateSelect = (date: string) => {
    const prompt = `Welche Events gibt es am ${date}?`;
    handleSendMessage(prompt);
  };

  const handleExamplePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      handleSendMessage(prompt);
    }, 300);
  };

  const handleExternalQuery = (query: string) => {
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
    
    setTimeout(() => {
      handleSendMessage(query);
    }, 500);
  };

  // Minimalistische handleInputChange für flüssiges Tippen
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // isTyping wird hier NICHT manipuliert, da es den KI-Verarbeitungsstatus anzeigt.
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Verhindert einen Zeilenumbruch im Input-Feld
      handleSendMessage(); // Löst das Senden der Nachricht aus
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).chatbotQuery = handleExternalQuery;
      (window as any).handleAttendEvent = handleAttendEvent;
      (window as any).handleProposeMeetup = handleProposeMeetup;
      console.log("[useChatLogic] Registered window functions");
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).chatbotQuery = undefined;
        (window as any).handleAttendEvent = undefined;
        (window as any).handleProposeMeetup = undefined;
      }
    };
  }, [handleAttendEvent, handleProposeMeetup]);

  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          welcomeMessageShownRef.current = true;
        }
      } catch (error) {
        console.error('[useChatLogic] Error parsing saved chat history:', error);
      }
    }
    
    const savedQueries = localStorage.getItem(CHAT_QUERIES_KEY);
    if (savedQueries) {
      try {
        const parsedQueries = JSON.parse(savedQueries);
        if (Array.isArray(parsedQueries)) {
          setRecentQueries(parsedQueries.slice(0, 3));
        }
      } catch (error) {
        console.error('[useChatLogic] Error parsing saved queries:', error);
      }
    }
    
    try {
      const heartModeActive = localStorage.getItem('heart_mode_active') === 'true';
      setIsHeartActive(heartModeActive);
      console.log('[useChatLogic] Heart mode loaded from localStorage:', heartModeActive);
    } catch (error) {
      console.error('[useChatLogic] Error loading heart mode state:', error);
    }

    if (typeof window !== 'undefined') {
      setHasUserSentFirstMessage(localStorage.getItem(USER_SENT_FIRST_MESSAGE_KEY) === 'true');
    }
    
    fetchGlobalQueries();
  }, [fetchGlobalQueries]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (recentQueries.length > 0) {
      localStorage.setItem(CHAT_QUERIES_KEY, JSON.stringify(recentQueries));
    }
  }, [recentQueries]);
  
  useEffect(() => {
    try {
      localStorage.setItem('heart_mode_active', isHeartActive ? 'true' : 'false');
      console.log('[useChatLogic] Heart mode saved to localStorage:', isHeartActive);
    } catch (error) {
      console.error('[useChatLogic] Error saving heart mode state:', error);
    }
  }, [isHeartActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, fullPage ? 0 : 5000);

    return () => clearTimeout(timer);
  }, [fullPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    appLaunchedBeforeRef.current = localStorage.getItem(APP_LAUNCHED_KEY) === 'true';

    // Boot order: only AI mode, only if not already loaded from storage
    if (!welcomeMessageShownRef.current && activeChatModeValue === 'ai') {
      const hasMessages = messages.length > 0;
      const hasSavedMessages = localStorage.getItem(CHAT_HISTORY_KEY) !== null;

      if (!hasMessages && !hasSavedMessages && !appLaunchedBeforeRef.current) {
        welcomeMessageShownRef.current = true;
        localStorage.setItem(APP_LAUNCHED_KEY, 'true');
        setMessages([
          {
            id: 'welcome',
            isUser: false,
            text: 'Willkommen bei THE TRIBE!',
            html: getWelcomeMessage(),
            timestamp: new Date().toISOString()
          },
          {
            id: 'typewriter-prompt',
            isUser: false,
            text: 'Frag mich etwas:',
            examplePrompts: examplePrompts,
            timestamp: new Date().toISOString()
          },
          {
            id: 'landing-slides',
            isUser: false,
            text: 'Entdecke unsere Community-Features:',
            slideData: createLandingSlideData(),
            timestamp: new Date().toISOString()
          }
        ]);
        console.log('[ChatLogic:Welcome] Initial welcome/typewriter/landing messages gesetzt!');
      } else if (hasSavedMessages || appLaunchedBeforeRef.current) {
        welcomeMessageShownRef.current = true;
        // No-op: messages restored from storage or already flagged launched
      }
    }
  }, [activeChatModeValue, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleHeartClick = async () => {
    const newHeartState = !isHeartActive;
    setIsHeartActive(newHeartState);
    
    console.log(`[useChatLogic] Heart mode ${newHeartState ? 'activated' : 'deactivated'}`);
    
    if (newHeartState) {
      toast.success("Personalisierter Modus aktiviert! Deine Vorlieben werden nun berücksichtigt.");
    } else {
      toast.info("Standardmodus aktiviert. Alle Events werden angezeigt.");
    }
  };
  
  const toggleRecentQueries = () => {
    setShowRecentQueries(!showRecentQueries);
  };

  const handleEventLinkClick = async (eventId: string) => {
    console.log('[useChatLogic] Event link clicked:', eventId);
    setIsTyping(true);

    try {
      // Event aus DB laden
      const { data: event, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error || !event) {
        console.error('[useChatLogic] Error loading event:', error);
        throw new Error('Event nicht gefunden');
      }

      console.log('[useChatLogic] Event loaded:', event);
      setCurrentContextEvent(event);

      // Detailkarte erstellen
      const detailHtml = `
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            ${event.image_url ? `<img src="${event.image_url}" class="w-20 h-20 rounded-lg object-cover" />` : ''}
            <div class="flex-1">
              <h3 class="font-bold text-lg text-red-400">${event.title}</h3>
              <div class="text-sm text-white/70 space-y-1 mt-2">
                <div>🕐 ${event.date} um ${event.time} Uhr</div>
                <div>📍 ${event.location || 'Ort wird noch bekannt gegeben'}</div>
                ${event.is_paid ? '<div>💶 Kostenpflichtig</div>' : '<div>✅ Kostenlos</div>'}
              </div>
            </div>
          </div>
          ${event.description ? `<p class="text-sm text-white/80 leading-relaxed">${event.description}</p>` : ''}
          <div class="flex flex-wrap gap-2 pt-2">
            <button onclick="window.handleAttendEvent && window.handleAttendEvent('${event.id}')" class="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95">
              🎉 Ich bin dabei
            </button>
            <button onclick="window.showEventOnMap && window.showEventOnMap('${event.id}')" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors">
              🗺️ Auf Karte zeigen
            </button>
            <button onclick="window.showSimilarEvents && window.showSimilarEvents('${event.category}')" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors">
              🔁 Ähnliche Events
            </button>
            <button onclick="window.saveEvent && window.saveEvent('${event.id}')" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors">
              ⭐ Merken
            </button>
          </div>
        </div>
      `;

      const suggestions = [
        '🎉 Ich bin dabei',
        'Wann fängt das an?',
        'Zeig mir ähnliche Events',
        'Was kostet das?'
      ];

      const aiMessage: ChatMessage = {
        id: `ai-event-detail-${Date.now()}`,
        isUser: false,
        text: '',
        html: detailHtml,
        suggestions,
        timestamp: new Date().toISOString(),
        metadata: { eventId: event.id, eventTitle: event.title }
      };

      setMessages(prev => [...prev, aiMessage]);

      if (onAiResponseReceived) {
        onAiResponseReceived(detailHtml, suggestions);
      }
    } catch (error) {
      console.error('[useChatLogic] Error in handleEventLinkClick:', error);
      const errorHtml = `<div class="text-red-400">Event konnte nicht geladen werden. Bitte versuche es erneut.</div>`;
      
      const aiMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        isUser: false,
        text: '',
        html: errorHtml,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (onAiResponseReceived) {
        onAiResponseReceived(errorHtml, ['Was läuft heute?', 'Events am Wochenende']);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("Möchten Sie wirklich den gesamten Chat-Verlauf löschen?")) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.removeItem(APP_LAUNCHED_KEY);
      localStorage.removeItem(USER_SENT_FIRST_MESSAGE_KEY);
      setMessages([]);
      welcomeMessageShownRef.current = false;
      setMessages([
        {
          id: 'welcome',
          isUser: false,
          text: 'Willkommen bei THE TRIBE!',
          html: getWelcomeMessage(),
          timestamp: new Date().toISOString()
        },
        {
          id: 'typewriter-prompt',
          isUser: false,
          text: 'Frag mich etwas:',
          examplePrompts: examplePrompts,
          timestamp: new Date().toISOString()
        },
        {
          id: 'landing-slides',
          isUser: false,
          text: 'Entdecke unsere Community-Features:',
          slideData: createLandingSlideData(),
          timestamp: new Date().toISOString()
        }
      ]);
      toast.success("Chat-Verlauf gelöscht");
    }
  };

  const exportChatHistory = () => {
    if (messages.length === 0) {
      toast.error("Es gibt keine Nachrichten zum Exportieren.");
      return;
    }

    const chatHistoryData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatHistoryData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Chat-Verlauf exportiert");
  };
  
  return {
    isVisible,
    isChatOpen,
    messages,
    input,
    setInput,
    isTyping,
    recentQueries,
    globalQueries,
    showRecentQueries,
    setShowRecentQueries,
    messagesEndRef,
    inputRef,
    examplePrompts: shuffledExamplePrompts, // randomized but first stays constant
    isHeartActive,
    currentContextEvent,
    handleToggleChat,
    handleSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleExternalQuery,
    handleKeyPress, // Pass the new handleKeyPress
    handleInputChange, // Pass the new handleInputChange
    handleHeartClick,
    toggleRecentQueries,
    clearChatHistory,
    exportChatHistory,
    handleEventLinkClick,
    handleAttendEvent,
    handleProposeMeetup,
    showAnimatedPrompts: false
  };
};