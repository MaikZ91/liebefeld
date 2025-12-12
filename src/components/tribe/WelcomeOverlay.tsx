import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/tribe';
import { supabase } from '@/integrations/supabase/client';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900/95 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Willkommen</h1>
          <p className="text-zinc-400 text-sm">Tritt der Community bei</p>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Dein Name"
            className="w-full bg-zinc-800/80 border border-zinc-600 rounded-xl py-3 px-4 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-all text-center"
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && handleEnter()}
          />
        </div>
        
        {/* Interests - appear when name has at least 1 character */}
        {username.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <p className="text-zinc-400 text-xs text-center mb-3">Wähle deine Interessen</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedCategories.has(cat.id)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:border-zinc-500'
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
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            username.trim()
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          Los geht's
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-zinc-500 text-xs">oder</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Connect with Community */}
        <div className="text-center mb-4">
          <p className="text-zinc-300 text-sm font-medium">Verbinde dich mit der Community</p>
        </div>

        {/* Guest Login */}
        <button
          onClick={handleGuestLogin}
          disabled={isGuestLoading}
          className="w-full py-2.5 rounded-xl border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all text-sm"
        >
          {isGuestLoading ? 'Wird geladen...' : 'erstmal nur schauen'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
