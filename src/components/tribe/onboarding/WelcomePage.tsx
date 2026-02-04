import React, { useEffect, useState } from 'react';
import { ArrowRight, Users, Calendar, Sparkles } from 'lucide-react';
import welcomeImage from '@/assets/welcome/tribe-stammtisch-welcome.png';

interface WelcomePageProps {
  userName: string;
  onContinue: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ userName, onContinue }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade in animation
    requestAnimationFrame(() => {
      setIsVisible(true);
      setTimeout(() => setShowContent(true), 150);
    });
  }, []);

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(onContinue, 300);
  };

  // Auto-continue after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleContinue();
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black flex flex-col transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Hero Image */}
      <div className="relative flex-1 min-h-0">
        <img 
          src={welcomeImage} 
          alt="THE TRIBE Community" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Skip indicator */}
        <button 
          onClick={handleContinue}
          className="absolute top-6 right-6 text-white/40 text-xs tracking-wider hover:text-white/70 transition-colors"
        >
          ÜBERSPRINGEN
        </button>
      </div>

      {/* Content Section */}
      <div 
        className={`relative z-10 px-6 pb-10 pt-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Welcome Text */}
        <div className="text-center mb-6">
          <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase mb-2">
            Willkommen in der Community
          </p>
          <h1 className="text-3xl font-light text-white tracking-wide mb-3">
            Hey, <span className="text-primary font-medium">{userName}</span>! 👋
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
            THE TRIBE ist dein Ort für <span className="text-white/90">echte Begegnungen</span> – 
            ob spontane Treffen, coole Events oder neue Leute kennenlernen.
          </p>
        </div>

        {/* Feature Highlight - Kennenlernabend */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm mb-1">
                Tribe Kennenlernabend
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Jeden Sonntag treffen wir uns zum Stammtisch – der perfekte Einstieg, 
                um die Community kennenzulernen! 🍻
              </p>
            </div>
          </div>
        </div>

        {/* Quick Features */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white/60" />
            </div>
            <span className="text-white/40 text-[10px] tracking-wide">EVENTS</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Users className="w-4 h-4 text-white/60" />
            </div>
            <span className="text-white/40 text-[10px] tracking-wide">COMMUNITY</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white/60" />
            </div>
            <span className="text-white/40 text-[10px] tracking-wide">MIA AI</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Los geht's
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Progress indicator */}
        <div className="flex justify-center mt-4 gap-1">
          <div className="w-8 h-1 rounded-full bg-primary" />
          <div className="w-8 h-1 rounded-full bg-white/20 overflow-hidden">
            <div 
              className="h-full bg-primary/50 animate-[progress_6s_linear]"
              style={{ 
                animation: 'progress 6s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
