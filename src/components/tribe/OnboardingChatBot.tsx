import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/types/tribe';
import { supabase } from '@/integrations/supabase/client';
import { Send, Clock, Users, Plus, ChevronRight } from 'lucide-react';
import { personalizationService } from '@/services/personalizationService';

interface OnboardingChatBotProps {
  onComplete: (profile: UserProfile, destination: 'explore' | 'community') => void;
}

type OnboardingStep = 'welcome' | 'interests' | 'name' | 'ready';

interface ChatMessage {
  id: string;
  sender: 'mia' | 'user';
  content: string;
  buttons?: { label: string; value: string }[];
  interestPicker?: boolean;
}

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

const INTERESTS = [
  { id: 'ausgehen', label: 'AUSGEHEN', emoji: '🍻', categories: ['Ausgehen', 'Bar', 'Club', 'Nightlife'] },
  { id: 'party', label: 'PARTY', emoji: '🎉', categories: ['Party', 'Feiern', 'Festival'] },
  { id: 'konzerte', label: 'KONZERTE', emoji: '🎵', categories: ['Konzert', 'Musik', 'Live'] },
  { id: 'kreativitaet', label: 'KREATIVITÄT', emoji: '🎨', categories: ['Kreativität', 'Kunst', 'Art', 'Workshop', 'Kultur'] },
  { id: 'sport', label: 'SPORT', emoji: '⚽', categories: ['Sport', 'Hochschulsport', 'Fitness', 'Outdoor'] },
];

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
];

export const OnboardingChatBot: React.FC<OnboardingChatBotProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [username, setUsername] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const progress = step === 'welcome' ? 20 : step === 'interests' ? 60 : step === 'name' ? 80 : 100;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      addMiaMessage(
        "Hallo, ich bin MIA! 👋 Ich helfe dir dabei, hier im Tribe anzukommen. Wir wollen Menschen wieder öfter im echten Leben zusammenbringen – weg vom Smartphone, hin zu echten Erlebnissen. Bist du dabei? 😊",
        [{ label: "Ja, gerne!", value: "yes" }]
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const addMiaMessage = (content: string, buttons?: { label: string; value: string }[], interestPicker?: boolean) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'mia',
        content,
        buttons,
        interestPicker
      }]);
    }, 800);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      content
    }]);
  };

  const handleButtonClick = (value: string) => {
    if (step === 'welcome' && value === 'yes') {
      addUserMessage("Ja, gerne!");
      setStep('interests');
      setTimeout(() => {
        addMiaMessage(
          "Super! Ob Sport, Party oder Kunst. Keine oberflächlichen Likes, sondern echte Begegnungen! 🤝✨\n\nWas begeistert dich? Wähl deine Interessen – so finde ich Events, bei denen du Gleichgesinnte triffst! 🎯",
          undefined,
          true
        );
      }, 500);
    }
  };

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleInterestsContinue = () => {
    if (selectedInterests.size === 0) return;
    
    const selectedLabels = Array.from(selectedInterests)
      .map(id => INTERESTS.find(i => i.id === id)?.label)
      .filter(Boolean)
      .join(', ');
    
    addUserMessage(selectedLabels);
    setStep('name');
    
    setTimeout(() => {
      addMiaMessage(
        "Das klingt nach einer Menge Spaß – genau solche echten Erlebnisse teilen wir am liebsten offline im Tribe! ✨ Wie heißt du eigentlich?"
      );
    }, 500);
  };

  const handleNameSubmit = () => {
    if (!inputValue.trim()) return;
    
    const name = inputValue.trim();
    setUsername(name);
    addUserMessage(`Ich bin ${name}`);
    setInputValue('');
    setStep('ready');
    
    setTimeout(() => {
      addMiaMessage(
        `Schön, dass du da bist, ${name}! ✨ Ich freue mich riesig darauf, mit dir gemeinsam echte Momente und Begegnungen im echten Leben zu schaffen. 🤝`
      );
    }, 500);
  };

  const handleDestinationSelect = async (destination: 'explore' | 'community' | 'create') => {
    // Save profile
    const avatarUrl = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    const interestLabels = Array.from(selectedInterests);
    
    // Save interests to preferred categories for personalization
    localStorage.setItem('tribe_preferred_categories', JSON.stringify(interestLabels));

    const profile: UserProfile = {
      username: username || `Guest_${Date.now().toString().slice(-4)}`,
      avatarUrl,
      bio: 'New Member',
      homebase: 'Bielefeld',
      interests: interestLabels
    };

    // Save to localStorage
    localStorage.setItem('tribe_user_profile', JSON.stringify(profile));
    localStorage.setItem('tribe_welcome_completed', 'true');
    localStorage.setItem('tribe_preferred_categories', JSON.stringify(interestLabels));
    localStorage.setItem('chat_username', profile.username);
    localStorage.setItem('chat_avatar', avatarUrl);

    // Save to database
    try {
      await supabase
        .from('user_profiles')
        .upsert({
          username: profile.username,
          avatar: profile.avatarUrl,
          interests: profile.interests,
          favorite_locations: ['Bielefeld']
        }, { onConflict: 'username' });
    } catch (error) {
      console.error('Error saving profile:', error);
    }

    window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));
    
    if (destination === 'create') {
      onComplete(profile, 'explore');
    } else {
      onComplete(profile, destination);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* App Header */}
      <header className="flex-shrink-0 bg-black/90 backdrop-blur-md border-b border-white/5">
        <div className="px-6 py-4 flex justify-between items-center">
          {/* THE TRIBE LOGO */}
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" className="fill-white" />
                <circle cx="12" cy="14" r="3" className="fill-black" />
              </svg>
            </div>
            <span className="text-sm font-extrabold tracking-[0.25em] text-white">THE TRIBE</span>
          </div>

          {/* City indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/70">BIELEFELD</span>
          </div>
        </div>
      </header>

      {/* Onboarding Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs">🎯</span>
          </div>
          <span className="text-xs font-medium tracking-widest text-primary uppercase">Onboarding</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          WILLKOMMEN BEI<br />
          <span className="border-b-2 border-primary pb-1">THE TRIBE</span>
        </h1>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>FORTSCHRITT</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'mia' && (
              <img 
                src={MIA_AVATAR} 
                alt="MIA" 
                className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
              />
            )}
            <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-first mr-3' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.sender === 'user' 
                  ? 'bg-foreground text-background rounded-br-md' 
                  : 'bg-card border border-border rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
              
              {/* Buttons */}
              {msg.buttons && (
                <div className="mt-3 space-y-2">
                  {msg.buttons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => handleButtonClick(btn.value)}
                      className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Interest Picker */}
              {msg.interestPicker && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest.id}
                        onClick={() => handleInterestToggle(interest.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                          selectedInterests.has(interest.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{interest.emoji}</span>
                        <span>{interest.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleInterestsContinue}
                    disabled={selectedInterests.size === 0}
                    className={`w-full py-3 px-4 font-medium rounded-xl transition-colors ${
                      selectedInterests.size > 0
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    WEITER
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start">
            <img 
              src={MIA_AVATAR} 
              alt="MIA" 
              className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
            />
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Ready screen - destination choices */}
        {step === 'ready' && messages.length > 0 && !isTyping && (
          <div className="pt-4 space-y-4">
            {/* User avatar initial */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                ALLES BEREIT,<br />
                <span className="text-primary border-b-2 border-primary">{username.toUpperCase()}</span>!
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Deine Interessen sind gespeichert. Was möchtest du als Erstes tun?
              </p>
            </div>
            
            {/* Destination options */}
            <div className="space-y-3 mt-6">
              <button
                onClick={() => handleDestinationSelect('explore')}
                className="w-full flex items-center gap-4 p-4 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">EVENTS ENTDECKEN</div>
                  <div className="text-xs opacity-70">IN DEINER NÄHE</div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleDestinationSelect('community')}
                className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">COMMUNITY VERBINDEN</div>
                  <div className="text-xs text-primary">GLEICHGESINNTE FINDEN</div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleDestinationSelect('create')}
                className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors opacity-60"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-muted-foreground">EVENT STARTEN</div>
                  <div className="text-xs text-muted-foreground">EIGENEN TRIBE GRÜNDEN</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Interest tags */}
            <div className="flex justify-center gap-2 pt-4">
              {Array.from(selectedInterests).map(id => {
                const interest = INTERESTS.find(i => i.id === id);
                return interest ? (
                  <span key={id} className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    #{interest.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - only show for name step */}
      {step === 'name' && !isTyping && messages.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          <div className="flex items-center gap-3 bg-card border border-border rounded-full px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              <img 
                src={AVATAR_OPTIONS[0]} 
                alt="You" 
                className="w-full h-full object-cover opacity-50"
              />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Wie heißt du?"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleNameSubmit}
              disabled={!inputValue.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                inputValue.trim() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingChatBot;
