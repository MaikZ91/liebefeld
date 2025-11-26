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
    { view: ViewState.TRIBE_AI, icon: Sparkles, label: 'MIA' },
    { view: ViewState.COMMUNITY, icon: Users, label: 'Community', hasNotification: hasNewCommunityMessages },
    { view: ViewState.MAP, icon: Map, label: 'Map' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 px-6 py-2 flex justify-between items-center max-w-2xl mx-auto w-full backdrop-blur-lg">
      {navItems.map(({ view, icon: Icon, label, hasNotification }) => {
        const isActive = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`relative flex flex-col items-center gap-1 p-2 ${
              isActive ? 'text-white' : 'text-zinc-600'
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={1.5} />
              {hasNotification && !isActive && (
                <>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full animate-ping" />
                </>
              )}
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
