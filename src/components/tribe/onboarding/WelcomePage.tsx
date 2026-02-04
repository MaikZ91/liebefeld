import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Users, MapPin, Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import welcomeImage from '@/assets/welcome/tribe-stammtisch-welcome.png';
import creativeCircleImg from '@/assets/welcome/creative-circle.png';
import tuesdayRunImg from '@/assets/welcome/tuesday-run.png';
import wandersamstagImg from '@/assets/welcome/wandersamstag.png';

interface WelcomePageProps {
  userName: string;
  onContinue: () => void;
}

const communityEvents = [
  {
    id: 'lauftreff',
    title: 'Tuesday Run',
    schedule: 'Jeden Dienstag',
    time: '17:00 Uhr',
    image: tuesdayRunImg,
    emoji: '🏃',
  },
  {
    id: 'creative',
    title: 'Creative Circle',
    schedule: 'Letzter Fr/Monat',
    time: 'Abends',
    image: creativeCircleImg,
    emoji: '🎸',
  },
  {
    id: 'wandern',
    title: 'Wandersamstag',
    schedule: '3. Samstag/Monat',
    time: 'Vormittags',
    image: wandersamstagImg,
    emoji: '🥾',
  },
];

export const WelcomePage: React.FC<WelcomePageProps> = ({ userName, onContinue }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Staggered fade in animation
    requestAnimationFrame(() => {
      setIsVisible(true);
      setTimeout(() => setShowContent(true), 300);
      setTimeout(() => setShowEvents(true), 600);
    });
    
    // Progress animation
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1.67, 100));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(onContinue, 400);
  };

  // Auto-continue after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleContinue();
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const scrollEvents = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 140;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Full-screen Hero Image with Ken Burns effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={welcomeImage} 
          alt="THE TRIBE Community" 
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${isVisible ? 'scale-110' : 'scale-100'}`}
        />
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      </div>
      
      {/* Skip button */}
      <button 
        onClick={handleContinue}
        className="absolute top-8 right-6 z-20 text-white/30 text-[10px] font-medium tracking-[0.25em] hover:text-white/60 transition-colors duration-300"
      >
        ÜBERSPRINGEN
      </button>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-safe">
        {/* Content Container */}
        <div 
          className={`px-6 pb-6 transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Brand Tag */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-primary/80 text-[10px] font-medium tracking-[0.4em] uppercase">
              Welcome to the Community
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl font-light text-white tracking-wide mb-1.5 leading-tight">
            Hey <span className="text-primary font-normal">{userName}</span>!
          </h1>
          <p className="text-white/50 text-sm font-light mb-5 max-w-[300px] leading-relaxed">
            THE TRIBE verbindet Menschen, die <span className="text-white/80">echte Begegnungen</span> suchen.
          </p>

          {/* Kennenlernabend - Main Highlight Card */}
          <div 
            className={`relative overflow-hidden rounded-2xl mb-4 transition-all duration-700 delay-100 ${showEvents ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-primary/10 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-primary/30 rounded-2xl" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40 shadow-lg shadow-primary/20">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-base">
                      Tribe Kennenlernabend
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-primary/30 text-primary text-[9px] font-semibold tracking-wider rounded-full uppercase border border-primary/40">
                      Jeden Sonntag
                    </span>
                    <span className="text-white/40 text-xs">Café Barcelona</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Unser wöchentlicher Stammtisch – der perfekte Einstieg! 🍻
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* More Community Events - Horizontal Scroll */}
          <div 
            className={`mb-5 transition-all duration-700 delay-200 ${showEvents ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-white/40 text-[10px] font-medium tracking-[0.2em] uppercase">
                Weitere Community Events
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => scrollEvents('left')}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
                </button>
                <button 
                  onClick={() => scrollEvents('right')}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {communityEvents.map((event, i) => (
                <div 
                  key={event.id}
                  className="flex-shrink-0 w-[130px] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  style={{ 
                    scrollSnapAlign: 'start',
                    animationDelay: `${i * 100}ms` 
                  }}
                >
                  <div className="relative h-[72px] overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 text-lg">{event.emoji}</span>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-white text-xs font-medium truncate mb-0.5">
                      {event.title}
                    </h4>
                    <p className="text-white/40 text-[10px] leading-tight">
                      {event.schedule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Icons Row */}
          <div 
            className={`flex justify-between items-center px-4 mb-5 transition-all duration-700 delay-300 ${showEvents ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {[
              { icon: MapPin, label: 'Events' },
              { icon: Users, label: 'Community' },
              { icon: Heart, label: 'Connect' },
              { icon: Sparkles, label: 'MIA AI' },
            ].map((feature, i) => (
              <div 
                key={feature.label}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <feature.icon className="w-4 h-4 text-white/50" />
                </div>
                <span className="text-white/35 text-[9px] tracking-wide">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <span>Entdecke THE TRIBE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Progress Bar */}
          <div className="mt-4 flex justify-center">
            <div className="w-28 h-0.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
