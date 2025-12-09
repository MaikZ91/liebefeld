import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types/tribe';
import { ChevronUp, Play, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import reel images
import reel1 from '@/assets/tribe/reel-1.jpg';
import reel2 from '@/assets/tribe/reel-2.jpg';
import reel3 from '@/assets/tribe/reel-3.jpg';
import reel4 from '@/assets/tribe/reel-4.jpg';
import reel5 from '@/assets/tribe/reel-5.jpg';
import reel6 from '@/assets/tribe/reel-6.jpg';
import reel7 from '@/assets/tribe/reel-7.jpg';
import reel8 from '@/assets/tribe/reel-8.jpg';
import reel9 from '@/assets/tribe/reel-9.jpg';

const REEL_IMAGES = [reel1, reel2, reel3, reel4, reel5, reel6, reel7, reel8, reel9];

const TYPEWRITER_TEXTS = [
  "Bielefeld ist nur eine Stadt bis du deine Leute findest.",
  "Entdecke Events die zu dir passen.",
  "Finde Menschen mit gleichen Interessen."
];

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150"
];

const CATEGORIES = [
  { id: 'ausgehen', label: 'Ausgehen', icon: '🍸' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'konzerte', label: 'Konzerte', icon: '🎵' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'kreativitaet', label: 'Kreativität', icon: '🎨' },
];

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  
  // Swipe state
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  const canSwipe = username.trim().length > 0;
  const swipeProgress = Math.min(translateY / 150, 1);

  // Image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % REEL_IMAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const text = TYPEWRITER_TEXTS[currentTextIndex];
    let charIndex = 0;
    setDisplayedText('');
    
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentTextIndex((prev) => (prev + 1) % TYPEWRITER_TEXTS.length);
        }, 2000);
      }
    }, 50);
    
    return () => clearInterval(typeInterval);
  }, [currentTextIndex]);

  // Load event count
  useEffect(() => {
    const loadEventCount = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const weekLater = new Date();
        weekLater.setDate(weekLater.getDate() + 7);
        const { count } = await supabase
          .from('community_events')
          .select('*', { count: 'exact', head: true })
          .gte('date', today)
          .lte('date', weekLater.toISOString().split('T')[0]);
        setEventCount(count || 0);
      } catch (err) {
        console.error('Failed to load event count:', err);
      }
    };
    loadEventCount();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleEnter = () => {
    if (!username.trim()) return;
    
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    
    if (selectedCategories.size > 0) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(Array.from(selectedCategories)));
    }
    
    const profile: UserProfile = {
      username: username,
      avatarUrl: randomAvatar,
      bio: 'New Member',
      homebase: selectedCity,
      interests: Array.from(selectedCategories)
    };
    
    onLogin(profile);
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      const { data: existingGuests, error } = await supabase
        .from('user_profiles')
        .select('username')
        .like('username', 'Guest_%')
        .order('created_at', { ascending: false })
        .limit(1);

      let guestNumber = 1;
      if (!error && existingGuests && existingGuests.length > 0) {
        const lastGuest = existingGuests[0].username;
        const match = lastGuest.match(/Guest_(\d+)/);
        if (match) guestNumber = parseInt(match[1]) + 1;
      }

      const guestUsername = `Guest_${guestNumber}`;
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      
      onLogin({
        username: guestUsername,
        avatarUrl: randomAvatar,
        bio: 'Guest',
        homebase: selectedCity
      });
    } catch (err) {
      onLogin({
        username: `Guest_${Date.now().toString().slice(-4)}`,
        avatarUrl: AVATAR_OPTIONS[0],
        bio: 'Guest',
        homebase: selectedCity
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Swipe handlers
  const handleStart = (clientY: number) => {
    if (!canSwipe) return;
    startY.current = clientY;
    setIsDragging(true);
  };

  const handleMove = (clientY: number) => {
    if (!isDragging || !canSwipe) return;
    const diff = startY.current - clientY;
    if (diff > 0) {
      setTranslateY(Math.min(diff, 200));
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (translateY > 150 && canSwipe) {
      handleEnter();
    } else {
      setTranslateY(0);
    }
  };

  return (
    <div 
      className="h-screen bg-black text-white flex flex-col overflow-hidden select-none"
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => isDragging && handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Progress Bar */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        <div className={`h-1 flex-1 rounded-full transition-colors ${username ? 'bg-white' : 'bg-zinc-700'}`} />
        <div className={`h-1 flex-1 rounded-full transition-colors ${canSwipe ? 'bg-white' : 'bg-zinc-700'}`} />
      </div>

      {/* Header Section */}
      <div className="px-6 pt-4 pb-3 text-center">
        <h1 className="text-2xl font-light tracking-[0.5em]">THE TRIBE</h1>
        <p className="text-white/70 text-sm mt-3 min-h-[20px]">
          {displayedText}<span className="animate-pulse">|</span>
        </p>
        <button className="text-red-500 text-sm mt-2 hover:text-red-400 transition-colors">
          Finde sie jetzt →
        </button>
      </div>

      {/* Image Section */}
      <div className="relative flex-1 mx-0 overflow-hidden">
        {/* Background Images */}
        {REEL_IMAGES.map((img, index) => (
          <img
            key={index}
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: index === currentImageIndex ? 1 : 0 }}
            draggable={false}
          />
        ))}
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white/80 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* "Neu in Bielefeld?" Overlay */}
        <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
          <h2 className="text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
            Neu in Bielefeld?
          </h2>
        </div>

        {/* Swipe Button on Image */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              canSwipe 
                ? 'bg-red-600 shadow-[0_0_25px_rgba(220,38,38,0.7)]' 
                : 'bg-zinc-800/90 backdrop-blur-sm'
            }`}
            style={{ transform: `translateY(${-translateY * 0.3}px) scale(${1 + swipeProgress * 0.2})` }}
          >
            {canSwipe ? (
              <ChevronUp className="w-8 h-8 text-white animate-bounce" />
            ) : (
              <Lock className="w-5 h-5 text-white/50" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div 
        className="bg-black px-6 pt-4 pb-6"
        style={{ 
          transform: `translateY(${-translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* CTA Text */}
        <div className="text-center mb-3">
          <h3 className="text-xl font-bold tracking-wide">JETZT ENTDECKEN</h3>
          <p className="text-white/60 text-sm">Kostenlos starten</p>
          <p className="text-white/40 text-xs">200+ aktive Mitglieder</p>
        </div>

        {/* Name Input */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Dein Name"
          className="w-full bg-transparent border border-zinc-700 rounded-full py-3 px-5 text-center text-white placeholder-white/40 outline-none focus:border-red-500 transition-colors mb-3"
          onKeyDown={(e) => e.key === 'Enter' && canSwipe && handleEnter()}
        />

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id); }}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                selectedCategories.has(cat.id)
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-white/60 hover:bg-zinc-700'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Events Badge */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white/70 text-sm">Events in deiner Nähe</span>
          </div>
        </div>

        {/* Swipe Hint */}
        <p className={`text-center text-xs mb-2 ${canSwipe ? 'text-white/60' : 'text-white/30'}`}>
          {canSwipe ? '↑ Nach oben wischen' : 'Gib deinen Namen ein'}
        </p>

        {/* Guest Login */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleGuestLogin(); }}
          disabled={isGuestLoading}
          className="text-white/30 text-xs hover:text-white/50 transition-colors mx-auto block"
        >
          {isGuestLoading ? '...' : 'erstmal nur schauen'}
        </button>
      </div>

      {/* Progress overlay during swipe */}
      {translateY > 30 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <div 
            className="h-full bg-red-500 transition-all"
            style={{ width: `${swipeProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
