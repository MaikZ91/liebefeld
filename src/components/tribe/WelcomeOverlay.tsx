import React, { useState } from 'react';
import { UserProfile } from '@/types/tribe';
import { supabase } from '@/integrations/supabase/client';
import { Heart, ChevronRight } from 'lucide-react';

interface WelcomeOverlayProps {
  onLogin: (profile: UserProfile) => void;
  initialUsername?: string;
}

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150"
];

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  mappedCategories: string[];
}

const CATEGORIES: CategoryOption[] = [
  { 
    id: 'ausgehen', 
    label: 'Ausgehen', 
    emoji: '🎉',
    mappedCategories: ['Ausgehen', 'Bar', 'Club', 'Nightlife', 'Party', 'Sonstiges']
  },
  { 
    id: 'kreativitaet', 
    label: 'Kreativität', 
    emoji: '🎨',
    mappedCategories: ['Kreativität', 'Kunst', 'Art', 'Workshop', 'Kultur', 'Konzert', 'Musik']
  },
  { 
    id: 'sport', 
    label: 'Sport', 
    emoji: '⚽',
    mappedCategories: ['Sport', 'Hochschulsport', 'Fitness', 'Outdoor', 'Laufen', 'Yoga']
  },
];

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onLogin }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    const selectedCategories = Array.from(selected);
    if (selectedCategories.length > 0) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(selectedCategories));
    }

    const savedProfile = localStorage.getItem('tribe_user_profile');
    let username = `Guest_${Date.now().toString().slice(-4)}`;
    let avatarUrl = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    
    if (savedProfile) {
      try {
        const existing = JSON.parse(savedProfile);
        username = existing.username || username;
        avatarUrl = existing.avatarUrl || existing.avatar || avatarUrl;
      } catch {}
    }

    const profile: UserProfile = {
      username,
      avatarUrl,
      bio: 'New Member',
      homebase: 'Bielefeld',
      interests: selectedCategories
    };

    localStorage.setItem('tribe_user_profile', JSON.stringify(profile));

    supabase
      .from('user_profiles')
      .upsert({
        username: profile.username,
        avatar: profile.avatarUrl,
        interests: profile.interests,
        favorite_locations: ['Bielefeld']
      }, { onConflict: 'username' })
      .then(() => console.log('Profile saved to database'));

    localStorage.setItem('tribe_welcome_completed', 'true');
    window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));

    onLogin(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-background/95 backdrop-blur rounded-2xl p-6 shadow-2xl border border-border/50">
        {/* Minimal greeting */}
        <p className="text-muted-foreground text-sm text-center mb-4">
          Was interessiert dich?
        </p>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleSelect(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                transition-all duration-200 active:scale-95
                ${selected.has(cat.id)
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {selected.has(cat.id) && (
                <Heart className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className={`
            w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200 active:scale-98
            ${selected.size > 0
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {selected.size > 0 ? (
            <>
              Los geht's
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            'Wähle mindestens 1'
          )}
        </button>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
