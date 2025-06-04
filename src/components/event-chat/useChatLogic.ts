import { useState, useEffect, useRef } from 'react';
import { ChatMessage, CHAT_HISTORY_KEY, CHAT_QUERIES_KEY } from './types';
import { supabase } from '@/integrations/supabase/client';
import { generateResponse, getWelcomeMessage, createResponseHeader } from '@/utils/chatUtils';
import { toast } from 'sonner';

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
    
    // Process with small delay to show typing indicator
    setTimeout(async () => {
      try {
        console.log(`[useChatLogic] Processing user query: "${message}" with ${events.length} events`);
        console.log(`[useChatLogic] Heart mode active: ${isHeartActive}`);
        
        // Pass the heart mode state to the generateResponse function
        const responseHtml = await generateResponse(message, events, isHeartActive);
        
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          isUser: false,
          text: 'Hier sind die Events, die ich gefunden habe.',
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
    }, 800);
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
