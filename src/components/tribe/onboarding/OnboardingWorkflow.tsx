import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

// Background image - use dynamic URL for lazy loading
const nameBg = new URL('@/assets/onboarding/name-bg.png', import.meta.url).href;

interface CategoryOption {
  id: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'ausgehen', label: 'Ausgehen' },
  { id: 'party', label: 'Party' },
  { id: 'kreativitaet', label: 'Kreativität' },
  { id: 'sport', label: 'Sport' },
  { id: 'konzerte', label: 'Konzerte' },
  { id: 'kultur', label: 'Kultur' },
];

interface OnboardingWorkflowProps {
  onComplete: (data: { name: string; interests: string[]; firstAction: 'connect' | 'explore' }) => void;
}

export const OnboardingWorkflow: React.FC<OnboardingWorkflowProps> = ({ onComplete }) => {
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Show content immediately, preload background image
  useEffect(() => {
    // Content fades in immediately
    requestAnimationFrame(() => setContentVisible(true));
    
    // Background image loads in background
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = nameBg;
  }, []);

  const hasSelectedInterests = selectedInterests.size > 0;
  const canContinue = hasSelectedInterests && userName.trim().length > 0;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (canContinue) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(Array.from(selectedInterests)));
      localStorage.setItem('tribe_onboarding_completed', 'true');
      localStorage.setItem('tribe_seen_interests_dialog', 'true');
      
      // Initialize push notifications lazily after completion
      const selectedCity = localStorage.getItem('selectedCityName') || localStorage.getItem('selectedCityAbbr') || 'Bielefeld';
      import('@/services/firebaseMessaging').then(({ initializeFCM }) => {
        initializeFCM(selectedCity).catch(err => {
          console.log('FCM initialization skipped or failed:', err);
        });
      });
      
      onComplete({
        name: userName.trim(),
        interests: Array.from(selectedInterests),
        firstAction: 'explore'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Instant gradient placeholder - shows immediately */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1a30] to-[#1a0a0a]" />
      
      {/* Background image fades in after loading */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${nameBg})` }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content - uses CSS transitions instead of framer-motion */}
      <div
        className={`relative z-10 h-full flex flex-col items-center justify-center px-6 transition-opacity duration-150 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="w-full max-w-md text-center">
          {/* Tagline */}
          <p className="text-white/40 text-[10px] font-medium tracking-[0.4em] uppercase mb-6">
            Deine Community für echte Begegnungen
          </p>

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative w-10 h-10">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" className="fill-white" />
                <circle cx="12" cy="14" r="3" className="fill-black" />
              </svg>
            </div>
          </div>

          {/* Title - Modern sans-serif style */}
          <h1
            className="text-3xl font-light tracking-[0.35em] text-white mb-2 uppercase"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            THE TRIBE
          </h1>
          
          <p className="text-white/40 text-xs font-light tracking-widest mb-2">
            Personalisiere deine Experience
          </p>
          <p className="text-white/30 text-[10px] font-light tracking-wider mb-10 max-w-xs mx-auto">
            Wir zeigen dir nur passende Events – du kannst den Filter jederzeit aufheben
          </p>

          {/* Category Grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleInterest(cat.id)}
                className={`
                  py-3 px-4 text-[11px] font-medium tracking-[0.2em] uppercase
                  transition-all duration-200 ease-out rounded-sm
                  ${selectedInterests.has(cat.id)
                    ? 'bg-white text-black'
                    : 'bg-transparent border border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Name Input - CSS transition instead of AnimatePresence */}
          <div
            className={`overflow-hidden transition-all duration-200 ${hasSelectedInterests ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <p className="text-white/40 text-xs font-light tracking-widest mb-4">
              Wie sollen dich andere in der Community nennen?
            </p>

            <div className="mb-8">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Vorname oder Spitzname"
                className="w-full bg-transparent border-b border-white/20 py-3 text-center text-lg font-light text-white placeholder:text-white/25 focus:outline-none focus:border-white/50 transition-colors tracking-wide"
                autoFocus={hasSelectedInterests}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canContinue) {
                    handleSubmit();
                  }
                }}
              />
              <p className="text-white/25 text-[10px] font-light tracking-widest mt-3">
                Erscheint so in Chats und Events
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleSubmit}
            disabled={!canContinue}
            className={`
              flex items-center justify-center gap-3 w-full py-4 text-[11px] font-medium tracking-[0.25em] uppercase rounded-sm
              transition-all duration-200
              ${canContinue
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/5 text-white/25 cursor-not-allowed'
              }
            `}
          >
            Los geht's
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWorkflow;
