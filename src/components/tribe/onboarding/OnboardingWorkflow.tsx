import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Import tribe reel images
import reel1 from '@/assets/tribe/reel-1.jpg';
import reel2 from '@/assets/tribe/reel-2.jpg';
import reel3 from '@/assets/tribe/reel-3.jpg';
import reel4 from '@/assets/tribe/reel-4.jpg';
import reel5 from '@/assets/tribe/reel-5.jpg';
import reel6 from '@/assets/tribe/reel-6.jpg';

const COLLAGE_IMAGES = [reel1, reel2, reel3, reel4, reel5, reel6];

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

type OnboardingStep = 
  | 'interests'
  | 'welcome'
  | 'name-input'
  | 'final-choice'
  | 'complete';

interface OnboardingWorkflowProps {
  onComplete: (data: { name: string; interests: string[]; firstAction: 'connect' | 'explore' }) => void;
}

export const OnboardingWorkflow: React.FC<OnboardingWorkflowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('interests');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % COLLAGE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance welcome after 3s
  useEffect(() => {
    if (step === 'welcome') {
      const timer = setTimeout(() => setStep('name-input'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInterestsContinue = () => {
    if (selectedInterests.size > 0) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(Array.from(selectedInterests)));
      setStep('welcome');
    }
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setStep('final-choice');
    }
  };

  const handleFinalChoice = (choice: 'connect' | 'explore') => {
    localStorage.setItem('tribe_onboarding_completed', 'true');
    localStorage.setItem('tribe_seen_interests_dialog', 'true');
    onComplete({
      name: userName.trim() || `Guest_${Date.now().toString().slice(-4)}`,
      interests: Array.from(selectedInterests),
      firstAction: choice
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Subtle background image with slow crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img 
            src={COLLAGE_IMAGES[currentImageIndex]} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

      <AnimatePresence mode="wait">
        {/* STEP 1: Interests Selection - IONNYK Style */}
        {step === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-center mb-16"
            >
              <h1 className="font-serif text-4xl md:text-6xl font-light text-white tracking-wide mb-4">
                Deine
              </h1>
              <h1 className="font-serif text-4xl md:text-6xl font-light text-white tracking-wide">
                Interessen
              </h1>
            </motion.div>

            {/* Category Grid - Minimal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 gap-4 mb-16 w-full max-w-sm"
            >
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                  onClick={() => toggleInterest(cat.id)}
                  className={`
                    font-serif py-4 px-6 text-sm tracking-[0.2em] uppercase
                    transition-all duration-500 ease-out
                    ${selectedInterests.has(cat.id)
                      ? 'bg-white text-black'
                      : 'bg-transparent border border-white/20 text-white/70 hover:border-white/50 hover:text-white'
                    }
                  `}
                >
                  {cat.label}
                </motion.button>
              ))}
            </motion.div>

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
              onClick={handleInterestsContinue}
              disabled={selectedInterests.size === 0}
              className={`
                font-serif flex items-center gap-3 px-8 py-4 text-sm tracking-[0.3em] uppercase
                transition-all duration-500
                ${selectedInterests.size > 0
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              Weiter
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* STEP 2: Welcome Screen */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-center"
            >
              <h1 className="font-serif text-5xl md:text-7xl font-light text-white tracking-wider mb-8">
                THE TRIBE
              </h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="font-serif text-lg md:text-xl text-white/60 font-light tracking-wide max-w-md"
              >
                Die Community für echte Begegnungen
              </motion.p>
            </motion.div>

            {/* Subtle loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-16"
            >
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 1, delay: 2 }}
                className="h-[1px] bg-white/40 w-32"
              />
            </motion.div>
          </motion.div>
        )}

        {/* STEP 3: Name Input */}
        {step === 'name-input' && (
          <motion.div
            key="name-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-center w-full max-w-md"
            >
              {/* Title */}
              <h1 className="font-serif text-3xl md:text-5xl font-light text-white tracking-wide mb-4">
                Wie heißt du?
              </h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-serif text-white/40 text-sm tracking-wider mb-12"
              >
                Dein Name erscheint in der Community
              </motion.p>

              {/* Input Field - Minimal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-12"
              >
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Dein Name"
                  className="font-serif w-full bg-transparent border-b border-white/20 py-4 text-center text-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/60 transition-colors tracking-wide"
                  autoFocus
                />
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleNameSubmit}
                disabled={!userName.trim()}
                className={`
                  font-serif flex items-center justify-center gap-3 w-full py-4 text-sm tracking-[0.3em] uppercase
                  transition-all duration-500
                  ${userName.trim()
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }
                `}
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Skip option */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                onClick={() => setStep('final-choice')}
                className="font-serif mt-8 text-white/30 text-xs tracking-[0.2em] uppercase hover:text-white/60 transition-colors"
              >
                Als Gast fortfahren
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 4: Final Choice */}
        {step === 'final-choice' && (
          <motion.div
            key="final-choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-center w-full max-w-md"
            >
              {/* Greeting */}
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white tracking-wide mb-4">
                {userName ? `Hallo, ${userName}` : 'Willkommen'}
              </h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-serif text-white/40 text-lg tracking-wider mb-16"
              >
                Was möchtest du tun?
              </motion.p>

              {/* Choice Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col gap-4"
              >
                <button
                  onClick={() => handleFinalChoice('connect')}
                  className="font-serif w-full py-5 border border-white/20 text-white text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-500"
                >
                  Community entdecken
                </button>

                <button
                  onClick={() => handleFinalChoice('explore')}
                  className="font-serif w-full py-5 bg-white text-black text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition-all duration-500"
                >
                  Events finden
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator - subtle dots at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
        {['interests', 'welcome', 'name-input', 'final-choice'].map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              step === s ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingWorkflow;
