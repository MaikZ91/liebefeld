import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { TribeEvent, ChatMessage } from '@/types/tribe';
import { ArrowUp, X, Sparkles, Heart } from 'lucide-react';
import { useTypewriterPrompts } from '@/hooks/useTypewriterPrompts';
import { OnboardingStep } from '@/hooks/useOnboardingFlow';

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
  onEventClick?: (event: TribeEvent) => void;
  // Onboarding props
  onboardingStep?: OnboardingStep;
  onAdvanceOnboarding?: () => void;
  onInterestsSelected?: (interests: string[]) => void;
}

const INTEREST_OPTIONS = [
  { id: 'ausgehen', label: 'Ausgehen', emoji: '🍻' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'konzerte', label: 'Konzerte', emoji: '🎵' },
  { id: 'kreativität', label: 'Kreativität', emoji: '🎨' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
];

const ONBOARDING_MESSAGES: Record<OnboardingStep, { text: string; showNext?: boolean; showHeart?: boolean; showInterests?: boolean }> = {
  welcome: {
    text: 'Hey! 👋 Willkommen bei THE TRIBE! Ich bin MIA, deine persönliche Event-Assistentin.',
    showNext: true,
  },
  explain_app: {
    text: 'THE TRIBE verbindet dich mit echten Menschen in deiner Stadt. Hier findest du Events und eine Community, die deine Interessen teilt. Mein Job? Dir zu helfen, die perfekten Events zu finden und dich mit anderen zu connecten! 🎉',
    showNext: true,
  },
  select_interests: {
    text: 'Was interessiert dich? Wähl aus, was dir gefällt - so kann ich dir direkt passende Events zeigen! 🎯',
    showInterests: true,
  },
  explain_likes: {
    text: 'Jetzt zeig ich dir, wie ich dich besser kennenlerne: Wenn dir ein Event gefällt, klick einfach auf das Herz ❤️ Je mehr du likest, desto besser kann ich dir passende Events vorschlagen!',
    showHeart: true,
  },
  waiting_for_like: {
    text: 'Scroll durch die Events und like das erste, das dich anspricht! 👇',
  },
  // Community onboarding steps - handled in TribeCommunityBoard
  community_intro: { text: '' },
  explain_profile: { text: '' },
  waiting_for_avatar_click: { text: '' },
  editing_profile: { text: '' },
  greeting_ready: { text: '' },
  waiting_for_post: { text: '' },
  completed: {
    text: '',
  },
};

export const MiaInlineChat: React.FC<MiaInlineChatProps> = ({
  events,
  userProfile,
  city,
  onQuery,
  onEventsFiltered,
  onClearFilter,
  onEventClick,
  onboardingStep,
  onAdvanceOnboarding,
  onInterestsSelected,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ChatMessage | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<TribeEvent[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [onboardingMessageIndex, setOnboardingMessageIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Show onboarding messages automatically
  useEffect(() => {
    if (onboardingStep && onboardingStep !== 'completed') {
      const message = ONBOARDING_MESSAGES[onboardingStep];
      if (message.text) {
        setIsExpanded(true);
        // Typewriter effect for onboarding
        setIsTyping(true);
        setCurrentResponse(null);
        
        setTimeout(() => {
          setCurrentResponse({
            role: 'model',
            text: message.text,
          });
          setIsTyping(false);
        }, 800);
      }
    }
  }, [onboardingStep]);

  // Get event categories for personalized prompts
  const eventCategories = useMemo(() => {
    return [...new Set(events.map(e => e.category?.toLowerCase()).filter(Boolean))] as string[];
  }, [events]);

  // Typewriter hook for personalized prompts
  const { displayText, currentFullPrompt, pause, resume } = useTypewriterPrompts(
    userProfile,
    eventCategories,
    city
  );

  // Check for new events (created within last 7 days)
  const newEvents = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return events.filter(event => {
      if (!event.created_at) return false;
      const createdAt = new Date(event.created_at);
      return createdAt >= sevenDaysAgo;
    });
  }, [events]);

  // Generate personalized suggestions based on user profile and upcoming events
  const suggestions = useMemo(() => {
    const baseSuggestions: string[] = [];
    
    baseSuggestions.push("Was geht am Wochenende?");
    baseSuggestions.push("Mein perfekter Tag");
    baseSuggestions.push("Plane meinen Tag");
    
    if (userProfile?.interests?.length) {
      const interest = userProfile.interests[0];
      if (interest.toLowerCase().includes('party') || interest.toLowerCase().includes('ausgehen')) {
        baseSuggestions.push("Beste Parties heute");
      }
      if (interest.toLowerCase().includes('sport')) {
        baseSuggestions.push("Sport Events diese Woche");
      }
    }
    
    if (userProfile?.favorite_locations?.length) {
      const location = userProfile.favorite_locations[0];
      baseSuggestions.push(`Events in ${location}`);
    }
    
    const categories = new Set(events.map(e => e.category?.toLowerCase()).filter(Boolean));
    if (categories.has('comedy')) baseSuggestions.push("Comedy Shows");
    if (categories.has('konzert') || categories.has('concert')) baseSuggestions.push("Konzerte diese Woche");
    
    return [...new Set(baseSuggestions)].slice(0, 6);
  }, [userProfile, events]);

  const saveRecentQuery = (query: string) => {
    const recentQueries = JSON.parse(localStorage.getItem('mia_recent_queries') || '[]');
    const updated = [query, ...recentQueries.filter((q: string) => q !== query)].slice(0, 10);
    localStorage.setItem('mia_recent_queries', JSON.stringify(updated));
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;

    saveRecentQuery(textToSend);

    if (!customInput) setInput('');
    setIsExpanded(true);
    setIsTyping(true);
    setCurrentResponse(null);
    setRelatedEvents([]);

    if (onQuery) onQuery(textToSend);

    try {
      const response = await getTribeResponse(textToSend, events, userProfile, city);
      
      setCurrentResponse({
        role: 'model',
        text: response.text.replace(/\*\*/g, '').replace(/\*/g, ''),
      });
      
      setRelatedEvents(response.relatedEvents || []);
      
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

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setIsExpanded(true);
    pause();
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    if (!input) {
      resume();
    }
  };

  const handleTypewriterClick = () => {
    if (currentFullPrompt && !input) {
      handleSend(currentFullPrompt);
    }
  };

  const handleClear = () => {
    setCurrentResponse(null);
    setRelatedEvents([]);
    setIsExpanded(false);
    if (onClearFilter) onClearFilter();
  };

  const handleEventChipClick = (event: TribeEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      handleSend(`Erzähl mir mehr über "${event.title}"`);
    }
  };

  const handleOnboardingNext = () => {
    if (onAdvanceOnboarding) {
      onAdvanceOnboarding();
    }
  };

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleInterestsContinue = () => {
    if (selectedInterests.length > 0 && onInterestsSelected) {
      onInterestsSelected(selectedInterests);
    }
    if (onAdvanceOnboarding) {
      onAdvanceOnboarding();
    }
  };

  const isOnboarding = onboardingStep && onboardingStep !== 'completed';
  const currentOnboardingMessage = onboardingStep ? ONBOARDING_MESSAGES[onboardingStep] : null;

  return (
    <div className="relative">
      {/* MIA Response Area - Expandable with TRIBE highlight */}
      {isExpanded && (currentResponse || isTyping) && (
        <div 
          ref={responseRef}
          className="mb-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-gold/5 border border-gold/20 rounded-lg overflow-hidden animate-fadeIn shadow-[0_0_20px_rgba(212,175,55,0.1)]"
        >
          {/* Response Header - TRIBE branded */}
          <div className="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-black/60 to-gold/10 border-b border-gold/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-gold/50">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">MIA</span>
                <span className="text-[8px] bg-gradient-to-r from-gold to-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">TRIBE AI</span>
              </div>
              {!isOnboarding && relatedEvents.length > 0 && (
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider ml-2">
                  {relatedEvents.length} Events
                </span>
              )}
            </div>
            {!isOnboarding && (
              <button 
                onClick={handleClear}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
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
              <div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {currentResponse.text}
                </p>
                
                {/* Onboarding action buttons */}
                {isOnboarding && currentOnboardingMessage?.showNext && (
                  <button
                    onClick={handleOnboardingNext}
                    className="mt-4 px-4 py-2 bg-gold text-black text-sm font-semibold rounded-full hover:bg-gold/90 transition-all"
                  >
                    Weiter →
                  </button>
                )}

                {/* Interest selection during onboarding */}
                {isOnboarding && currentOnboardingMessage?.showInterests && (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((interest) => (
                        <button
                          key={interest.id}
                          onClick={() => handleInterestToggle(interest.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedInterests.includes(interest.id)
                              ? 'bg-gold text-black'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-gold/50'
                          }`}
                        >
                          {interest.emoji} {interest.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleInterestsContinue}
                      disabled={selectedInterests.length === 0}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                        selectedInterests.length > 0
                          ? 'bg-gold text-black hover:bg-gold/90'
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedInterests.length > 0 
                        ? `Weiter mit ${selectedInterests.length} Interesse${selectedInterests.length > 1 ? 'n' : ''} →`
                        : 'Wähl mindestens eins aus'
                      }
                    </button>
                  </div>
                )}
                
                {isOnboarding && currentOnboardingMessage?.showHeart && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      <span className="text-sm text-red-400">= Ich mag das!</span>
                    </div>
                    <button
                      onClick={handleOnboardingNext}
                      className="px-4 py-2 bg-gold text-black text-sm font-semibold rounded-full hover:bg-gold/90 transition-all"
                    >
                      Verstanden! →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Related Events as Inline Chips - hide during onboarding */}
          {!isOnboarding && relatedEvents.length > 0 && !isTyping && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Klick für Details
                </span>
                <button 
                  onClick={handleClear}
                  className="text-[10px] text-gold hover:text-gold/80 transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventChipClick(event)}
                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full hover:bg-gold/20 hover:border-gold/40 transition-all"
                  >
                    <Sparkles size={10} className="text-gold" />
                    <span className="text-xs text-gold truncate max-w-[150px]">
                      {event.title}
                    </span>
                    {event.matchScore && (
                      <span className="text-[9px] text-gold/60 font-bold">{event.matchScore}%</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Input Area - hide during active onboarding steps (but show during waiting_for_like) */}
      {(!isOnboarding || onboardingStep === 'waiting_for_like') && (
        <div className="space-y-3">
          {/* Search Bar with Typewriter */}
          <div className="relative flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
              <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
            </div>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value) pause();
                  else resume();
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder=""
                className="w-full bg-black border border-white/[0.08] focus:border-gold/50 text-white text-sm rounded-full py-2.5 px-4 pr-10 outline-none transition-all"
              />
              
              {/* Typewriter Overlay - clickable when no user input */}
              {!input && !isInputFocused && (
                <div 
                  onClick={handleTypewriterClick}
                  className="absolute inset-0 flex items-center px-4 cursor-pointer group"
                >
                  <span className="text-sm text-zinc-500 group-hover:text-gold transition-colors">
                    {displayText}
                    <span className="animate-pulse text-gold">|</span>
                  </span>
                </div>
              )}
              
              {/* Static placeholder when focused but empty */}
              {!input && isInputFocused && (
                <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                  <span className="text-sm text-zinc-600">Frag mich was...</span>
                </div>
              )}
              
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

          {/* Quick Suggestion Chips - only show when focused and not onboarding */}
          {isInputFocused && !isOnboarding && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-fadeIn">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 bg-zinc-900/50 border border-white/10 text-zinc-500 text-xs whitespace-nowrap rounded-full hover:border-gold/30 hover:text-gold transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
