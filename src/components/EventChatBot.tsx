import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, X, Send, ChevronDown
} from 'lucide-react';
import { 
  generateResponse, 
  getWelcomeMessage,
  formatEvents,
  createResponseHeader
} from '@/utils/chatUtils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
}

interface EventChatBotProps {
  fullPage?: boolean;
}

const EventChatBot: React.FC<EventChatBotProps> = ({ fullPage = false }) => {
  const isMobile = useIsMobile();
  const { events } = useEventContext();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(fullPage); // Auto open in full page mode
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShownRef = useRef(false);

  // Example prompts that users can click on
  const examplePrompts = [
    "Welche Events gibt es heute?",
    "Was kann ich am Wochenende machen?",
    "Gibt es Konzerte im Lokschuppen?"
  ];

  useEffect(() => {
    // Initialize the chat bot after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, fullPage ? 0 : 5000); // No delay in fullPage mode

    return () => clearTimeout(timer);
  }, [fullPage]);

  useEffect(() => {
    // Add welcome message when chat is opened for the first time
    if (isChatOpen && messages.length === 0 && !welcomeMessageShownRef.current) {
      welcomeMessageShownRef.current = true;
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
    setTimeout(async () => {
      try {
        console.log(`Processing user query: "${message}" with ${events.length} events`);
        // Fix: Await the response from generateResponse since it's async
        const responseHtml = await generateResponse(message, events);
        
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

  if (!isVisible) return null;

  // If we're in fullPage mode, render a different UI
  if (fullPage) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-red-500/20 bg-red-950/30 rounded-t-lg">
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="font-medium text-red-500">Event-Assistent</h3>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-240px)]">
          <div className="space-y-3 pb-2">
            {messages.map((message) => (
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
                  <p className="p-3 text-red-200">{message.text}</p>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                <div className="flex space-x-2 items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {messages.length === 1 && (
              <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30 mt-4">
                <p className="text-sm text-red-200 mb-2">
                  Ich bin dein persönlicher Assistent für alle Liebefeld Events.
                </p>
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
        
        <div className="p-3 border-t border-red-500/20">
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Frage nach Events..."
              className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border border-red-500/20 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-red-200 placeholder-red-200/50"
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
          </div>
        </div>
      </div>
    );
  }

  // Original UI for floating chatbot
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div className="bg-black dark:bg-zinc-900/95 rounded-lg shadow-xl mb-3 w-[320px] sm:w-[350px] max-h-[500px] flex flex-col border border-red-500/20 transition-all duration-300 animate-slide-up backdrop-blur-lg">
          <div className="flex items-center justify-between p-3 border-b border-red-500/20 bg-red-950/30 rounded-t-lg">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-medium text-red-500">Event-Assistent</h3>
            </div>
            <button
              onClick={handleToggleChat}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <ScrollArea className="flex-1 p-3 overflow-y-auto max-h-[350px]">
            <div className="space-y-3 pb-2">
              {messages.map((message) => (
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
                    <p className="p-3 text-red-200">{message.text}</p>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                  <div className="flex space-x-2 items-center">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              
              {messages.length === 1 && (
                <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30 mt-4">
                  <p className="text-sm text-red-200 mb-2">
                    Ich bin dein persönlicher Assistent für alle Liebefeld Events.
                  </p>
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
          </ScrollArea>
          
          <div className="p-3 border-t border-red-500/20">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Frage nach Events..."
                className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border border-red-500/20 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-red-200 placeholder-red-200/50"
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
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleToggleChat}
        className={cn(
          "bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all duration-300",
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
