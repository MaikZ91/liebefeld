import React, { useState, useRef, useEffect } from 'react';
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
  const [currentSection, setCurrentSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position to update current section
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = container.clientHeight;
      const newSection = Math.round(scrollTop / sectionHeight);
      setCurrentSection(Math.min(newSection, SECTIONS.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollToSection = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const sectionHeight = container.clientHeight;
    container.scrollTo({ top: index * sectionHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Scrollable sections container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {SECTIONS.map((section, index) => (
          <div 
            key={section.id}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center"
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-32 px-6">
              {/* Hashtag */}
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {section.hashtag}
              </h2>
              
              {/* Like Button */}
              <button
                onClick={() => toggleLike(section.id)}
                className={`
                  flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold
                  transition-all duration-300 transform active:scale-95
                  ${likedSections.has(section.id)
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
                  }
                `}
              >
                <Heart 
                  className={`w-6 h-6 transition-all ${likedSections.has(section.id) ? 'fill-white' : ''}`} 
                />
                {likedSections.has(section.id) ? 'Gefällt mir' : 'Like'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        {SECTIONS.map((section, index) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(index)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${currentSection === index 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/60'
              }
              ${likedSections.has(section.id) ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-black' : ''}
            `}
            aria-label={`Go to ${section.label}`}
          />
        ))}
      </div>

      {/* Continue Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-full bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-98"
        >
          {likedSections.size > 0 ? (
            <>
              Weiter mit {likedSections.size} {likedSections.size === 1 ? 'Interesse' : 'Interessen'}
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Überspringen
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        
        {/* Like counter */}
        {likedSections.size > 0 && (
          <p className="text-center text-white/60 text-sm mt-3">
            Deine Likes verbessern den MIA Matching Score
          </p>
        )}
      </div>

      {/* Scroll hint on first section */}
      {currentSection === 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="flex flex-col items-center text-white/60">
            <span className="text-xs mb-1">Scroll für mehr</span>
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeOverlay;
