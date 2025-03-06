
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { type Event } from './EventCalendar';
import { useEventContext } from '@/contexts/EventContext';
import { generateResponse, getWelcomeMessage } from '@/utils/chatUtils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EventChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { events } = useEventContext();

  interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log(`EventChatBot received ${events.length} events from context`);
    if (events.length > 0) {
      console.log("Sample events from context:", events.slice(0, 3));
    }
  }, [events]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateResponse(input, events);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                className="fixed right-4 bottom-4 rounded-full w-14 h-14 shadow-lg bg-gradient-to-tr from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 flex items-center justify-center animate-pulse-soft ring-4 ring-red-300 dark:ring-red-900/40"
                aria-label="Event Chat"
              >
                <MessageCircle className="h-7 w-7" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-red-500/90 text-white border-0 shadow-md animate-bounce-slow text-xs"
          >
            <span className="font-medium">Frag mich über Events 👋</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0 rounded-xl bg-[#1A1D2D] text-white border-gray-800 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-red-700 to-red-600 rounded-t-xl">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-white" />
            <h3 className="font-semibold">❤️ LiebefeldBot</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-gray-200 hover:text-white hover:bg-red-700/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? 'bg-red-600 text-white'
                    : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                }`}
              >
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.text }}></p>
                <span className="text-xs opacity-70 mt-1 block">
                  {format(message.timestamp, 'HH:mm')}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start mt-2">
              <div className="bg-gray-800/80 rounded-lg px-3 py-1.5 max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-[#131722] rounded-b-xl">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Frag mich nach Liebefeld Events..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-gray-800 border-gray-700 focus:ring-red-500 focus:border-red-500 text-white"
            />
            <Button
              onClick={handleSend}
              className="bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-md"
              disabled={!input.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventChatBot;
