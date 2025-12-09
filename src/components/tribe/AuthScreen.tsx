import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/tribe';
import { ChevronUp } from 'lucide-react';
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

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

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

const TYPEWRITER_TEXT = "Bielefeld ist nur eine Stadt bis du deine Leute findest.";

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  
  // Swipe state
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const canSwipe = username.trim().length > 0;
  
  // Typewriter effect
  useEffect(() => {
    if (typewriterIndex < TYPEWRITER_TEXT.length) {
      const timeout = setTimeout(() => {
        setTypewriterIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [typewriterIndex]);

  // Reel-style image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % REEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startY - e.touches[0].clientY;
    if (diff > 0) setTranslateY(Math.min(diff, 500));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 120 && canSwipe) {
      handleEnter();
    } else if (translateY > 120 && !canSwipe) {
      // Shake animation feedback
      setTranslateY(0);
    } else {
      setTranslateY(0);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const diff = startY - e.clientY;
      if (diff > 0) setTranslateY(Math.min(diff, 500));
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (translateY > 120 && canSwipe) {
        handleEnter();
      } else {
        setTranslateY(0);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, translateY, canSwipe]);

  const swipeProgress = Math.min(translateY / 120, 1);

  return (
    <div 
      className="h-screen bg-black text-white relative overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Full Screen Background */}
      <div className="absolute inset-0">
        {REEL_IMAGES.map((img, i) => (
          <img 
            key={i}
            src={img} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: currentImageIndex === i ? 1 : 0 }}
            draggable={false}
          />
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black" />
      </div>

      {/* Content Container - moves up on swipe */}
      <div 
        className="relative h-full flex flex-col"
        style={{
          transform: `translateY(-${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Section - Progress Bar + Logo + Tagline */}
        <div className="pt-3 px-4">
          {/* Progress Bar */}
          <div className="flex gap-1 mb-4">
            <div className={`flex-1 h-0.5 rounded-full ${canSwipe ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-0.5 rounded-full ${selectedCategories.size > 0 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          
          <h1 className="text-center text-lg font-serif tracking-[0.3em] text-white">
            THE TRIBE
          </h1>
          
          <p className="text-center text-white/70 text-xs mt-3 min-h-[2em]">
            {TYPEWRITER_TEXT.slice(0, typewriterIndex)}
            {typewriterIndex < TYPEWRITER_TEXT.length && <span className="animate-pulse">|</span>}
          </p>
          
          <button 
            onClick={(e) => { e.stopPropagation(); if (canSwipe) handleEnter(); }}
            className="block mx-auto mt-1 text-red-500 text-xs font-medium hover:text-red-400 transition-colors"
          >
            Finde sie jetzt →
          </button>
        </div>

        {/* Middle Section - Spacer + Main Visual */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-5xl font-bold text-white text-center leading-tight drop-shadow-2xl">
            Neu in<br/>Bielefeld?
          </p>
          
          {eventCount > 0 && (
            <div className="mt-6 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">{eventCount} Events diese Woche</span>
            </div>
          )}
        </div>

        {/* Bottom Section - Form + Swipe CTA */}
        <div className="px-6 pb-8">
          {/* Name Input */}
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Wie heißt du?"
            className="w-full bg-black/50 backdrop-blur-sm border-2 border-white/20 rounded-full py-4 px-6 text-center text-lg text-white placeholder-white/40 outline-none focus:border-red-500 transition-all mb-4"
            onKeyDown={(e) => e.key === 'Enter' && canSwipe && handleEnter()}
          />

          {/* Category Chips - Compact */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id); }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  selectedCategories.has(cat.id)
                    ? 'bg-red-600 text-white'
                    : 'bg-black/40 backdrop-blur-sm text-white/70 border border-white/20'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Swipe Up CTA */}
          <div className="flex flex-col items-center">
            {/* Animated Swipe Button */}
            <div 
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                canSwipe 
                  ? 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                  : 'bg-zinc-800/80 backdrop-blur-sm'
              }`}
              style={{
                transform: `scale(${1 + swipeProgress * 0.3}) translateY(${-swipeProgress * 20}px)`,
              }}
            >
              <ChevronUp 
                className={`w-10 h-10 transition-all ${canSwipe ? 'text-white' : 'text-white/40'}`}
                style={{
                  transform: `translateY(${Math.sin(Date.now() / 300) * (canSwipe ? 4 : 0)}px)`
                }}
              />
              
              {/* Pulse rings when ready */}
              {canSwipe && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
                  <div className="absolute inset-[-8px] rounded-full border border-red-500/30 animate-pulse" />
                </>
              )}
            </div>

            {/* CTA Text */}
            <p className={`mt-4 text-sm font-medium tracking-wide transition-all ${
              canSwipe ? 'text-white' : 'text-white/40'
            }`}>
              {canSwipe ? 'NACH OBEN WISCHEN' : 'GIB DEINEN NAMEN EIN'}
            </p>
            
            {/* Progress indicator */}
            {translateY > 10 && (
              <div className="mt-2 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${swipeProgress * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Guest Login */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleGuestLogin(); }}
            disabled={isGuestLoading}
            className="mt-6 text-white/30 text-xs hover:text-white/50 transition-colors mx-auto block"
          >
            {isGuestLoading ? '...' : 'Erstmal nur schauen'}
          </button>
        </div>
      </div>

      {/* Swipe visual feedback overlay */}
      {translateY > 50 && (
        <div 
          className="absolute inset-0 bg-black/50 pointer-events-none transition-opacity"
          style={{ opacity: swipeProgress * 0.5 }}
        />
      )}
    </div>
  );
};
