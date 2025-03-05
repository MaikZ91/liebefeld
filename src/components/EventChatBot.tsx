
import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isWithinInterval, startOfWeekend, endOfWeekend, addDays, isToday, isTomorrow, isThisWeek, isThisWeekend, isNextWeek, isNextWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
import { MessageCircle, Send, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { type Event } from './EventCalendar';

interface ChatBotProps {
  events: Event[];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const EventChatBot: React.FC<ChatBotProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hallo! Ich bin dein Event-Assistent. Du kannst mich fragen, was heute oder am Wochenende los ist. Zum Beispiel: "Was geht am Wochenende?" oder "Welche Events gibt es morgen?"',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Process the query and respond
    setTimeout(() => {
      const botResponse = generateResponse(input, events);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 700); // Simulate thinking time
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed right-4 bottom-4 rounded-full w-12 h-12 shadow-lg bg-red-600 hover:bg-red-700"
          aria-label="Event Chat"
        >
          <MessageCircle />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0 rounded-xl bg-[#1A1D2D] text-white border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#131722] rounded-t-xl">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-red-500" />
            <h3 className="font-semibold">Event-Assistent</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {format(message.timestamp, 'HH:mm')}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
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
              placeholder="Frag mich etwas zu den Events..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-gray-800 border-gray-700 focus:ring-red-500 focus:border-red-500 text-white"
            />
            <Button
              onClick={handleSend}
              className="bg-red-600 hover:bg-red-700"
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

// Function to generate responses based on user queries
const generateResponse = (query: string, events: Event[]): string => {
  const normalizedQuery = query.toLowerCase();
  const today = new Date();
  
  // Helper function to format events
  const formatEvents = (filteredEvents: Event[]): string => {
    if (filteredEvents.length === 0) {
      return "Leider sind keine Veranstaltungen für diesen Zeitraum geplant.";
    }

    return filteredEvents
      .slice(0, 5) // Limit to 5 events to avoid too long responses
      .map((event) => {
        const date = parseISO(event.date);
        const formattedDate = format(date, 'dd.MM. (EEEE)', { locale: de });
        return `- ${event.title} am ${formattedDate} um ${event.time} Uhr in ${event.location || 'k.A.'}`;
      })
      .join("\n\n") + (filteredEvents.length > 5 ? `\n\nUnd ${filteredEvents.length - 5} weitere Events...` : "");
  };

  // Check for today's events
  if (normalizedQuery.includes('heute') || normalizedQuery.includes('today')) {
    const todayEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isToday(eventDate);
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    return `Heute (${format(today, 'dd.MM.', { locale: de })}) gibt es folgende Events:\n\n${formatEvents(todayEvents)}`;
  }
  
  // Check for tomorrow's events
  if (normalizedQuery.includes('morgen') || normalizedQuery.includes('tomorrow')) {
    const tomorrowEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isTomorrow(eventDate);
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    return `Morgen (${format(addDays(today, 1), 'dd.MM.', { locale: de })}) gibt es folgende Events:\n\n${formatEvents(tomorrowEvents)}`;
  }
  
  // Check for weekend events
  if (normalizedQuery.includes('wochenende') || normalizedQuery.includes('weekend')) {
    // Check if asking about this weekend or next weekend
    const isNextWeekendQuery = normalizedQuery.includes('nächstes') || normalizedQuery.includes('nächste') || normalizedQuery.includes('kommende');
    
    const startOfCurrentWeekend = startOfWeekend(today);
    const endOfCurrentWeekend = endOfWeekend(today);
    
    const startOfNextWeekend = startOfWeekend(addDays(today, 7));
    const endOfNextWeekend = endOfWeekend(addDays(today, 7));
    
    const weekendStart = isNextWeekendQuery ? startOfNextWeekend : startOfCurrentWeekend;
    const weekendEnd = isNextWeekendQuery ? endOfNextWeekend : endOfCurrentWeekend;
    
    const weekendEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isWithinInterval(eventDate, { start: weekendStart, end: weekendEnd });
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    
    const weekendLabel = isNextWeekendQuery ? 'nächsten' : 'diesen';
    return `Am ${weekendLabel} Wochenende (${format(weekendStart, 'dd.MM.', { locale: de })} - ${format(weekendEnd, 'dd.MM.', { locale: de })}) gibt es folgende Events:\n\n${formatEvents(weekendEvents)}`;
  }
  
  // Check for this week events
  if (normalizedQuery.includes('diese woche') || normalizedQuery.includes('this week')) {
    const thisWeekEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isThisWeek(eventDate);
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    return `Diese Woche gibt es folgende Events:\n\n${formatEvents(thisWeekEvents)}`;
  }
  
  // Check for next week events
  if (normalizedQuery.includes('nächste woche') || normalizedQuery.includes('next week')) {
    const nextWeekEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isNextWeek(eventDate);
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    return `Nächste Woche gibt es folgende Events:\n\n${formatEvents(nextWeekEvents)}`;
  }
  
  // Check for events by category
  const categories = ['konzert', 'party', 'ausstellung', 'sport', 'workshop', 'kultur'];
  for (const category of categories) {
    if (normalizedQuery.includes(category)) {
      const categoryEvents = events.filter(event => 
        event.category.toLowerCase() === category || 
        event.title.toLowerCase().includes(category)
      );
      return `${category.charAt(0).toUpperCase() + category.slice(1)}-Events:\n\n${formatEvents(categoryEvents)}`;
    }
  }
  
  // Default response for unrecognized queries
  return "Ich verstehe deine Frage leider nicht ganz. Du kannst mich zum Beispiel fragen: 'Was geht heute?', 'Was ist am Wochenende los?' oder 'Welche Events gibt es nächste Woche?'";
};

export default EventChatBot;
