import React, { useEffect, useState } from 'react';
import { ArrowRight, Users, MapPin, Sparkles, Heart } from 'lucide-react';
import welcomeImage from '@/assets/welcome/tribe-stammtisch-welcome.png';

interface WelcomePageProps {
  userName: string;
  onContinue: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ userName, onContinue }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Staggered fade in animation
    requestAnimationFrame(() => {
      setIsVisible(true);
      setTimeout(() => setShowContent(true), 300);
      setTimeout(() => setShowFeatures(true), 600);
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
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
          className={`px-6 pb-8 transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Brand Tag */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-primary/80 text-[10px] font-medium tracking-[0.4em] uppercase">
              Welcome to the Community
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-light text-white tracking-wide mb-2 leading-tight">
            Hey <span className="text-primary font-normal">{userName}</span>!
          </h1>
          <p className="text-white/50 text-sm font-light mb-6 max-w-[280px] leading-relaxed">
            Schön, dass du da bist. THE TRIBE verbindet Menschen, 
            die <span className="text-white/80">echte Begegnungen</span> suchen.
          </p>

          {/* Kennenlernabend Highlight Card */}
          <div 
            className={`relative overflow-hidden rounded-2xl mb-6 transition-all duration-700 delay-200 ${showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-primary/20 rounded-2xl" />
            
            <div className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-base">
                      Tribe Kennenlernabend
                    </h3>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-medium tracking-wider rounded-full uppercase">
                      Sonntags
                    </span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Unser wöchentlicher Stammtisch – der perfekte Einstieg, 
                    um die Community kennenzulernen! 🍻
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Icons */}
          <div 
            className={`flex justify-between items-center px-2 mb-8 transition-all duration-700 delay-300 ${showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {[
              { icon: MapPin, label: 'Events entdecken' },
              { icon: Users, label: 'Leute treffen' },
              { icon: Heart, label: 'Connections' },
              { icon: Sparkles, label: 'MIA AI' },
            ].map((feature, i) => (
              <div 
                key={feature.label}
                className="flex flex-col items-center gap-2"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <feature.icon className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-white/40 text-[9px] tracking-wide text-center leading-tight max-w-[60px]">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <span>Entdecke THE TRIBE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Progress Bar */}
          <div className="mt-5 flex justify-center">
            <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
