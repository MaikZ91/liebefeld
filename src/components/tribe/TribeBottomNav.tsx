import React from 'react';
import { ViewState } from '@/types/tribe';
import { Home, Users } from 'lucide-react';

interface TribeBottomNavProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  hasNewCommunityMessages?: boolean;
}

export const TribeBottomNav: React.FC<TribeBottomNavProps> = ({ currentView, onViewChange, hasNewCommunityMessages }) => {
  const navItems = [
    { view: ViewState.COMMUNITY, icon: Users, label: 'Community', hasNotification: hasNewCommunityMessages },
    { view: ViewState.FEED, icon: Home, label: 'Explore' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/[0.06] max-w-2xl mx-auto w-full">
      <div className="flex justify-around items-center h-11 px-6">
        {navItems.map(({ view, icon: Icon, label, hasNotification }) => {
          const isActive = currentView === view;
          
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                isActive 
                  ? 'bg-gold/15 text-gold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {Icon && <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />}
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isActive ? 'text-gold' : ''
              }`}>{label}</span>
              {hasNotification && !isActive && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-gold rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
