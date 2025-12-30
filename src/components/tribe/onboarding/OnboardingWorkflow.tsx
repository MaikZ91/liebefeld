import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Users, Calendar, MessageCircle, ChevronRight, Zap } from 'lucide-react';

// Import tribe reel images
import reel1 from '@/assets/tribe/reel-1.jpg';
import reel2 from '@/assets/tribe/reel-2.jpg';
import reel3 from '@/assets/tribe/reel-3.jpg';
import reel4 from '@/assets/tribe/reel-4.jpg';
import reel5 from '@/assets/tribe/reel-5.jpg';
import reel6 from '@/assets/tribe/reel-6.jpg';
import reel7 from '@/assets/tribe/reel-7.jpg';
import reel8 from '@/assets/tribe/reel-8.jpg';
import reel9 from '@/assets/tribe/reel-9.jpg';
import reel10 from '@/assets/tribe/reel-10.jpg';
import reel11 from '@/assets/tribe/reel-11.jpg';
import reel12 from '@/assets/tribe/reel-12.jpg';

const COLLAGE_IMAGES = [reel1, reel2, reel3, reel4, reel5, reel6, reel7, reel8, reel9, reel10, reel11, reel12];

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'ausgehen', label: 'Ausgehen', emoji: '🎉' },
  { id: 'party', label: 'Party', emoji: '🪩' },
  { id: 'kreativitaet', label: 'Kreativität', emoji: '🎨' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
  { id: 'konzerte', label: 'Konzerte', emoji: '🎵' },
  { id: 'kultur', label: 'Kultur', emoji: '🎭' },
];

type OnboardingStep = 
  | 'welcome'
  | 'explore-tour'
  | 'mia-intro'
  | 'vybe-preview'
  | 'interests'
  | 'community-tour'
  | 'name-input'
  | 'final-choice'
  | 'complete';

interface OnboardingWorkflowProps {
  onComplete: (data: { name: string; interests: string[]; firstAction: 'connect' | 'explore' }) => void;
}

export const OnboardingWorkflow: React.FC<OnboardingWorkflowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState('');
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance welcome after 3.5s
  useEffect(() => {
    if (step === 'welcome') {
      const timer = setTimeout(() => setStep('explore-tour'), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance explore tour after 4s
  useEffect(() => {
    if (step === 'explore-tour') {
      const timer = setTimeout(() => setStep('mia-intro'), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance MIA intro after 3.5s
  useEffect(() => {
    if (step === 'mia-intro') {
      const timer = setTimeout(() => setStep('vybe-preview'), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance Vybe preview after 3s
  useEffect(() => {
    if (step === 'vybe-preview') {
      const timer = setTimeout(() => setStep('interests'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Typewriter effect for community tour
  useEffect(() => {
    if (step === 'community-tour') {
      const text = "Tausche dich mit der Community aus...";
      let index = 0;
      setTypedText('');
      const interval = setInterval(() => {
        if (index < text.length) {
          setTypedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStep('name-input'), 2000);
        }
      }, 50);
      return () => clearInterval(interval);
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
      setStep('community-tour');
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
    <div className="fixed inset-0 z-[100] bg-black">
      <AnimatePresence mode="wait">
        {/* STEP 1: Welcome Screen */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Animated Collage Background */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 opacity-30">
              {COLLAGE_IMAGES.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="relative overflow-hidden"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="relative z-10 text-center px-8"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
                  THE TRIBE
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="text-xl md:text-2xl text-white/80 font-light"
              >
                Die Community für echte Begegnungen
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.5 }}
                className="mt-12 flex justify-center"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-gold"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 2: Explore Tour - Simulated App Preview */}
        {step === 'explore-tour' && (
          <motion.div
            key="explore-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          >
            {/* Simulated Header */}
            <div className="h-14 border-b border-border flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">EXPLORE</span>
            </div>

            {/* Scrolling Content Animation */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -300 }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="px-4 pt-4"
            >
              {/* Hero Cards */}
              <div className="flex gap-3 overflow-hidden mb-6">
                {[reel1, reel2, reel3].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                    className="w-64 h-40 rounded-xl overflow-hidden flex-shrink-0"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </motion.div>
                ))}
              </div>

              {/* Event List Items */}
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className="flex gap-3 mb-3 p-3 bg-card rounded-lg border border-border"
                >
                  <div className="w-16 h-16 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted/50 rounded w-1/2" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Overlay Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-20 left-0 right-0 text-center"
            >
              <p className="text-muted-foreground text-sm">Entdecke Events in deiner Nähe</p>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 3: MIA Introduction */}
        {step === 'mia-intro' && (
          <motion.div
            key="mia-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-12 h-12 text-black" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-4 text-center"
            >
              Hallo, ich bin MIA
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground text-center text-lg max-w-sm"
            >
              Ich helfe dir, dich mit anderen zu verbinden und spannende Events zu finden.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-8 flex gap-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground">KI-Matching</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground">Smart Events</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground">Community</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 4: Vybe Preview */}
        {step === 'vybe-preview' && (
          <motion.div
            key="vybe-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative w-72 h-[500px] rounded-3xl overflow-hidden"
            >
              <img src={reel5} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              
              {/* Vybe UI Elements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-4 right-4"
              >
                <h3 className="text-white text-xl font-bold mb-2">Vybe Modus</h3>
                <p className="text-white/70 text-sm mb-4">Swipe durch Events wie auf TikTok</p>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"
                  >
                    <span className="text-2xl">✕</span>
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay: 0.5, repeat: Infinity }}
                    className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center"
                  >
                    <Heart className="w-6 h-6 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 5: Interests Selection - "DEINE VIBES" Design */}
        {step === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col overflow-y-auto"
          >
            {/* Main Card Container */}
            <div className="flex-1 flex items-center justify-center px-4 py-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5"
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-5"
                >
                  <h2 className="text-2xl font-bold text-white tracking-[0.3em] uppercase mb-2">
                    Deine Vibes
                  </h2>
                  <p className="text-zinc-500 text-xs tracking-widest uppercase">
                    Was macht deinen Tag perfekt?
                  </p>
                </motion.div>

                {/* 2-Column Grid of Categories - Narrower */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-2 mb-5"
                >
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      onClick={() => toggleInterest(cat.id)}
                      className={`
                        py-3 px-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em]
                        transition-all duration-300 active:scale-95
                        ${selectedInterests.has(cat.id)
                          ? 'bg-white text-black'
                          : 'bg-transparent border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                        }
                      `}
                    >
                      {cat.label}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Feature Explanation - Detailed */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="border-t border-zinc-800 pt-4 mb-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">KI Event-Assistent</h4>
                      <p className="text-xs text-zinc-500">MIA lernt deine Vorlieben und schlägt passende Events vor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">MIA Matching</h4>
                      <p className="text-xs text-zinc-500">Finde Gleichgesinnte mit ähnlichen Interessen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Tribe Events</h4>
                      <p className="text-xs text-zinc-500">Exklusive Community-Events und Meetups</p>
                    </div>
                  </div>
                </motion.div>

                {/* Continue Button - Full Width */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={handleInterestsContinue}
                  disabled={selectedInterests.size === 0}
                  className={`
                    w-full py-4 rounded-xl font-bold uppercase tracking-[0.25em] text-sm
                    transition-all duration-300
                    ${selectedInterests.size > 0
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }
                  `}
                >
                  Beitreten
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: Community Tour */}
        {step === 'community-tour' && (
          <motion.div
            key="community-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          >
            {/* Simulated Header */}
            <div className="h-14 border-b border-border flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">COMMUNITY</span>
            </div>

            {/* Scrolling Messages */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -200 }}
              transition={{ duration: 2.5, ease: "easeInOut", delay: 1 }}
              className="px-4 pt-4"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex gap-3 mb-4"
                >
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 bg-card rounded-2xl p-3 border border-border">
                    <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-4 bg-muted/50 rounded w-3/4" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Input Area with Typewriter */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
              <div className="flex items-center gap-3 bg-card rounded-full px-4 py-3 border border-border">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">
                  {typedText}
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'}`}>|</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 7: Name Input */}
        {step === 'name-input' && (
          <motion.div
            key="name-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mb-6"
            >
              <Users className="w-10 h-10 text-black" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-2 text-center"
            >
              Wie sollen wir dich nennen?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-center mb-8"
            >
              Dein Name erscheint in der Community
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-xs"
            >
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Dein Name"
                className="w-full px-6 py-4 bg-card border border-border rounded-full text-center text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
                autoFocus
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleNameSubmit}
              disabled={!userName.trim()}
              className={`
                mt-6 px-8 py-4 rounded-full font-semibold flex items-center gap-2
                transition-all duration-300
                ${userName.trim()
                  ? 'bg-gold text-black hover:bg-gold/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              Weiter
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setStep('final-choice')}
              className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Als Gast fortfahren
            </motion.button>
          </motion.div>
        )}

        {/* STEP 8: Final Choice */}
        {step === 'final-choice' && (
          <motion.div
            key="final-choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="mb-8"
            >
              <span className="text-6xl">🎉</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground mb-2 text-center"
            >
              {userName ? `Hey ${userName}!` : 'Willkommen!'}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-center text-lg mb-12"
            >
              Viel Spaß beim Verbinden
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-foreground text-center mb-6"
            >
              Was willst du als erstes tun?
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col gap-4 w-full max-w-xs"
            >
              <button
                onClick={() => handleFinalChoice('connect')}
                className="w-full py-4 px-6 bg-card border border-border rounded-2xl flex items-center gap-4 hover:border-gold/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Mit anderen verbinden</h4>
                  <p className="text-xs text-muted-foreground">Community entdecken</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </button>

              <button
                onClick={() => handleFinalChoice('explore')}
                className="w-full py-4 px-6 bg-card border border-border rounded-2xl flex items-center gap-4 hover:border-gold/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Events entdecken</h4>
                  <p className="text-xs text-muted-foreground">Finde spannende Events</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingWorkflow;
