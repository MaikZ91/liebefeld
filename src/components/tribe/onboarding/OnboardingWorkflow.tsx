import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import nameBg from '@/assets/onboarding/name-bg.png';
import { initializeFCM } from '@/services/firebaseMessaging';

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
      
      // Initialize push notifications only after user registers with a real name
      const selectedCity = localStorage.getItem('selectedCityName') || localStorage.getItem('selectedCityAbbr') || 'Bielefeld';
      initializeFCM(selectedCity).catch(err => {
        console.log('FCM initialization skipped or failed:', err);
      });
      
      onComplete({
        name: userName.trim(),
        interests: Array.from(selectedInterests),
        firstAction: 'explore'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${nameBg})` }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6"
      >
        <div className="w-full max-w-md text-center">
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/40 text-[10px] font-medium tracking-[0.4em] uppercase mb-6"
          >
            Deine Community für echte Begegnungen
          </motion.p>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex justify-center mb-4"
          >
            <div className="relative w-10 h-10">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" className="fill-white" />
                <circle cx="12" cy="14" r="3" className="fill-black" />
              </svg>
            </div>
          </motion.div>

          {/* Title - Modern sans-serif style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl font-light tracking-[0.35em] text-white mb-2 uppercase"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            THE TRIBE
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/40 text-xs font-light tracking-widest mb-10"
          >
            Personalisiere deine Experience
          </motion.p>

          {/* Category Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 gap-3 mb-10"
          >
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                onClick={() => toggleInterest(cat.id)}
                className={`
                  py-3 px-4 text-[11px] font-medium tracking-[0.2em] uppercase
                  transition-all duration-300 ease-out rounded-sm
                  ${selectedInterests.has(cat.id)
                    ? 'bg-white text-black'
                    : 'bg-transparent border border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                  }
                `}
              >
                {cat.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Name Input - Only shows when interests are selected */}
          <AnimatePresence>
            {hasSelectedInterests && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/40 text-xs font-light tracking-widest mb-4"
                >
                  Wie sollen dich andere in der Community nennen?
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Vorname oder Spitzname"
                    className="w-full bg-transparent border-b border-white/20 py-3 text-center text-lg font-light text-white placeholder:text-white/25 focus:outline-none focus:border-white/50 transition-colors tracking-wide"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinue) {
                        handleSubmit();
                      }
                    }}
                  />
                  <p className="text-white/25 text-[10px] font-light tracking-widest mt-3">
                    Erscheint so in Chats und Events
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            onClick={handleSubmit}
            disabled={!canContinue}
            className={`
              flex items-center justify-center gap-3 w-full py-4 text-[11px] font-medium tracking-[0.25em] uppercase rounded-sm
              transition-all duration-300
              ${canContinue
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/5 text-white/25 cursor-not-allowed'
              }
            `}
          >
            Los geht's
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWorkflow;
