import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { ChatMessage, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { ArrowUp, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { personalizationService } from '@/services/personalizationService';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

interface TribeAIChatProps {
  onClose: () => void;
  events: TribeEvent[];
  onQuery?: (query: string) => void;
  userProfile?: UserProfileContext;
  city?: string;
}

// Smart Event Carousel Component
const EventCarousel: React.FC<{ events: TribeEvent[] }> = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const topEvent = events[0];
  const otherEvents = events.slice(1);
  const topMatchScore = topEvent ? personalizationService.calculateMatchScore(topEvent) : 0;

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const scrollAmount = index * (containerRef.current.offsetWidth * 0.85 + 12);
      containerRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
    setCurrentIndex(index);
  };

  if (events.length === 0) return null;

  // Single event - show full card
  if (events.length === 1) {
    return (
      <div className="mt-4 w-full">
        <TribeEventCard event={topEvent} variant="standard" matchScore={topMatchScore} />
      </div>
    );
  }

  return (
    <div className="mt-4 w-full space-y-3">
      {/* Top Pick - Featured Event */}
      <div className="relative">
        <div className="absolute -left-1 top-3 z-10">
          <div className="bg-gold text-black text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-r flex items-center gap-1">
            <Sparkles size={10} />
            Top Pick
          </div>
        </div>
        <TribeEventCard event={topEvent} variant="standard" matchScore={topMatchScore} />
      </div>

      {/* Other Events - Compact Horizontal Scroll */}
      {otherEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {otherEvents.length} weitere Vorschläge
            </span>
            {otherEvents.length > 2 && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
                  className="p-1 text-zinc-600 hover:text-white transition-colors"
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] text-zinc-600">{currentIndex + 1}/{otherEvents.length}</span>
                <button 
                  onClick={() => scrollToIndex(Math.min(otherEvents.length - 1, currentIndex + 1))}
                  className="p-1 text-zinc-600 hover:text-white transition-colors"
                  disabled={currentIndex === otherEvents.length - 1}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          
          {/* Horizontal scroll container */}
          <div 
            ref={containerRef}
            className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
            onScroll={(e) => {
              const container = e.currentTarget;
              const cardWidth = container.offsetWidth * 0.85 + 12;
              const newIndex = Math.round(container.scrollLeft / cardWidth);
              if (newIndex !== currentIndex) setCurrentIndex(newIndex);
            }}
          >
            {otherEvents.map((evt, idx) => {
              const matchScore = personalizationService.calculateMatchScore(evt);
              return (
                <div 
                  key={idx} 
                  className="flex-shrink-0 w-[85%] snap-start"
                >
                  <CompactEventCard event={evt} matchScore={matchScore} />
                </div>
              );
            })}
          </div>

          {/* Dots indicator */}
          {otherEvents.length > 1 && otherEvents.length <= 5 && (
            <div className="flex justify-center gap-1.5">
              {otherEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-gold w-4' : 'bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact Event Card for carousel
const CompactEventCard: React.FC<{ event: TribeEvent; matchScore: number }> = ({ event, matchScore }) => {
  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-lg overflow-hidden hover:border-gold/30 transition-all">
      <div className="flex gap-3 p-3">
        {/* Image */}
        {event.image_url && (
          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-white truncate">{event.title}</h4>
            <div className="flex-shrink-0 text-[10px] font-bold text-gold">{matchScore}%</div>
          </div>
          
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {event.date && new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {event.time && ` • ${event.time.substring(0, 5)}`}
          </div>
          
          {event.location && (
            <div className="text-[10px] text-zinc-600 mt-1 truncate">
              📍 {event.location}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick action bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/30 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{event.category}</span>
        </div>
        <a 
          href={event.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-gold hover:text-white transition-colors uppercase tracking-wider font-medium"
        >
          Details →
        </a>
      </div>
    </div>
  );
};

export const TribeAIChat: React.FC<TribeAIChatProps> = ({ onClose, events, onQuery, userProfile, city }) => {
  // Personalized greeting based on user profile
  const getGreeting = () => {
    if (userProfile?.username && !userProfile.username.startsWith('Guest_')) {
      const interest = userProfile.interests?.[0];
      const location = userProfile.favorite_locations?.[0];
      if (interest && location) {
        return `Hey ${userProfile.username}! Ich kenne deine Vorlieben für ${interest} und ${location}. Was suchst du heute?`;
      } else if (interest) {
        return `Hey ${userProfile.username}! Du stehst auf ${interest} - soll ich dir passende Events zeigen?`;
      }
      return `Hey ${userProfile.username}! Was kann ich heute für dich finden?`;
    }
    return "Hey! Ich bin MIA, deine Event-Concierge. Was suchst du heute?";
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: getGreeting() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);
    
    // Track query
    if (onQuery) onQuery(userText);
    
    const response = await getTribeResponse(userText, events, userProfile, city);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: response.text, relatedEvents: response.relatedEvents }]);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                 <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
             </div>
             <div>
                 <h2 className="font-bold text-sm uppercase tracking-widest">MIA</h2>
                 <p className="text-[10px] text-zinc-500 uppercase">Always Active</p>
             </div>
         </div>
         <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/20 mt-1">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
            )}
            <div className={`flex-1 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'text-white font-medium text-right bg-zinc-800/50 rounded-2xl rounded-tr-sm px-4 py-2' : 'text-zinc-300 text-left'}`}>
                  {msg.text}
              </div>
              {msg.relatedEvents && msg.relatedEvents.length > 0 && (
                <div className="w-full md:w-[90%]">
                  <EventCarousel events={msg.relatedEvents} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
              <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-zinc-600 uppercase tracking-widest">MIA denkt nach...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {["Was geht heute?", "Beste Parties", "Kulturelle Events"].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInput(suggestion);
              setTimeout(() => handleSend(), 100);
            }}
            className="px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-400 hover:text-white hover:border-gold/30 transition-all whitespace-nowrap"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10 bg-black">
        <div className="flex items-center gap-4 border-b border-white/20 pb-2 focus-within:border-gold transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none text-lg font-light"
              placeholder="Frag MIA..."
            />
            <button onClick={handleSend} disabled={!input.trim()} className="text-gold disabled:text-zinc-700 hover:opacity-80 transition-opacity">
                <ArrowUp size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};
