import React from 'react';
import { ViewState } from '@/types/tribe';
import { Home, Sparkles, Users, Map } from 'lucide-react';

interface TribeBottomNavProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  hasNewCommunityMessages?: boolean;
}

export const TribeBottomNav: React.FC<TribeBottomNavProps> = ({ currentView, onViewChange, hasNewCommunityMessages }) => {
  const navItems = [
    { view: ViewState.FEED, icon: Home, label: 'Home' },
    { view: ViewState.MAP, icon: Map, label: 'Map' },
    { view: ViewState.COMMUNITY, icon: Users, label: 'Community', hasNotification: hasNewCommunityMessages, isCenterButton: true },
    { view: ViewState.PROFILE, icon: null, label: '', isPlaceholder: true },
    { view: ViewState.TRIBE_AI, icon: Sparkles, label: 'MIA' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 px-4 py-2 flex justify-around items-end max-w-2xl mx-auto w-full backdrop-blur-lg">
      {navItems.map(({ view, icon: Icon, label, hasNotification, isCenterButton, isPlaceholder }) => {
        if (isPlaceholder) return <div key={view} className="w-16" />;
        
        const isActive = currentView === view;
        
        if (isCenterButton) {
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className="relative -mt-6 flex flex-col items-center"
            >
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-gold shadow-[0_0_20px_rgba(209,176,122,0.4)]' 
                  : 'bg-zinc-900 border border-zinc-800'
              }`}>
                {Icon && <Icon size={24} strokeWidth={1.5} className={isActive ? 'text-black' : 'text-white'} />}
                {hasNotification && !isActive && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-pulse border-2 border-black" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-ping" />
                  </>
                )}
              </div>
              <span className={`text-[9px] font-medium uppercase tracking-wider mt-1 ${
                isActive ? 'text-gold' : 'text-zinc-600'
              }`}>{label}</span>
            </button>
          );
        }
        
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`relative flex flex-col items-center gap-1 p-2 ${
              isActive ? 'text-white' : 'text-zinc-600'
            }`}
          >
            <div className="relative">
              {Icon && <Icon size={20} strokeWidth={1.5} />}
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
