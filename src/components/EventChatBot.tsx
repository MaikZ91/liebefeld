
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, X, Send, ChevronDown, 
  CalendarDays, Clock, User, MapPin 
} from 'lucide-react';
import { 
  generateResponse, 
  getWelcomeMessage,
  formatEvents,
  createResponseHeader
} from '@/utils/chatUtils';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
}

// Declare global window interface to add chatbotQuery
declare global {
  interface Window {
    chatbotQuery: (query: string) => void;
  }
}

const EventChatBot: React.FC = () => {
  const isMobile = useIsMobile();
  const { events } = useEventContext();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize the chat bot after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Add welcome message when chat is opened for the first time
    if (isChatOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          isUser: false,
          text: 'Willkommen beim Liebefeld Event-Assistent!',
          html: getWelcomeMessage()
        }
      ]);
    }
  }, [isChatOpen, messages.length]);

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

  const handleSendMessage = (customInput?: string) => {
    const message = customInput || input;
    if (!message.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      isUser: true,
      text: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Process with small delay to show typing indicator
    setTimeout(() => {
      try {
        console.log(`Processing user query: "${message}" with ${events.length} events`);
        const responseHtml = generateResponse(message, events);
        
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          isUser: false,
          text: 'Hier sind die Events, die ich gefunden habe.',
          html: responseHtml
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
            Es ist ein Fehler aufgetreten. Bitte versuche es später noch einmal.
          </div>`
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
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
  
  // Expose the handleExternalQuery function to window for access from other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg mb-3 w-[320px] sm:w-[350px] max-h-[500px] flex flex-col border border-orange-200 dark:border-orange-900/40 transition-all duration-300 animate-slide-up">
          <div className="flex items-center justify-between p-3 border-b border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/30 rounded-t-lg">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-medium text-red-500">Event-Assistent</h3>
            </div>
            <button
              onClick={handleToggleChat}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.isUser
                    ? "bg-orange-100 dark:bg-orange-900/30 ml-auto"
                    : "bg-gray-100 dark:bg-zinc-800"
                )}
              >
                {message.html ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  <p className="text-red-500">{message.text}</p>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="bg-gray-100 dark:bg-zinc-800 max-w-[85%] rounded-lg p-3">
                <div className="flex space-x-2 items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t border-orange-200 dark:border-orange-900/40">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Frage nach Events..."
                className="flex-1 border border-orange-200 dark:border-orange-900/40 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-zinc-800 text-sm text-red-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "ml-2 rounded-full p-2",
                  input.trim() && !isTyping
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-200 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleToggleChat}
        className={cn(
          "bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all",
          isChatOpen && "rotate-90"
        )}
      >
        {isChatOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default EventChatBot;
