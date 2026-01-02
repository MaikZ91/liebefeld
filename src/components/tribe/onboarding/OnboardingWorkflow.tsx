import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import nameBg from '@/assets/onboarding/name-bg.png';

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
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-4xl font-light text-white tracking-wide mb-2"
          >
            THE TRIBE
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-serif text-white/50 text-sm tracking-wider mb-10"
          >
            Wähle deine Interessen
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
                  font-serif py-3 px-4 text-xs tracking-[0.15em] uppercase
                  transition-all duration-300 ease-out
                  ${selectedInterests.has(cat.id)
                    ? 'bg-white text-black'
                    : 'bg-transparent border border-white/25 text-white/70 hover:border-white/50 hover:text-white'
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
                  className="font-serif text-white/40 text-xs tracking-wider mb-4"
                >
                  Wie heißt du?
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
                    placeholder="Dein Name"
                    className="font-serif w-full bg-transparent border-b border-white/25 py-3 text-center text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/60 transition-colors tracking-wide"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinue) {
                        handleSubmit();
                      }
                    }}
                  />
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
              font-serif flex items-center justify-center gap-3 w-full py-4 text-sm tracking-[0.2em] uppercase
              transition-all duration-400
              ${canContinue
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
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
