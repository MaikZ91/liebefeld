// src/components/event-chat/useChatLogic.ts
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, CHAT_HISTORY_KEY, CHAT_QUERIES_KEY, PanelEventData, PanelEvent, AdEvent } from './types'; // Importiere AdEvent
import { supabase } from '@/integrations/supabase/client';
import { generateResponse, getWelcomeMessage, createResponseHeader } from '@/utils/chatUtils';
import { toast } from 'sonner';

// Importiere deine Event-Typen und Hilfsfunktionen zur Event-Filterung
import { Event } from '@/types/eventTypes';
import { getFutureEvents, getEventsForDay, getWeekRange } from '@/utils/eventUtils'; // Importiere getWeekRange


export const useChatLogic = (
  events: any[],
  fullPage: boolean = false,
  activeChatModeValue: 'ai' | 'community' = 'ai'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShownRef = useRef(false);
  
  // Example prompts that users can click on
  const examplePrompts = [
    "Welche Events gibt es heute?",
    "Was kann ich am Wochenende machen?",
    "Gibt es Konzerte im Lokschuppen?"
  ];

  // Ad Events direkt hier definieren oder importieren (Beispielhaft hier definiert)
  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Creative Circle',
      date: 'Immer am letzten Freitag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/83f7c05b-0e56-4f3c-a19c-adeab5429b59.jpg',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event" // Hinzugefügt für Typunterscheidung
    },
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event" // Hinzugefügt für Typunterscheidung
    },
    {
      title: 'Hör dir die Tribe Playlist an!',
      date: 'Jederzeit',
      location: 'Spotify',
      imageUrl: '/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png',
      link: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      type: "music" // Neuer Typ für Musik-Anzeigen
    }
  ];

  // Ersetzte createDummyPanelData durch eine Funktion, die echte Events oder Anzeigen verwendet
  const createPanelData = (filteredEvents: Event[]): PanelEventData => {
    const allItems: (PanelEvent | AdEvent)[] = [];

    // Füge die gefilterten Events hinzu
    filteredEvents.slice(0, 5).forEach(event => { // Begrenze die Anzahl der angezeigten Events
      allItems.push({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        price: event.is_paid ? "Kostenpflichtig" : "Kostenlos", // Oder den tatsächlichen Preis, wenn vorhanden
        location: event.location,
        image_url: event.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', // Standardbild, falls keines vorhanden
        category: event.category
      });
    });

    // Füge zufällig eine Anzeige hinzu (z.B. 20% Chance)
    if (Math.random() < 0.3 && adEvents.length > 0) { // 30% Chance, eine Anzeige hinzuzufügen
      const randomAd = adEvents[Math.floor(Math.random() * adEvents.length)];
      allItems.push(randomAd);
      console.log('Adding random ad to panel:', randomAd.title);
    }

    // Mische die Liste, um Events und Anzeigen zu vermischen
    // allItems.sort(() => Math.random() - 0.5); // Optional: Events und Anzeigen mischen

    return {
      events: allItems,
      currentIndex: 0
    };
  };

  // Load chat history and recent queries from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          welcomeMessageShownRef.current = true; // Skip welcome message if we loaded history
        }
      } catch (error) {
        console.error('[useChatLogic] Error parsing saved chat history:', error);
      }
    }
    
    // Load local recent queries too (keeping for backup)
    const savedQueries = localStorage.getItem(CHAT_QUERIES_KEY);
    if (savedQueries) {
      try {
        const parsedQueries = JSON.parse(savedQueries);
        if (Array.isArray(parsedQueries)) {
          setRecentQueries(parsedQueries.slice(0, 3)); // Only store last 3
        }
      } catch (error) {
        console.error('[useChatLogic] Error parsing saved queries:', error);
      }
    }
    
    // Also load heart mode state from localStorage
    try {
      const heartModeActive = localStorage.getItem('heart_mode_active') === 'true';
      setIsHeartActive(heartModeActive);
      console.log('[useChatLogic] Heart mode loaded from localStorage:', heartModeActive);
    } catch (error) {
      console.error('[useChatLogic] Error loading heart mode state:', error);
    }
    
    // Fetch global queries from Supabase
    fetchGlobalQueries();
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save recent queries to localStorage whenever they change
  useEffect(() => {
    if (recentQueries.length > 0) {
      localStorage.setItem(CHAT_QUERIES_KEY, JSON.stringify(recentQueries));
    }
  }, [recentQueries]);
  
  // Save heart mode state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('heart_mode_active', isHeartActive ? 'true' : 'false');
      console.log('[useChatLogic] Heart mode saved to localStorage:', isHeartActive);
    } catch (error) {
      console.error('[useChatLogic] Error saving heart mode state:', error);
    }
  }, [isHeartActive]);

  useEffect(() => {
    // Initialize the chat bot after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, fullPage ? 0 : 5000); // No delay in fullPage mode

    return () => clearTimeout(timer);
  }, [fullPage]);

  useEffect(() => {
    // Add welcome message when chat is opened for the first time
    if (isChatOpen && messages.length === 0 && !welcomeMessageShownRef.current && activeChatModeValue === 'ai') {
      welcomeMessageShownRef.current = true;
      setMessages([
        {
          id: 'welcome',
          isUser: false,
          text: 'Willkommen beim Liebefeld Event-Assistent!',
          html: getWelcomeMessage(),
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isChatOpen, messages.length, activeChatModeValue]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    // Focus on input field when opening chat
    if (!isChatOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  };
  
  // Fetch global queries from Supabase
  const fetchGlobalQueries = async () => {
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
  };
  
  // Save a query to Supabase
  const saveGlobalQuery = async (query: string) => {
    try {
      // First check if this query already exists to avoid duplicates
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
        // Query already exists, update its timestamp
        await supabase
          .from('chat_queries')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existingData[0].id);
      } else {
        // Insert new query
        const { error: insertError } = await supabase
          .from('chat_queries')
          .insert({ query: query });
          
        if (insertError) {
          console.error('[useChatLogic] Error saving global query:', insertError);
        }
      }
      
      // Refresh the global queries list
      fetchGlobalQueries();
    } catch (error) {
      console.error('[useChatLogic] Exception saving global query:', error);
    }
  };

  const updateRecentQueries = (query: string) => {
    // Still maintain local user queries as backup
    setRecentQueries(prev => {
      // Filter out duplicates and add new query at the beginning
      const filteredQueries = prev.filter(q => q !== query);
      const newQueries = [query, ...filteredQueries].slice(0, 3);
      return newQueries;
    });
    
    // Also save to global queries in Supabase
    saveGlobalQuery(query);
  };

  const handleSendMessage = async (customInput?: string) => {
    const message = customInput || input;
    if (!message.trim()) return;
    
    // Add to recent queries if it's a new query
    updateRecentQueries(message);
    
    // Create the user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      isUser: true,
      text: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Events filtern basierend auf der Abfrage
    let relevantEvents: Event[] = [];
    const currentDate = new Date();

    // Beispiel-Logik: Wenn die Anfrage nach "heute" oder "Wochenende" fragt
    const lowercaseMessage = message.toLowerCase();
    if (lowercaseMessage.includes('heute') || lowercaseMessage.includes('today')) {
      relevantEvents = getEventsForDay(events, currentDate);
    } else if (lowercaseMessage.includes('morgen') || lowercaseMessage.includes('tomorrow')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      relevantEvents = getEventsForDay(events, tomorrow);
    }
     else if (lowercaseMessage.includes('wochenende') || lowercaseMessage.includes('weekend')) {
      const [startOfWeek, endOfWeek] = getWeekRange(currentDate);
      // Finde den Samstag und Sonntag dieser oder der nächsten Woche
      let saturday = new Date(currentDate);
      let sunday = new Date(currentDate);

      // Finde den nächsten Samstag (falls heute nicht Samstag ist)
      saturday.setDate(currentDate.getDate() + (6 - currentDate.getDay() + 7) % 7);
      // Finde den nächsten Sonntag (falls heute nicht Sonntag ist)
      sunday.setDate(currentDate.getDate() + (0 - currentDate.getDay() + 7) % 7);

      if (saturday < currentDate) { // Wenn Samstag schon vorbei ist, nimm Samstag nächste Woche
          saturday.setDate(saturday.getDate() + 7);
      }
      if (sunday < currentDate) { // Wenn Sonntag schon vorbei ist, nimm Sonntag nächste Woche
          sunday.setDate(sunday.getDate() + 7);
      }
      
      relevantEvents = events.filter(e => 
        (new Date(e.date).toISOString().split('T')[0] === saturday.toISOString().split('T')[0]) ||
        (new Date(e.date).toISOString().split('T')[0] === sunday.toISOString().split('T')[0])
      );
    }
     else {
      // Fallback: Zukünftige Events anzeigen
      relevantEvents = getFutureEvents(events);
    }
    
    // Filtern nach Kategorien, falls in der Nachricht erwähnt
    const categoryMapping = {
      konzert: "Konzert",
      party: "Party",
      ausstellung: "Ausstellung",
      sport: "Sport",
      workshop: "Workshop",
      kultur: "Kultur",
      film: "Film",
      theater: "Theater",
      lesung: "Lesung",
      festival: "Festival"
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

    // Wenn es keine relevanten Events gibt, Panel nicht anzeigen
    if (relevantEvents.length > 0) {
      // Jetzt die Panel-Daten aus den relevanten Events erstellen
      const panelData = createPanelData(relevantEvents); // Hier wird jetzt auch die Anzeige hinzugefügt

      const panelMessage: ChatMessage = {
        id: `panel-${Date.now()}`,
        isUser: false,
        text: 'Hier sind einige Events für dich:',
        panelData: panelData,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, panelMessage]);
    }
    
    // Generiere und zeige die reguläre Antwort danach
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
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
          Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
          Bitte versuche es später noch einmal oder formuliere deine Anfrage anders.
        </div>`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDateSelect = (date: string) => {
    const formattedDate = date; // date is already formatted as YYYY-MM-DD
    const prompt = `Welche Events gibt es am ${formattedDate}?`;
    handleSendMessage(prompt);
  };

  const handleExamplePromptClick = (prompt: string) => {
    setInput(prompt);
    // Optional: auto-send after a short delay
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

  // Register external query handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - We're explicitly adding a custom property
      window.chatbotQuery = handleExternalQuery;
      console.log("[useChatLogic] Registered window.chatbotQuery function");
    }
    
    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined') {
        // @ts-ignore - we're explicitly removing the property
        window.chatbotQuery = undefined;
      }
    };
  }, []);

  // Subscribe to real-time updates for chat_queries table
  useEffect(() => {
    const channel = supabase
      .channel('chat_queries_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_queries' 
        }, 
        () => {
          // Refetch global queries when there's a change
          fetchGlobalQueries();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Handle heart button click
  const handleHeartClick = async () => {
    // Toggle the heart state 
    const newHeartState = !isHeartActive;
    setIsHeartActive(newHeartState);
    
    console.log(`[useChatLogic] Heart mode ${newHeartState ? 'activated' : 'deactivated'}`);
    
    // Show a toast notification about the mode change
    if (newHeartState) {
      toast.success("Personalisierter Modus aktiviert! Deine Vorlieben werden nun berücksichtigt.");
    } else {
      toast.info("Standardmodus aktiviert. Alle Events werden angezeigt.");
    }
  };
  
  // Toggle recent queries dropdown
  const toggleRecentQueries = () => {
    setShowRecentQueries(!showRecentQueries);
  };
  
  // Clear chat history
  const clearChatHistory = () => {
    // Ask for confirmation
    if (window.confirm("Möchten Sie wirklich den gesamten Chat-Verlauf löschen?")) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([]);
      welcomeMessageShownRef.current = false;
      // Re-add welcome message
      setMessages([
        {
          id: 'welcome',
          isUser: false,
          text: 'Willkommen beim Liebefeld Event-Assistent!',
          html: getWelcomeMessage(),
          timestamp: new Date().toISOString()
        }
      ]);
      toast.success("Chat-Verlauf gelöscht");
    }
  };

  // Export chat history as JSON file
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
    exportChatHistory
  };
};