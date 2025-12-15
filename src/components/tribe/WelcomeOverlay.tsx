import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/tribe';
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
import reel10 from '@/assets/tribe/reel-10.jpg';
import reel11 from '@/assets/tribe/reel-11.jpg';
import reel12 from '@/assets/tribe/reel-12.jpg';
import reel13 from '@/assets/tribe/reel-13.jpg';
import reel14 from '@/assets/tribe/reel-14.jpg';
import reel15 from '@/assets/tribe/reel-15.jpg';

const REEL_IMAGES = [reel1, reel2, reel3, reel4, reel5, reel6, reel7, reel8, reel9, reel10, reel11, reel12, reel13, reel14, reel15];

interface WelcomeOverlayProps {
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

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [imageIndices, setImageIndices] = useState([0, 3, 6, 9, 12, 1, 4, 7]);

  // Calm collage slideshow - slower, staggered changes
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const intervals = [4000, 5000, 4500, 5500, 4200, 5200, 4800, 5800];
    
    imageIndices.forEach((_, slotIndex) => {
      const updateSlot = () => {
        setImageIndices(prev => {
          const newIndices = [...prev];
          newIndices[slotIndex] = (prev[slotIndex] + 1) % REEL_IMAGES.length;
          return newIndices;
        });
        timers[slotIndex] = setTimeout(updateSlot, intervals[slotIndex]);
      };
      timers[slotIndex] = setTimeout(updateSlot, intervals[slotIndex] + slotIndex * 600);
    });
    
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleEnter = async () => {
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
    
    // Save to database for NewMembersWidget (fire-and-forget)
    supabase
      .from('user_profiles')
      .insert({
        username: profile.username,
        avatar: profile.avatarUrl,
        interests: profile.interests,
        favorite_locations: [selectedCity]
      })
      .then(() => console.log('Profile saved to database'));
    
    // Mark welcome as completed and dispatch event for AppDownloadPrompt
    localStorage.setItem('tribe_welcome_completed', 'true');
    window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));
    
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
      
      const guestProfile = {
        username: guestUsername,
        avatarUrl: randomAvatar,
        bio: 'Guest',
        homebase: selectedCity
      };
      
      // Save guest to database for NewMembersWidget
      await supabase
        .from('user_profiles')
        .insert({
          username: guestProfile.username,
          avatar: guestProfile.avatarUrl,
          favorite_locations: [selectedCity]
        });
      
      // Mark welcome as completed and dispatch event for AppDownloadPrompt
      localStorage.setItem('tribe_welcome_completed', 'true');
      window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));
      
      onLogin(guestProfile);
    } catch (err) {
      const fallbackProfile = {
        username: `Guest_${Date.now().toString().slice(-4)}`,
        avatarUrl: AVATAR_OPTIONS[0],
        bio: 'Guest',
        homebase: selectedCity
      };
      
      // Try to save fallback guest too
      supabase
        .from('user_profiles')
        .insert({
          username: fallbackProfile.username,
          avatar: fallbackProfile.avatarUrl,
          favorite_locations: [selectedCity]
        })
        .then(() => {});
      
      // Mark welcome as completed and dispatch event for AppDownloadPrompt
      localStorage.setItem('tribe_welcome_completed', 'true');
      window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));
      
      onLogin(fallbackProfile);
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-[2px]">
      {/* Card Container */}
      <div className="relative w-full max-w-sm bg-black/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Collage Background inside card - full visibility */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Tile 1 */}
          <div className="absolute -left-2 -top-2 w-[55%] h-[40%] overflow-hidden" style={{ transform: 'rotate(-3deg)' }}>
            <img src={REEL_IMAGES[imageIndices[0]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
          {/* Tile 2 */}
          <div className="absolute -right-2 top-[10%] w-[50%] h-[35%] overflow-hidden" style={{ transform: 'rotate(4deg)' }}>
            <img src={REEL_IMAGES[imageIndices[1]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
          {/* Tile 3 */}
          <div className="absolute left-[5%] top-[40%] w-[45%] h-[30%] overflow-hidden" style={{ transform: 'rotate(2deg)' }}>
            <img src={REEL_IMAGES[imageIndices[2]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
          {/* Tile 4 */}
          <div className="absolute right-[0%] top-[45%] w-[50%] h-[35%] overflow-hidden" style={{ transform: 'rotate(-4deg)' }}>
            <img src={REEL_IMAGES[imageIndices[3]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
          {/* Tile 5 */}
          <div className="absolute -left-4 -bottom-4 w-[55%] h-[35%] overflow-hidden" style={{ transform: 'rotate(3deg)' }}>
            <img src={REEL_IMAGES[imageIndices[4]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
          {/* Tile 6 */}
          <div className="absolute -right-4 -bottom-4 w-[50%] h-[30%] overflow-hidden" style={{ transform: 'rotate(-5deg)' }}>
            <img src={REEL_IMAGES[imageIndices[5]]} alt="" className="w-full h-full object-cover transition-all duration-700" draggable={false} />
          </div>
        </div>

        {/* Gradient Overlay inside card - lighter for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 px-6 py-10 flex flex-col items-center text-white">
          {/* Welcome Header */}
          <h1 className="text-2xl font-bold mb-1">Willkommen</h1>
          <p className="text-white/50 text-sm mb-6">Verbinde dich mit der Community</p>
          
          {/* Name Input */}
          <div className="w-full">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Dein Name"
              className="w-full bg-black/50 border border-white/20 rounded-full py-3 px-5 text-center text-white placeholder-white/40 outline-none focus:border-red-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && username.trim() && handleEnter()}
            />
          </div>
          
          {/* Interests - appear when name has at least 1 character */}
          {username.length > 0 && (
            <div className="mt-4 w-full animate-fade-in">
              <p className="text-white/60 text-xs text-center mb-2">Wähle deine Interessen</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selectedCategories.has(cat.id)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-black/50 text-white border-white/30 hover:border-white/50'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enter Button */}
          <button
            onClick={handleEnter}
            disabled={!username.trim()}
            className={`mt-6 w-full py-3 rounded-full font-semibold transition-all ${
              username.trim()
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Los geht's
          </button>

          {/* Guest Login */}
          <button
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="mt-4 text-white/50 hover:text-white/70 transition-colors text-sm"
          >
            {isGuestLoading ? 'Wird geladen...' : 'erstmal nur schauen →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
