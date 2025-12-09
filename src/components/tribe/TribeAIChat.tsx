import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { ChatMessage, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { ArrowUp, X, Sparkles } from 'lucide-react';
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

// Event Chip Component - clickable inline event reference
const EventChip: React.FC<{ 
  event: TribeEvent; 
  onEventClick: (event: TribeEvent) => void;
}> = ({ event, onEventClick }) => {
  return (
    <button
      onClick={() => onEventClick(event)}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded-full text-gold text-xs font-medium transition-all mx-0.5 align-baseline"
    >
      <span className="truncate max-w-[120px]">{event.title}</span>
      <span className="text-[10px] opacity-70">→</span>
    </button>
  );
};

// Parse message text and replace event references with chips
const MessageWithEventChips: React.FC<{
  text: string;
  events: TribeEvent[];
  onEventClick: (event: TribeEvent) => void;
}> = ({ text, events, onEventClick }) => {
  // Clean markdown formatting (remove ** and other markdown)
  const cleanText = text
    .replace(/\*\*/g, '')  // Remove bold markers
    .replace(/\*/g, '')    // Remove italic markers
    .replace(/__/g, '')    // Remove underline markers
    .replace(/~~~/g, '')   // Remove strikethrough
    .replace(/`/g, '');    // Remove code markers
  
  // Try to find event titles in the text and replace them with chips
  let segments: (string | React.ReactNode)[] = [cleanText];
  
  events.forEach((event, idx) => {
    const newSegments: (string | React.ReactNode)[] = [];
    
    segments.forEach((segment) => {
      if (typeof segment !== 'string') {
        newSegments.push(segment);
        return;
      }
      
      // Look for event title in text (case-insensitive)
      const lowerSegment = segment.toLowerCase();
      const lowerTitle = event.title.toLowerCase();
      const index = lowerSegment.indexOf(lowerTitle);
      
      if (index !== -1) {
        // Split and insert chip
        if (index > 0) {
          newSegments.push(segment.substring(0, index));
        }
        newSegments.push(
          <EventChip key={`${event.id}-${idx}`} event={event} onEventClick={onEventClick} />
        );
        if (index + event.title.length < segment.length) {
          newSegments.push(segment.substring(index + event.title.length));
        }
      } else {
        newSegments.push(segment);
      }
    });
    
    segments = newSegments;
  });
  
  return <>{segments}</>;
};

// Smart Event Carousel Component
const EventCarousel: React.FC<{ events: TribeEvent[]; onEventClick?: (event: TribeEvent) => void }> = ({ events, onEventClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const topEvent = events[0];
  const otherEvents = events.slice(1);
  const topMatchScore = topEvent ? personalizationService.calculateMatchScore(topEvent) : 0;

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
    <div className="mt-4 space-y-3 max-w-full">
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

      {/* Other Events - Stacked vertically */}
      {otherEvents.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest px-1">
            {otherEvents.length} weitere Vorschläge
          </span>
          
          {/* Show max 2 other events stacked */}
          <div className="space-y-2">
            {otherEvents.slice(0, isExpanded ? otherEvents.length : 2).map((evt, idx) => {
              const matchScore = personalizationService.calculateMatchScore(evt);
              return <CompactEventCard key={idx} event={evt} matchScore={matchScore} onEventClick={onEventClick} />;
            })}
          </div>

          {/* Show more button */}
          {otherEvents.length > 2 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest transition-colors"
            >
              {isExpanded ? 'Weniger anzeigen' : `+${otherEvents.length - 2} weitere anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Compact Event Card for carousel
const CompactEventCard: React.FC<{ event: TribeEvent; matchScore: number; onEventClick?: (event: TribeEvent) => void }> = ({ event, matchScore, onEventClick }) => {
  return (
    <div 
      className="bg-zinc-900/80 border border-white/10 rounded-lg overflow-hidden hover:border-gold/30 transition-all cursor-pointer"
      onClick={() => onEventClick?.(event)}
    >
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
        <span className="text-[10px] text-gold uppercase tracking-wider font-medium">
          Details →
        </span>
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

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;
    
    if (!customInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsTyping(true);
    
    // Track query
    if (onQuery) onQuery(textToSend);
    
    const response = await getTribeResponse(textToSend, events, userProfile, city);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: response.text, relatedEvents: response.relatedEvents }]);
  };

  // Handle event chip click - ask MIA about specific event
  const handleEventClick = (event: TribeEvent) => {
    const query = `Erzähl mir mehr über "${event.title}"`;
    handleSend(query);
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
                {msg.role === 'model' && msg.relatedEvents && msg.relatedEvents.length > 0 ? (
                  <MessageWithEventChips 
                    text={msg.text} 
                    events={msg.relatedEvents} 
                    onEventClick={handleEventClick}
                  />
                ) : (
                  // Clean markdown for messages without events too
                  msg.text.replace(/\*\*/g, '').replace(/\*/g, '')
                )}
              </div>
              {msg.relatedEvents && msg.relatedEvents.length > 0 && (
                <div className="w-full max-w-full overflow-hidden">
                  <EventCarousel events={msg.relatedEvents} onEventClick={handleEventClick} />
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
            onClick={() => handleSend(suggestion)}
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
            <button onClick={() => handleSend()} disabled={!input.trim()} className="text-gold disabled:text-zinc-700 hover:opacity-80 transition-opacity">
                <ArrowUp size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};