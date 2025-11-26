import React from 'react';
import { ViewState } from '@/types/tribe';
import { Home, Sparkles, Users, Map } from 'lucide-react';

interface TribeBottomNavProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const TribeBottomNav: React.FC<TribeBottomNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { view: ViewState.FEED, icon: Home, label: 'Home' },
    { view: ViewState.TRIBE_AI, icon: Sparkles, label: 'MIA' },
    { view: ViewState.COMMUNITY, icon: Users, label: 'Community' },
    { view: ViewState.MAP, icon: Map, label: 'Map' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 px-6 py-2 flex justify-between items-center max-w-2xl mx-auto w-full backdrop-blur-lg">
      {navItems.map(({ view, icon: Icon, label }) => {
        const isActive = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex flex-col items-center gap-1 p-2 ${
              isActive ? 'text-white' : 'text-zinc-600'
            }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
