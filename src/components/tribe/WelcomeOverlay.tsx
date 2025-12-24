import React, { useState } from 'react';
import { UserProfile } from '@/types/tribe';
import { supabase } from '@/integrations/supabase/client';
import { Heart, ChevronRight } from 'lucide-react';

// Import welcome videos
import ausgehenVideo from '@/assets/welcome/ausgehen.mp4';
import kreativitaetVideo from '@/assets/welcome/kreativitaet.mp4';
import sportVideo from '@/assets/welcome/sport.mp4';

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

interface CategorySection {
  id: string;
  label: string;
  hashtag: string;
  video: string;
  mappedCategories: string[];
}

const SECTIONS: CategorySection[] = [
  { 
    id: 'ausgehen', 
    label: 'Ausgehen', 
    hashtag: '#ausgehen',
    video: ausgehenVideo,
    mappedCategories: ['Ausgehen', 'Bar', 'Club', 'Nightlife', 'Party', 'Sonstiges']
  },
  { 
    id: 'kreativitaet', 
    label: 'Kreativität', 
    hashtag: '#kreativität',
    video: kreativitaetVideo,
    mappedCategories: ['Kreativität', 'Kunst', 'Art', 'Workshop', 'Kultur', 'Konzert', 'Musik']
  },
  { 
    id: 'sport', 
    label: 'Sport', 
    hashtag: '#sport',
    video: sportVideo,
    mappedCategories: ['Sport', 'Hochschulsport', 'Fitness', 'Outdoor', 'Laufen', 'Yoga']
  },
];

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onLogin, initialUsername }) => {
  const [likedSections, setLikedSections] = useState<Set<string>>(new Set());

  const toggleLike = (sectionId: string) => {
    setLikedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    // Save liked categories to localStorage for personalization
    const likedCategories = Array.from(likedSections);
    if (likedCategories.length > 0) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(likedCategories));
    }

    // Get or create username
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
      interests: likedCategories
    };

    // Save profile to localStorage
    localStorage.setItem('tribe_user_profile', JSON.stringify(profile));

    // Save to database (fire-and-forget)
    supabase
      .from('user_profiles')
      .upsert({
        username: profile.username,
        avatar: profile.avatarUrl,
        interests: profile.interests,
        favorite_locations: ['Bielefeld']
      }, { onConflict: 'username' })
      .then(() => console.log('Profile saved to database'));

    // Mark welcome as completed
    localStorage.setItem('tribe_welcome_completed', 'true');
    window.dispatchEvent(new CustomEvent('tribe_welcome_completed'));

    onLogin(profile);
  };


  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-black via-black/90 to-transparent pb-8 pt-6 px-6">
        <h1 className="text-2xl font-bold text-white text-center">Was interessiert dich?</h1>
        <p className="text-white/60 text-sm text-center mt-1">Wähle mindestens eine Kategorie</p>
      </div>

      {/* Three sections on one page */}
      <div className="px-4 pb-32 space-y-4">
        {SECTIONS.map((section) => (
          <div 
            key={section.id}
            className="relative aspect-[16/9] rounded-2xl overflow-hidden"
          >
            {/* Video Background */}
            <video
              src={section.video}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 transition-all duration-300 ${
              likedSections.has(section.id) 
                ? 'bg-gradient-to-t from-red-500/40 via-transparent to-transparent' 
                : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
            }`} />
            
            {/* Content */}
            <button
              onClick={() => toggleLike(section.id)}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-end pb-6 px-4"
            >
              {/* Hashtag */}
              <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                {section.hashtag}
              </h2>
              
              {/* Like indicator */}
              <div className={`
                flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold
                transition-all duration-300
                ${likedSections.has(section.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30'
                }
              `}>
                <Heart 
                  className={`w-5 h-5 transition-all ${likedSections.has(section.id) ? 'fill-white' : ''}`} 
                />
                {likedSections.has(section.id) ? 'Ausgewählt' : 'Auswählen'}
              </div>
            </button>

            {/* Selected checkmark */}
            {likedSections.has(section.id) && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Continue Button - Fixed at bottom, only enabled when at least 1 selected */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black via-black/95 to-transparent">
        <button
          onClick={handleContinue}
          disabled={likedSections.size === 0}
          className={`w-full py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-all active:scale-98 ${
            likedSections.size > 0
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-white/20 text-white/40 cursor-not-allowed'
          }`}
        >
          {likedSections.size > 0 ? (
            <>
              Weiter mit {likedSections.size} {likedSections.size === 1 ? 'Interesse' : 'Interessen'}
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            'Bitte wähle mindestens 1 Kategorie'
          )}
        </button>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
