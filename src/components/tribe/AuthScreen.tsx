import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/tribe';
import { ArrowRight, UserX, Sparkles, Users } from 'lucide-react';
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

const CITIES = ['Bielefeld', 'Berlin', 'Hamburg', 'Köln', 'München'];

const CATEGORIES = [
  { id: 'ausgehen', label: 'Ausgehen', icon: '🍸' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'konzerte', label: 'Konzerte', icon: '🎵' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'kreativitaet', label: 'Kreativität', icon: '🎨' },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Reel-style image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % REEL_IMAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

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
    
    // Save preferred categories to localStorage for MIA pre-configuration
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-end pb-8 p-6 relative overflow-hidden">
      {/* Reel-style Image Slideshow Background - More Visible */}
      <div className="absolute inset-0 overflow-hidden">
        {REEL_IMAGES.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ 
              opacity: currentImageIndex === i ? 1 : 0,
              zIndex: currentImageIndex === i ? 1 : 0
            }}
          >
            <img 
              src={img} 
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Gradient overlay - only at bottom for form readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
      </div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-20 pointer-events-none" />

      <div className="w-full max-w-sm z-30">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-12 h-12 mb-4">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22H22L12 2Z" className="fill-white"/>
              <circle cx="12" cy="14" r="3" className="fill-black"/>
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-[0.2em] text-white">THE TRIBE</h1>
          <p className="text-[10px] text-gold uppercase tracking-widest mt-2">Dein Netzwerk in deiner Stadt</p>
        </div>

        {/* One-Step Login Form */}
        <div className="space-y-5 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-light">Entdecke was läuft</h2>
            <p className="text-xs text-zinc-400 leading-relaxed px-4">
              Events, Leute & Insider-Tipps in deiner Stadt
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setShowCategories(true)}
                placeholder="Wie heißt du?"
                className="w-full bg-transparent border-b border-white/20 py-3 text-center text-xl font-serif text-white placeholder-zinc-600 outline-none focus:border-gold transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && username.trim() && handleEnter()}
              />
            </div>

            {/* Category Filters - appear on name focus */}
            <div className={`overflow-hidden transition-all duration-300 ${showCategories ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="text-[10px] text-zinc-500 text-center mb-2">Was interessiert dich?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      selectedCategories.has(cat.id)
                        ? 'bg-gold text-black'
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 text-white text-sm p-3 outline-none focus:border-gold transition-colors rounded"
              >
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>

          {/* Main CTA */}
          <button 
            onClick={handleEnter}
            disabled={!username.trim()}
            className="w-full bg-gold text-black py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-gold shadow-[0_0_30px_rgba(212,180,131,0.2)]"
          >
            <Sparkles size={14} />
            Los geht's
            <ArrowRight size={14} />
          </button>

          {/* Guest Login - Very Small */}
          <button 
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="text-zinc-600 text-[9px] hover:text-zinc-400 transition-colors mx-auto block mt-2"
          >
            {isGuestLoading ? '...' : 'erstmal nur schauen'}
          </button>

          {/* Social Proof Ticker */}
          {eventCount > 0 && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-gold" />
                  {eventCount} Events diese Woche
                </span>
                <span className="flex items-center gap-1">
                  <Users size={10} className="text-gold" />
                  Live Community
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
