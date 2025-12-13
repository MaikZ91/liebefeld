import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { TribeEvent, ChatMessage } from '@/types/tribe';
import { ArrowUp, X, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { personalizationService } from '@/services/personalizationService';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

interface MiaInlineChatProps {
  events: TribeEvent[];
  userProfile?: UserProfileContext;
  city?: string;
  onQuery?: (query: string) => void;
  onEventsFiltered?: (filteredEventIds: string[]) => void;
  onClearFilter?: () => void;
}

export const MiaInlineChat: React.FC<MiaInlineChatProps> = ({
  events,
  userProfile,
  city,
  onQuery,
  onEventsFiltered,
  onClearFilter,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ChatMessage | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<TribeEvent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Personalized greeting
  const getGreeting = () => {
    if (userProfile?.username && !userProfile.username.startsWith('Guest_')) {
      return `Hey ${userProfile.username}! Was suchst du?`;
    }
    return "Hey! Was suchst du heute?";
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;

    if (!customInput) setInput('');
    setIsExpanded(true);
    setIsTyping(true);
    setCurrentResponse(null);
    setRelatedEvents([]);

    // Track query
    if (onQuery) onQuery(textToSend);

    try {
      const response = await getTribeResponse(textToSend, events, userProfile, city);
      
      setCurrentResponse({
        role: 'model',
        text: response.text.replace(/\*\*/g, '').replace(/\*/g, ''),
      });
      
      setRelatedEvents(response.relatedEvents || []);
      
      // Filter events in the main feed based on MIA's recommendations
      if (response.relatedEvents && response.relatedEvents.length > 0 && onEventsFiltered) {
        onEventsFiltered(response.relatedEvents.map(e => e.id));
      }
    } catch (error) {
      console.error('MIA error:', error);
      setCurrentResponse({
        role: 'model',
        text: 'Entschuldigung, da ist etwas schiefgelaufen.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setCurrentResponse(null);
    setRelatedEvents([]);
    setIsExpanded(false);
    if (onClearFilter) onClearFilter();
  };

  // Quick suggestions
  const suggestions = [
    "Was geht heute?",
    "Beste Parties",
    "Kultur Events",
    "Sport heute",
  ];

  return (
    <div className="relative">
      {/* MIA Response Area - Expandable */}
      {isExpanded && (currentResponse || isTyping) && (
        <div 
          ref={responseRef}
          className="mb-4 bg-zinc-900/80 border border-white/10 rounded-lg overflow-hidden animate-fadeIn"
        >
          {/* Response Header */}
          <div className="flex justify-between items-center px-4 py-2 bg-black/30 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest">MIA</span>
              {relatedEvents.length > 0 && (
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider ml-2">
                  {relatedEvents.length} Events gefiltert
                </span>
              )}
            </div>
            <button 
              onClick={handleClear}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Response Content */}
          <div className="p-4">
            {isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-zinc-600 uppercase tracking-widest">MIA denkt nach...</span>
              </div>
            ) : currentResponse && (
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentResponse.text}
              </p>
            )}
          </div>

          {/* Related Events Preview (if any) */}
          {relatedEvents.length > 0 && !isTyping && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  MIA Empfehlungen
                </span>
                <button 
                  onClick={handleClear}
                  className="text-[10px] text-gold hover:text-gold/80 transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {relatedEvents.slice(0, 5).map((event, idx) => (
                  <div 
                    key={event.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full"
                  >
                    <span className="text-xs text-gold truncate max-w-[150px] block">
                      {event.title}
                    </span>
                  </div>
                ))}
                {relatedEvents.length > 5 && (
                  <div className="flex-shrink-0 px-3 py-1.5 bg-zinc-800 rounded-full">
                    <span className="text-xs text-zinc-400">+{relatedEvents.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Input Area */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
            <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
          </div>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onFocus={() => setIsExpanded(true)}
              placeholder={getGreeting()}
              className="w-full bg-black border border-white/[0.08] focus:border-gold/50 text-white text-sm placeholder-zinc-600 rounded-full py-2.5 px-4 pr-10 outline-none transition-all"
            />
            {input.trim() && (
              <button
                onClick={() => handleSend()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold hover:text-gold/80 transition-colors"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="px-3 py-1.5 bg-zinc-900/50 border border-white/10 text-zinc-500 text-xs whitespace-nowrap rounded-full hover:border-gold/30 hover:text-gold transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};