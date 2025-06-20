// src/components/event-chat/useChatLogic.ts
import { useState, useEffect, useRef, useCallback } from 'react';
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

// Define a key for localStorage to track if the app has been launched before
const APP_LAUNCHED_KEY = 'app_launched_before';
const USER_SENT_FIRST_MESSAGE_KEY = 'user_sent_first_message'; 

export const useChatLogic = (
  fullPage: boolean = false,
  activeChatModeValue: 'ai' | 'community' = 'ai'
) => {
  // Get events and selectedCity from EventContext instead of props
  const { events, selectedCity } = useEventContext();
  
  // Always visible in fullPage mode
  const [isVisible, setIsVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false); 
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShownRef = useRef(false);
  const appLaunchedBeforeRef = useRef(false); 

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

  const handleSendMessage = async (customInput?: string) => {
    const message = customInput || input;
    if (!message.trim()) return;
    
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
    setInput('');
    setIsTyping(true);

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
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);

      } catch (error) {
        console.error('[useChatLogic] Error generating perfect day:', error);
        const errorMessage: ChatMessage = {
          id: `error-perfect-day-${Date.now()}`,
          isUser: false,
          text: 'Es tut mir leid, ich konnte deinen perfekten Tag nicht generieren.',
          html: `${createResponseHeader("Fehler")}
          <div class=\"bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm\">\n            Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. \n            Bitte versuche es später noch einmal.\n          </div>`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    let relevantEvents: Event[] = [];
    const currentDate = new Date();

    if (lowercaseMessage.includes('heute') || lowercaseMessage.includes('today')) {
      relevantEvents = getEventsForDay(events, currentDate);
    } else if (lowercaseMessage.includes('morgen') || lowercaseMessage.includes('tomorrow')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      relevantEvents = getEventsForDay(events, tomorrow);
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
    }
     else {
      relevantEvents = getFutureEvents(events);
    }
    
    const categoryMapping = {
      konzert: "Konzert",
      party: "Party",
      ausstellung: "Ausstellung",
      sport: "Sport",
      workshop: "Workshop",
      kultur: "Kultur",
      film: "Film",
      theater: "Theater",
      lesung: "Lesung"
    };

    let detectedCategory: string | null = null;
    for (const [keyword, category] of Object.entries(categoryMapping)) {
      if (lowercaseMessage.includes(keyword)) {
        detectedCategory = category;
        break;
      }
    }

    if (detectedCategory) {
      relevantEvents = relevantEvents.filter(event => event.category && event.category.toLowerCase() === detectedCategory.toLowerCase());
    }
    
    const panelMessage: ChatMessage = {
      id: `panel-${Date.now()}`,
      isUser: false,
      text: 'Hier sind einige Events für dich:',
      panelData: createPanelData(relevantEvents),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, panelMessage]);
    
    try {
      const responseHtml = await generateResponse(message, events, isHeartActive);
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        isUser: false,
        text: 'Hier sind weitere Details zu den Events.',
        html: responseHtml,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('[useChatLogic] Error generating response:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        isUser: false,
        text: 'Es tut mir leid, ich konnte deine Anfrage nicht verarbeiten.',
        html: `${createResponseHeader("Fehler")}
          <div class=\"bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm\">\n            Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. \n            Bitte versuche es später noch einmal oder formuliere deine Anfrage anders.\n          </div>`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDateSelect = (date: string) => {
    const formattedDate = date;
    const prompt = `Welche Events gibt es am ${formattedDate}?`;
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).chatbotQuery = handleExternalQuery;
      console.log("[useChatLogic] Registered window.chatbotQuery function");
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).chatbotQuery = undefined;
      }
    };
  }, []);

  // Initialize welcome messages for AI mode
  const initializeWelcomeMessages = useCallback(() => {
    if (welcomeMessageShownRef.current || activeChatModeValue !== 'ai' || !fullPage) {
      return;
    }

    const hasMessages = messages.length > 0;
    const hasSavedMessages = localStorage.getItem(CHAT_HISTORY_KEY) !== null;

    // Only show welcome messages if no messages exist and app hasn't been launched before
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
      console.log('[ChatLogic:Welcome] Initial welcome messages set for fullPage AI mode!');
    } else if (hasSavedMessages || appLaunchedBeforeRef.current) {
      welcomeMessageShownRef.current = true;
    }
  }, [activeChatModeValue, messages.length, fullPage, examplePrompts]);

  // Load initial state from localStorage
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
      appLaunchedBeforeRef.current = localStorage.getItem(APP_LAUNCHED_KEY) === 'true';
    }
    
    fetchGlobalQueries();
    setIsInitialized(true);
  }, [fetchGlobalQueries]);

  // Initialize welcome messages after initial state is loaded
  useEffect(() => {
    if (isInitialized) {
      initializeWelcomeMessages();
    }
  }, [isInitialized, initializeWelcomeMessages]);

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

  // Simplified visibility logic - immediately visible in fullPage mode
  useEffect(() => {
    if (fullPage) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [fullPage]);

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
    examplePrompts,
    isHeartActive,
    handleToggleChat,
    handleSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleExternalQuery,
    handleKeyPress,
    handleHeartClick,
    toggleRecentQueries,
    clearChatHistory,
    exportChatHistory,
    showAnimatedPrompts: false
  };
};
