import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types/tribe';
import { ChevronUp, Play, Sparkles } from 'lucide-react';
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

const TYPEWRITER_TEXTS = [
  "Bielefeld ist nur eine Stadt bis du deine Leute findest.",
  "Entdecke Events, die zu dir passen.",
  "Finde deine Community in der Stadt."
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  // Swipe state
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Typewriter state
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canSwipe = username.trim().length > 0;

  // Reel-style image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % REEL_IMAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentText = TYPEWRITER_TEXTS[typewriterIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setTypewriterIndex((prev) => (prev + 1) % TYPEWRITER_TEXTS.length);
        }
      }
    }, isDeleting ? 30 : 50);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, typewriterIndex]);

  // Load event count for social proof
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
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
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
        if (match) {
          guestNumber = parseInt(match[1]) + 1;
        }
      }

      const guestUsername = `Guest_${guestNumber}`;
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      
      const profile: UserProfile = {
        username: guestUsername,
        avatarUrl: randomAvatar,
        bio: 'Guest',
        homebase: selectedCity
      };
      
      onLogin(profile);
    } catch (err) {
      const profile: UserProfile = {
        username: `Guest_${Date.now().toString().slice(-4)}`,
        avatarUrl: AVATAR_OPTIONS[0],
        bio: 'Guest',
        homebase: selectedCity
      };
      onLogin(profile);
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Touch handlers for swipe-up
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canSwipe) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !canSwipe) return;
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    if (diff > 0) {
      setTranslateY(Math.min(diff, 300));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !canSwipe) return;
    setIsDragging(false);
    
    if (translateY > 150) {
      handleEnter();
    } else {
      setTranslateY(0);
    }
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canSwipe) return;
    setIsDragging(true);
    setStartY(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !canSwipe) return;
      const diff = startY - e.clientY;
      if (diff > 0) {
        setTranslateY(Math.min(diff, 300));
      }
    };

    const handleMouseUp = () => {
      if (!isDragging || !canSwipe) return;
      setIsDragging(false);
      
      if (translateY > 150) {
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

  const swipeProgress = Math.min(translateY / 150, 1);

  return (
    <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden select-none">
      {/* Progress Bar at Top */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-4 pt-3">
        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-1/2" />
        </div>
        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300" 
            style={{ width: `${canSwipe ? 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Header Section - Logo + Typewriter */}
      <div className="relative z-40 pt-10 px-6 pb-4 bg-gradient-to-b from-black via-black/95 to-transparent">
        {/* THE TRIBE Logo */}
        <h1 className="text-center text-2xl font-serif tracking-[0.3em] text-white mb-3">
          T H E &nbsp; T R I B E
        </h1>
        
        {/* Typewriter Text */}
        <p className="text-center text-white/90 text-sm min-h-[40px]">
          {displayText}
          <span className="animate-pulse">|</span>
        </p>
        
        {/* "Finde sie jetzt" Link */}
        <p className="text-center text-red-500 text-sm mt-2 cursor-pointer hover:text-red-400 transition-colors">
          Finde sie jetzt →
        </p>
      </div>

      {/* Main Content - Swipeable Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateY(-${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Background Image Slideshow */}
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
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        </div>

        {/* Play Button Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* "Neu in Bielefeld?" Banner */}
        <div className="absolute bottom-32 left-0 right-0 pointer-events-none">
          <div className="bg-gradient-to-r from-transparent via-black/60 to-transparent py-2">
            <p className="text-center text-3xl font-bold text-white drop-shadow-lg">
              Neu in Bielefeld?
            </p>
          </div>
        </div>

        {/* Swipe Up Indicator */}
        <div 
          className={`absolute bottom-16 left-1/2 -translate-x-1/2 transition-all duration-300 ${
            canSwipe ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <div 
            className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg cursor-pointer animate-bounce"
            style={{
              transform: `scale(${1 + swipeProgress * 0.3})`,
              backgroundColor: `hsl(0, ${70 + swipeProgress * 30}%, ${45 + swipeProgress * 15}%)`
            }}
          >
            <ChevronUp className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Section - Form & CTA */}
      <div 
        className="relative z-30 bg-black px-6 pb-6 pt-4"
        style={{
          transform: `translateY(-${translateY * 0.5}px)`,
          opacity: 1 - swipeProgress * 0.5,
          transition: isDragging ? 'none' : 'all 0.3s ease-out'
        }}
      >
        {/* JETZT ENTDECKEN */}
        <h2 className="text-center text-2xl font-bold tracking-widest mb-1">
          JETZT ENTDECKEN
        </h2>
        <p className="text-center text-white/60 text-sm mb-2">
          Kostenlos starten
        </p>
        <p className="text-center text-white/40 text-xs mb-4">
          {eventCount > 0 ? `${eventCount}+ aktive Mitglieder` : '200+ aktive Mitglieder'}
        </p>

        {/* Name Input */}
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Dein Name"
          className="w-full bg-transparent border border-white/30 rounded-full py-3 px-5 text-center text-white placeholder-white/40 outline-none focus:border-red-500 transition-colors mb-3"
          onKeyDown={(e) => e.key === 'Enter' && canSwipe && handleEnter()}
        />

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                selectedCategories.has(cat.id)
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Events Badge */}
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-2 border border-red-600/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs">Events in deiner Nähe</span>
          </div>
        </div>

        {/* Swipe Hint or Guest Login */}
        {canSwipe ? (
          <p className="text-center text-white/40 text-xs animate-pulse">
            ↑ Nach oben wischen zum Starten
          </p>
        ) : (
          <button 
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="text-white/40 text-xs hover:text-white/60 transition-colors mx-auto block"
          >
            {isGuestLoading ? '...' : 'Erstmal nur schauen →'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce {
          animation: bounce 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
