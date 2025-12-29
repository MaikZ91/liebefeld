import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Users, Calendar, MessageCircle, ChevronRight, Zap, X, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TribeEvent } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';

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
  { id: 'kreativitaet', label: 'Kreativität', emoji: '🎨' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
  { id: 'konzerte', label: 'Konzerte', emoji: '🎵' },
  { id: 'kultur', label: 'Kultur', emoji: '🎭' },
];

interface CommunityMessage {
  id: string;
  sender: string;
  text: string;
  avatar: string | null;
  created_at: string;
}

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
  
  // Real data from database
  const [realEvents, setRealEvents] = useState<TribeEvent[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data on mount
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch real events with images
        const { data: events } = await supabase
          .from('community_events')
          .select('*')
          .gte('date', today)
          .not('image_url', 'is', null)
          .order('date', { ascending: true })
          .limit(10);
        
        if (events) {
          setRealEvents(events.map(convertToTribeEvent));
        }
        
        // Fetch real community messages
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('id, sender, text, avatar, created_at')
          .eq('group_id', 'tribe_community_board')
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (messages) {
          setCommunityMessages(messages.reverse());
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRealData();
  }, []);

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

  // Auto-advance explore tour after 5s
  useEffect(() => {
    if (step === 'explore-tour') {
      const timer = setTimeout(() => setStep('mia-intro'), 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance MIA intro after 4s
  useEffect(() => {
    if (step === 'mia-intro') {
      const timer = setTimeout(() => setStep('vybe-preview'), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance Vybe preview after 4s
  useEffect(() => {
    if (step === 'vybe-preview') {
      const timer = setTimeout(() => setStep('interests'), 4000);
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

  // Get hero events (first 3 with images)
  const heroEvents = realEvents.filter(e => e.image_url).slice(0, 3);
  // Get list events
  const listEvents = realEvents.slice(0, 6);
  // Get vybe event (best image)
  const vybeEvent = realEvents.find(e => e.image_url) || realEvents[0];

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

        {/* STEP 2: Explore Tour - REAL APP DATA */}
        {step === 'explore-tour' && (
          <motion.div
            key="explore-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background overflow-hidden"
          >
            {/* Real App Header */}
            <div className="h-14 border-b border-border flex items-center justify-between px-4">
              <span className="text-lg font-bold text-foreground">EXPLORE</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Bielefeld</span>
              </div>
            </div>

            {/* Scrolling Content with Real Events */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -400 }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="px-4 pt-4"
            >
              {/* Hero Section with Real Events */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Featured Events</h3>
                <div className="flex gap-3 overflow-hidden">
                  {heroEvents.length > 0 ? heroEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.2 }}
                      className="w-64 h-44 rounded-xl overflow-hidden flex-shrink-0 relative"
                    >
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-semibold text-sm line-clamp-2">{event.title}</p>
                        <p className="text-white/70 text-xs mt-1">{event.date} • {event.time}</p>
                      </div>
                      <div className="absolute top-3 right-3 bg-gold/90 text-black text-xs font-bold px-2 py-1 rounded-full">
                        {Math.floor(65 + Math.random() * 30)}% Match
                      </div>
                    </motion.div>
                  )) : (
                    // Fallback with reel images
                    [reel1, reel2, reel3].map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.2 }}
                        className="w-64 h-44 rounded-xl overflow-hidden flex-shrink-0 relative"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Compact Event List with Real Data */}
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kommende Events</h3>
              {listEvents.length > 0 ? listEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="flex gap-3 mb-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground line-clamp-1">{event.location || 'Bielefeld'}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                  </div>
                </motion.div>
              )) : (
                // Fallback placeholders
                [1, 2, 3, 4, 5].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                    className="flex gap-3 mb-3 p-3 bg-card rounded-lg border border-border"
                  >
                    <div className="w-16 h-16 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted/50 rounded w-1/2" />
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Highlight Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              className="absolute bottom-24 left-0 right-0 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/30">
                <Sparkles className="w-4 h-4 text-gold" />
                <p className="text-gold text-sm font-medium">Personalisierte Event-Empfehlungen</p>
              </div>
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
              className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-gold/30"
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
              Dein persönlicher KI-Assistent für Events und Connections.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-10 grid grid-cols-3 gap-6"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mb-3 border border-gold/30">
                  <Zap className="w-7 h-7 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground text-center">KI-Matching</span>
              </motion.div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mb-3 border border-gold/30">
                  <Calendar className="w-7 h-7 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground text-center">Smart Events</span>
              </motion.div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mb-3 border border-gold/30">
                  <Users className="w-7 h-7 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground text-center">Community</span>
              </motion.div>
            </motion.div>

            {/* Simulated MIA Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 }}
              className="mt-10 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 bg-card rounded-full px-4 py-3 border border-gold/30 shadow-lg shadow-gold/10">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="text-muted-foreground text-sm">Frag mich was du heute unternehmen willst...</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 4: Vybe Preview with Real Event */}
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
              className="relative w-80 h-[520px] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Real Event Image or Fallback */}
              <img 
                src={vybeEvent?.image_url || reel5} 
                alt={vybeEvent?.title || "Vybe Mode"} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              
              {/* Match Score Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute top-4 right-4 bg-gold text-black text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
              >
                {Math.floor(75 + Math.random() * 20)}% Match
              </motion.div>
              
              {/* Event Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-24 left-4 right-4"
              >
                <span className="text-gold text-xs font-semibold uppercase tracking-wider">VYBE MODUS</span>
                <h3 className="text-white text-2xl font-bold mt-1 line-clamp-2">
                  {vybeEvent?.title || "Entdecke Events wie auf TikTok"}
                </h3>
                {vybeEvent && (
                  <p className="text-white/70 text-sm mt-2">
                    {vybeEvent.date} • {vybeEvent.time}
                  </p>
                )}
                <p className="text-white/60 text-sm mt-2">Swipe durch personalisierte Events</p>
              </motion.div>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-6 left-0 right-0 flex justify-center gap-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-red-500/50 flex items-center justify-center"
                >
                  <X className="w-8 h-8 text-red-400" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-green-500/50 flex items-center justify-center"
                >
                  <Heart className="w-8 h-8 text-green-400" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 5: Interests Selection */}
        {step === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">Was interessiert dich?</h2>
                <p className="text-muted-foreground text-sm">
                  Wähle deine Interessen für personalisierte Empfehlungen
                </p>
              </motion.div>

              {/* Category Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-3 mb-8"
              >
                {CATEGORIES.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    onClick={() => toggleInterest(cat.id)}
                    className={`
                      px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2
                      transition-all duration-300 active:scale-95
                      ${selectedInterests.has(cat.id)
                        ? 'bg-gold text-black shadow-lg shadow-gold/30'
                        : 'bg-card border border-border text-foreground hover:border-gold/50'
                      }
                    `}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {selectedInterests.has(cat.id) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </motion.div>

              {/* Feature Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card/50 rounded-2xl p-4 max-w-sm border border-border"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">KI Event-Assistent</h4>
                    <p className="text-xs text-muted-foreground">MIA lernt deine Vorlieben und schlägt passende Events vor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">MIA Matching</h4>
                    <p className="text-xs text-muted-foreground">Finde Gleichgesinnte mit ähnlichen Interessen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Tribe Events</h4>
                    <p className="text-xs text-muted-foreground">Exklusive Community-Events und Meetups</p>
                  </div>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={handleInterestsContinue}
                disabled={selectedInterests.size === 0}
                className={`
                  mt-8 px-8 py-4 rounded-full font-semibold flex items-center gap-2
                  transition-all duration-300
                  ${selectedInterests.size > 0
                    ? 'bg-gold text-black hover:bg-gold/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                Weiter
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: Community Tour with REAL Messages */}
        {step === 'community-tour' && (
          <motion.div
            key="community-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background overflow-hidden"
          >
            {/* Real App Header */}
            <div className="h-14 border-b border-border flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">COMMUNITY</span>
            </div>

            {/* Scrolling Real Messages */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -250 }}
              transition={{ duration: 3, ease: "easeInOut", delay: 0.5 }}
              className="px-4 pt-4 pb-32"
            >
              {communityMessages.length > 0 ? communityMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-3 mb-4"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.sender} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-card rounded-2xl p-3 border border-border">
                    <p className="text-xs font-medium text-gold mb-1">{msg.sender}</p>
                    <p className="text-sm text-foreground line-clamp-2">{msg.text}</p>
                  </div>
                </motion.div>
              )) : (
                // Fallback placeholders
                [1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex gap-3 mb-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 bg-card rounded-2xl p-3 border border-border">
                      <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-4 bg-muted/50 rounded w-3/4" />
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Input Area with Typewriter */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
              <div className="flex items-center gap-3 bg-card rounded-full px-4 py-3 border border-gold/30">
                <MessageCircle className="w-5 h-5 text-gold" />
                <span className="text-foreground">
                  {typedText}
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} text-gold`}>|</span>
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
              className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-gold/30"
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
