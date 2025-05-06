import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, X, Send, ChevronDown, Download, Trash2, History, PlusCircle, Users, Heart
} from 'lucide-react';
import { 
  generateResponse, 
  getWelcomeMessage,
  formatEvents,
  createResponseHeader,
  generatePersonalizedPrompt
} from '@/utils/chatUtils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import ChatMessage from '@/components/chat/ChatMessage';
import GroupChat from '@/components/GroupChat';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from "@/integrations/supabase/client";
import { ChatQuery, USERNAME_KEY } from '@/types/chatTypes';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { userService } from '@/services/userService';

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
  timestamp?: string; // For storing the creation time
}

interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void; // New prop for toggling to community view
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
}

// Local storage keys
const CHAT_HISTORY_KEY = 'event-chat-history';
const CHAT_QUERIES_KEY = 'event-chat-queries';

const EventChatBot: React.FC<EventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode
}) => {
  const isMobile = useIsMobile();
  const { events } = useEventContext();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  // Fix: Changed from "fullPage" to either default state or fullPage based on fullPage prop
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  // Use the prop value if provided, otherwise use internal state
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  // Add user profile hook to get the current user's profile data
  const { currentUser, userProfile } = useUserProfile();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShownRef = useRef(false);
  const [communityGroupId, setCommunityGroupId] = useState('general');  // Default group ID

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
        console.error('Error parsing saved chat history:', error);
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
        console.error('Error parsing saved queries:', error);
      }
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
        console.error('Error fetching global queries:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const queries = data.map(item => item.query);
        setGlobalQueries(queries);
      }
    } catch (error) {
      console.error('Exception fetching global queries:', error);
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
        console.error('Error checking for existing query:', checkError);
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
          console.error('Error saving global query:', insertError);
        }
      }
      
      // Refresh the global queries list
      fetchGlobalQueries();
    } catch (error) {
      console.error('Exception saving global query:', error);
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
    
    // Detect if this is a calendar-related query
    const isCalendarQuery = /wann|heute|morgen|datum|kalender|tag|monat|events|veranstaltungen|konzerte|party|festival|welche|was gibt|was ist los|was läuft|was passiert/i.test(message);
    
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
        console.log(`Processing user query: "${message}" with ${events.length} events`);
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
        console.error('Error generating response:', error);
        
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

  const handleToggleChatMode = () => {
    const newMode = activeChatModeValue === 'ai' ? 'community' : 'ai';
    setActiveChatModeValue(newMode);
    
    // If switching to community mode and there's a parent toggle function, call it
    if (activeChatModeValue === 'ai' && onToggleCommunity) {
      onToggleCommunity();
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
      toast({
        title: "Chat-Verlauf gelöscht",
        description: "Der Chat-Verlauf wurde erfolgreich gelöscht.",
      });
    }
  };

  // Export chat history as JSON file
  const exportChatHistory = () => {
    if (messages.length === 0) {
      toast({
        title: "Keine Nachrichten",
        description: "Es gibt keine Nachrichten zum Exportieren.",
        variant: "destructive"
      });
      return;
    }

    const chatHistoryData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatHistoryData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat-Verlauf exportiert",
      description: "Der Chat-Verlauf wurde erfolgreich exportiert.",
    });
  };
  
  // Toggle recent queries dropdown
  const toggleRecentQueries = () => {
    setShowRecentQueries(!showRecentQueries);
  };
  
  // Expose the handleExternalQuery function to window for access from other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - We're explicitly adding a custom property
      window.chatbotQuery = handleExternalQuery;
      console.log("Registered window.chatbotQuery function");
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

  // Add a new state for tracking when the heart is clicked
  const [isHeartActive, setIsHeartActive] = useState(false);
  
  // Modified function to handle heart button click - removing auto-query
  const handleHeartClick = () => {
    // Simply toggle the heart state without sending a query
    setIsHeartActive(prev => !prev);
    
    // Show a toast notification about the mode change
    if (!isHeartActive) {
      toast.success("Personalisierter Modus aktiviert! Deine Vorlieben werden nun berücksichtigt.");
    } else {
      toast.info("Standardmodus aktiviert. Alle Events werden angezeigt.");
    }
  };
  
  // Add a function to manually send personalized query
  const sendPersonalizedQuery = async () => {
    try {
      // Get user interests and locations from the user profile
      let userInterests: string[] = [];
      let userLocations: string[] = [];
      
      if (userProfile) {
        // If we have a user profile, use those interests and locations
        userInterests = userProfile.interests || [];
        userLocations = userProfile.favorite_locations || [];
        
        // Save to localStorage for future use
        if (userInterests.length > 0) {
          localStorage.setItem('user_interests', JSON.stringify(userInterests));
        }
        
        if (userLocations.length > 0) {
          localStorage.setItem('user_locations', JSON.stringify(userLocations));
        }
      } else if (currentUser !== 'Gast') {
        // If we have a username but no profile loaded yet, try to fetch it
        try {
          const profile = await userService.getUserByUsername(currentUser);
          if (profile) {
            userInterests = profile.interests || [];
            userLocations = profile.favorite_locations || [];
            
            // Save to localStorage
            if (userInterests.length > 0) {
              localStorage.setItem('user_interests', JSON.stringify(userInterests));
            }
            
            if (userLocations.length > 0) {
              localStorage.setItem('user_locations', JSON.stringify(userLocations));
            }
          }
        } catch (err) {
          console.error('Error fetching user profile for personalization:', err);
        }
      } else {
        // Fallback to localStorage if no profile is available
        userInterests = localStorage.getItem('user_interests')
          ? JSON.parse(localStorage.getItem('user_interests') || '[]')
          : [];
          
        userLocations = localStorage.getItem('user_locations')
          ? JSON.parse(localStorage.getItem('user_locations') || '[]')
          : [];
      }
      
      // If we still don't have interests or locations, use fallbacks
      if (userInterests.length === 0) {
        userInterests = ['Musik', 'Sport', 'Kultur'];
      }
      
      if (userLocations.length === 0) {
        userLocations = ['Liebefeld', 'Bern'];
      }
      
      // Generate personalized prompt
      const personalizedPrompt = generatePersonalizedPrompt(userInterests, userLocations);
      
      // Show a toast notification
      toast.success("Suche passende Events für dich...");
      
      // Send the personalized prompt to the chat
      await handleSendMessage(personalizedPrompt);
    } catch (error) {
      console.error('Error in personalized recommendations:', error);
      toast.error("Konnte keine personalisierten Empfehlungen laden");
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        isUser: false,
        text: 'Es tut mir leid, ich konnte keine personalisierten Empfehlungen laden.',
        html: `${createResponseHeader("Fehler")}
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
          Ein Fehler ist aufgetreten beim Laden personalisierter Empfehlungen. 
          Bitte versuche es später noch einmal.
        </div>`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (!isVisible) return null;

  // Render the message list
  const renderMessages = () => {
    return messages.map((message) => (
      <div
        key={message.id}
        className={cn(
          "max-w-[85%] rounded-lg",
          message.isUser
            ? "bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 ml-auto"
            : "bg-zinc-900/50 dark:bg-zinc-800/50 border border-zinc-700/30"
        )}
      >
        {message.html ? (
          <div 
            dangerouslySetInnerHTML={{ __html: message.html }} 
            className="p-3"
          />
        ) : (
          <ChatMessage 
            message={message.text} 
            isGroup={false} 
            onDateSelect={handleDateSelect}
            showDateSelector={message.isUser && message.text.toLowerCase().includes('event')}
          />
        )}
      </div>
    ));
  };

  // Render recent queries
  const renderRecentQueries = () => {
    // Use global queries from Supabase instead of local queries
    const queriesToRender = globalQueries.length > 0 ? globalQueries : recentQueries;
    
    if (queriesToRender.length === 0) return null;
    
    return (
      <div className={`absolute bottom-[60px] left-0 right-0 bg-gray-900/80 backdrop-blur-sm rounded-t-lg border border-red-500/20 transition-all duration-300 ${showRecentQueries ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="p-3 border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-red-400">Letzte Community-Anfragen</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecentQueries(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="p-2 max-h-[150px] overflow-y-auto">
          {queriesToRender.map((query, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left text-sm py-2 text-red-200 hover:bg-red-950/30"
              onClick={() => handleExamplePromptClick(query)}
            >
              {query}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // If we're in fullPage mode, render a different UI
  if (fullPage) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-240px)]">
          {activeChatModeValue === 'ai' ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 pb-2">
                {renderMessages()}
                
                {isTyping && (
                  <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                
                {/* Display example prompts only if there's just the welcome message */}
                {messages.length === 1 && messages[0].id === 'welcome' && (
                  <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30 mt-4">
                    <p className="text-sm text-red-200 mb-2">
                      Frag mich zum Beispiel:
                    </p>
                    <div className="flex flex-col gap-2">
                      {examplePrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left justify-start bg-red-900/20 hover:bg-red-900/30 text-red-200 border-red-500/30"
                          onClick={() => handleExamplePromptClick(prompt)}
                        >
                          "{prompt}"
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          ) : (
            <GroupChat compact={false} groupId={communityGroupId} groupName="Allgemein" />
          )}
        </div>
        
        <div className="p-3 border-t border-red-500/20 relative mt-auto">
          {renderRecentQueries()}
          
          <div className="flex items-center relative">
            <div className="absolute left-2 flex items-center gap-1 z-10">
              {/* Heart button for toggling personalized mode */}
              {activeChatModeValue === 'ai' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleHeartClick}
                  className={`h-8 w-8 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`}
                  title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
                >
                  <Heart className={`h-4 w-4 ${isHeartActive ? 'fill-red-500' : ''}`} />
                </Button>
              )}
              
              {/* History button for recent queries */}
              {globalQueries.length > 0 && activeChatModeValue === 'ai' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecentQueries}
                  className="h-8 w-8 text-red-400"
                  title="Community Anfragen"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              
              {/* Add Event Button */}
              {onAddEvent && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddEvent}
                  className="h-8 w-8 text-red-400"
                  title="Event hinzufügen"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {activeChatModeValue === 'ai' ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Frage nach Events..."
                  className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border border-red-500/20 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-red-200 placeholder-red-200/50 pl-28"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "ml-2 rounded-full p-2",
                    input.trim() && !isTyping
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // For the floating chatbot UI, also update to match the changes
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div className="bg-black dark:bg-zinc-900/95 rounded-lg shadow-xl mb-3 w-[320px] sm:w-[350px] max-h-[500px] flex flex-col border border-red-500/20 transition-all duration-300 animate-slide-up backdrop-blur-lg">
          <div className="flex items-center justify-between p-3 border-b border-red-500/20 bg-red-950/30 rounded-t-lg">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-medium text-red-500">
                {activeChatModeValue === 'ai' ? 'Event-Assistent' : 'Community-Chat'}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 bg-gray-800 text-white hover:bg-gray-700 p-1">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                  <DropdownMenuLabel>Chat-Verlauf</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={exportChatHistory} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      <span>Exportieren</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={clearChatHistory} className="cursor-pointer text-red-400">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Löschen</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={handleToggleChat}
                className="h-6 w-6 p-1 text-red-400 hover:text-red-300 transition-colors bg-transparent hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-3 overflow-y-auto max-h-[350px]">
            {activeChatModeValue === 'ai' ? (
              <div className="space-y-3 pb-2">
                {renderMessages()}
                
                {isTyping && (
                  <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                
                {/* Display example prompts only if there's just the welcome message */}
                {messages.length === 1 && messages[0].id === 'welcome' && (
                  <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30 mt-4">
                    <p className="text-sm text-red-200 mb-2">
                      Frag mich zum Beispiel:
                    </p>
                    <div className="flex flex-col gap-2">
                      {examplePrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-left justify-start bg-red-900/20 hover:bg-red-900/30 text-red-200 border-red-500/30 text-xs"
                          onClick={() => handleExamplePromptClick(prompt)}
                        >
                          "{prompt}"
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <GroupChat compact groupId={communityGroupId} groupName="Allgemein" />
            )}
          </ScrollArea>
          
          <div className="p-3 border-t border-red-500/20 relative">
            {renderRecentQueries()}
            
            <div className="flex items-center relative">
              <div className="absolute left-2 flex items-center gap-1 z-10">
                {/* Heart button for personalized recommendations */}
                {activeChatModeValue === 'ai' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleHeartClick}
                    className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`}
                    title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
                  >
                    <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
                  </Button>
                )}
                
                {/* History button for recent queries */}
                {globalQueries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleRecentQueries}
                    className="h-6 w-6 text-red-400"
                    title="Community Anfragen"
                  >
                    <History className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Add Event Button */}
                {onAddEvent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onAddEvent}
                    className="h-6 w-6 text-red-400"
                    title="Event hinzufügen"
                  >
                    <PlusCircle className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Community Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleChatMode}
                  className="h-6 w-6 text-[#9b87f5]"
                  title="Community"
                >
                  <Users className="h-3 w-3" />
                  <span className="sr-only">Community</span>
                </Button>
              </div>
              
              {activeChatModeValue === 'ai' ? (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Frage nach Events..."
                    className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border border-red-500/20 rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-red-200 placeholder-red-200/50 pl-20 pr-8 w-[90%]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isTyping}
                    className={cn(
                      "absolute right-1 rounded-full p-1",
                      input.trim() && !isTyping
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
      
      {!fullPage && !isChatOpen && (
        <button
          onClick={handleToggleChat}
          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg transform transition-transform hover:scale-105"
          aria-label="Öffne Event-Assistent"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default EventChatBot;
