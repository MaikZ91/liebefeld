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
  const [imageProgress, setImageProgress] = useState(0);
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

  // Reel-style image slideshow with progress
  useEffect(() => {
    const IMAGE_DURATION = 3000;
    const PROGRESS_INTERVAL = 30;
    
    // Reset progress when image changes
    setImageProgress(0);
    
    // Progress animation
    const progressTimer = setInterval(() => {
      setImageProgress(prev => {
        const next = prev + (PROGRESS_INTERVAL / IMAGE_DURATION) * 100;
        return next >= 100 ? 100 : next;
      });
    }, PROGRESS_INTERVAL);
    
    // Image change
    const imageTimer = setTimeout(() => {
      setCurrentImageIndex(prev => (prev + 1) % REEL_IMAGES.length);
    }, IMAGE_DURATION);
    
    return () => {
      clearInterval(progressTimer);
      clearTimeout(imageTimer);
    };
  }, [currentImageIndex]);

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
      {/* Top Image */}
      <div className="absolute top-0 left-0 right-0 h-1/3">
        {REEL_IMAGES.map((img, i) => (
          <img 
            key={`top-${i}`}
            src={img} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000"
            style={{ opacity: currentImageIndex === i ? 1 : 0 }}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
      </div>
      
      {/* Bottom Image */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3">
        {REEL_IMAGES.map((img, i) => (
          <img 
            key={`bottom-${i}`}
            src={img} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-1000"
            style={{ opacity: (currentImageIndex + 1) % REEL_IMAGES.length === i ? 1 : 0 }}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black" />
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
          {/* Progress Bar - continuous like video */}
          <div className="w-full h-0.5 rounded-full bg-white/20 overflow-hidden mb-4">
            <div 
              className="h-full bg-white transition-none"
              style={{ 
                width: `${((currentImageIndex + imageProgress / 100) / REEL_IMAGES.length) * 100}%`
              }}
            />
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

        {/* Middle Section - Name Input */}
        <div className="flex-1 flex flex-col items-center justify-end pb-16 px-6">
          
          {/* Name Input - always visible */}
          <div className="mt-8 w-full max-w-xs">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Dein Name zum Starten"
              className="w-full bg-black/50 backdrop-blur-sm border border-white/20 rounded-full py-3 px-5 text-center text-sm text-white placeholder-white/40 outline-none focus:border-red-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && canSwipe && handleEnter()}
            />
          </div>
          
          {/* Interests - appear when name has at least 1 character */}
          {username.length > 0 && (
            <div className="mt-4 w-full max-w-xs animate-fade-in">
              <p className="text-white/50 text-xs text-center mb-2">Wähle Interessen aus</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id); }}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      selectedCategories.has(cat.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Swipe CTA */}
        <div className="px-6 mb-20">
          {/* Swipe Up Button */}
          <div className="flex flex-col items-center">
            <div 
              className="relative w-12 h-12 rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center animate-bounce"
              style={{
                transform: `scale(${1 + swipeProgress * 0.2}) translateY(${-swipeProgress * 15}px)`,
                animationDuration: '2s',
              }}
            >
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-[-4px] rounded-full border border-red-500/20 animate-pulse" />
              <ChevronUp className="w-6 h-6 text-red-500 relative z-10" />
            </div>

            {/* JETZT ENTDECKEN */}
            <h2 className="mt-2 text-lg font-bold text-white tracking-wide">
              JETZT ENTDECKEN
            </h2>
            
            {/* Progress indicator */}
            {translateY > 10 && (
              <div className="mt-1 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${swipeProgress * 100}%` }}
                />
              </div>
            )}
            
            {/* Guest Login */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleGuestLogin(); }}
              disabled={isGuestLoading}
              className="mt-2 text-white/50 text-xs hover:text-white/70 transition-colors"
            >
              {isGuestLoading ? '...' : 'erstmal nur schauen'}
            </button>
          </div>
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
