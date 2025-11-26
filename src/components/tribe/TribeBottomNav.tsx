import React from 'react';
import { ViewState } from '@/types/tribe';
import { Home, Sparkles, Users, Map } from 'lucide-react';

interface TribeBottomNavProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const TribeBottomNav: React.FC<TribeBottomNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { view: ViewState.FEED, icon: Home, label: 'Feed' },
    { view: ViewState.TRIBE_AI, icon: Sparkles, label: 'AI' },
    { view: ViewState.COMMUNITY, icon: Users, label: 'Community' },
    { view: ViewState.MAP, icon: Map, label: 'Map' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-md mx-auto px-4 pb-4">
        <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map(({ view, icon: Icon, label }) => {
              const isActive = currentView === view;
              return (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gold/20 text-gold' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
